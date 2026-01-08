const Website = require('../models/Website');
const Session = require('../models/Session');
const { getPersonalization: getPersonalizationService } = require('../services/personalizationService');
const { asyncHandler } = require('../utils/helpers');
const Event = require('../models/Event');


// @desc    Get dynamic SDK script for zero-flicker personalization
// @route   GET /api/v1/sdk/init.js?apiKey=...
const getSdkScript = asyncHandler(async (req, res) => {
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
            const session = await Session.findOne({ fingerprint: req.cookies.biq_fp || req.headers['x-fingerprint'] }).sort({ createdAt: -1 });

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

    const sdkBaseUrl = process.env.SDK_BASE_URL || 'http://localhost:3000/behaveiq.min.js';

    // Construct the dynamic JavaScript
    const scriptContent = `
(function() {
    const loadScript = (url, callback) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = callback;
        script.onerror = () => console.error('Failed to load BEHAVEIQ SDK from:', url);
        document.head.appendChild(script);
    };

    const initializeSdk = () => {
        if (window.BEHAVEIQ && typeof window.BEHAVEIQ.init === 'function') {
            const personalizationOptions = ${JSON.stringify({ personalizationRules: personalizationData.personalizationRules })};
            window.BEHAVEIQ.init('${apiKey}', personalizationOptions);
        } else {
            console.error('BEHAVEIQ SDK (window.BEHAVEIQ) not found after loading.');
        }
    };

    // Load the main SDK bundle first, then initialize
    loadScript('${sdkBaseUrl}', initializeSdk);
})();
`;

    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(scriptContent);
});

const trackEvent = asyncHandler(async (req, res) => {
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

const getPersonalization = asyncHandler(async (req, res) => {
    res.status(200).json({ success: true, data: {} });
});

const calculateIntent = asyncHandler(async (req, res) => {
    res.status(200).json({ success: true, data: {} });
});



module.exports = {
    getSdkScript,
    trackEvent,
    getPersonalization,
    calculateIntent
};