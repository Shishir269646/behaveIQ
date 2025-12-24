const Website = require('../models/Website');
const Session = require('../models/Session');
const { getPersonalization: getPersonalizationService } = require('../services/personalizationService');
const { asyncHandler } = require('../utils/helpers');
const Event = require('../models/Event');


// @desc    Get dynamic SDK script for zero-flicker personalization
// @route   GET /api/v1/sdk/init.js?apiKey=...
exports.getSdkScript = asyncHandler(async (req, res) => {
    const { apiKey } = req.query;

    if (!apiKey) {
        res.setHeader('Content-Type', 'application/javascript');
        return res.status(400).send('// BEHAVEIQ: API Key is missing.');
    }
    
    let personalizationData = { personalizationRules: [] };

    try {
        const website = await Website.findOne({ apiKey });
        if (website && website.status !== 'learning') {
            // This is a simplified version. In a real app, you'd get the session
            // from a cookie or fingerprint to determine the persona.
            // For now, we'll fetch generic rules or rules for a common persona.
            const session = await Session.findOne({ fingerprint: req.headers['x-fingerprint'] }).sort({createdAt: -1});

            if (session) {
                personalizationData = await getPersonalizationService(
                    website._id,
                    session.personaType,
                    session.intentScore,
                    session.personaId
                );
            }
        }
    } catch (e) {
        console.error("Error generating SDK script:", e);
        // Don't block script execution, return empty rules.
        personalizationData = { personalizationRules: [] };
    }

    // Construct the dynamic JavaScript
    const scriptContent = `
(function() {
    // This is the main entry point for the BEHAVEIQ SDK
    if (window.BEHAVEIQ && typeof window.BEHAVEIQ.init === 'function') {
        
        // The personalization data is embedded directly into the script by the server.
        const personalizationOptions = ${JSON.stringify({ personalizationRules: personalizationData.personalizationRules })};
        
        // Initialize the SDK. 
        // The init() function will first apply personalization synchronously
        // and then set up all asynchronous tracking.
        window.BEHAVEIQ.init('${apiKey}', personalizationOptions);
    }
})();
`;

    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(scriptContent);
});

exports.trackEvent = asyncHandler(async (req, res) => {
    const { apiKey, sessionId, eventType, eventData } = req.body;

    const website = await Website.findOne({ apiKey });

    if (!website) {
        return res.status(401).json({ success: false, message: 'Invalid API Key' });
    }

    const event = await Event.create({
        websiteId: website._id,
        sessionId,
        eventType,
        eventData
    });

    res.status(201).json({ success: true, data: event });
});

exports.getPersonalization = asyncHandler(async (req, res) => {
    res.status(200).json({ success: true, data: {} });
});

exports.calculateIntent = asyncHandler(async (req, res) => {
    res.status(200).json({ success: true, data: {} });
});
