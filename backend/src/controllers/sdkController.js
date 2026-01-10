const Website = require('../models/Website');
const Session = require('../models/Session');
const Persona = require('../models/Persona'); // New Import
const Experiment = require('../models/Experiment'); // New Import
// const { getPersonalization: getPersonalizationService } = require('../services/personalizationService'); // Not needed here, implementing directly
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
    const { apiKey, sessionId } = req.params;

    const website = await Website.findOne({ apiKey });
    if (!website) {
        return res.status(401).json({ success: false, message: 'Invalid API Key' });
    }

    // Find the session to get user's context
    const session = await Session.findOne({ sessionId, websiteId: website._id });
    if (!session) {
        return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const personalizationRules = [];

    // --- Auto-Personalization based on Persona ---
    if (website.settings.autoPersonalization && session.personaId) {
        const persona = await Persona.findById(session.personaId);
        if (persona && persona.isActive) {
            // Filter active personalization rules for this persona
            const activePersonaRules = persona.personalizationRules.filter(rule => rule.isActive);
            personalizationRules.push(...activePersonaRules);
        }
    }

    // --- Experiment Mode Personalization (A/B Testing) ---
    // If experiment mode is active, override or add rules based on active experiments
    // This part assumes that an experiment has assigned a variation to the session
    // and that the SDK will receive this to apply the correct variation.
    if (website.settings.experimentMode && session.experimentId && session.experimentVariation) {
        const experiment = await Experiment.findById(session.experimentId);
        if (experiment && experiment.status === 'active') {
            const assignedVariation = experiment.variations.find(v => v.name === session.experimentVariation);
            if (assignedVariation && !assignedVariation.isControl) {
                personalizationRules.push({
                    selector: assignedVariation.selector,
                    content: assignedVariation.content,
                    contentType: assignedVariation.contentType,
                    variationName: assignedVariation.name,
                    experimentId: experiment._id // Add experiment ID for tracking
                });
            }
        }
    }

    res.json({
        success: true,
        data: {
            personalizationRules: personalizationRules.map(rule => ({
                selector: rule.selector,
                content: rule.content,
                contentType: rule.contentType,
                // Include other relevant fields for the SDK
            }))
        }
    });
});

const Website = require('../models/Website');
const Session = require('../models/Session');
const Persona = require('../models/Persona');
const Experiment = require('../models/Experiment');
const { asyncHandler } = require('../utils/helpers');
const Event = require('../models/Event');
const mlServiceClient = require('../services/mlServiceClient'); // New Import

// ... (existing code)

const calculateIntent = asyncHandler(async (req, res) => {
    const { apiKey, sessionId, sessionData } = req.body; // sessionData contains behavior for scoring

    const website = await Website.findOne({ apiKey });
    if (!website) {
        return res.status(401).json({ success: false, message: 'Invalid API Key' });
    }

    const session = await Session.findOne({ sessionId, websiteId: website._id });
    if (!session) {
        return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Call ML service to calculate intent score
    let intentScore = 0;
    try {
        const mlResult = await mlServiceClient.callMLService('/intent/score', {
            websiteId: website._id.toString(),
            sessionId: session._id.toString(),
            sessionData // Pass behavior data for scoring
        });
        intentScore = mlResult.score || 0;
    } catch (mlError) {
        console.error('ML Service intent scoring error:', mlError.message);
        // Fallback or default intent score if ML service fails
        intentScore = session.intentScore?.current || 0.1; // Use existing or a low default
    }

    // Update session intent score
    session.intentScore.current = intentScore;
    session.intentScore.changes.push({ score: intentScore, timestamp: new Date() });
    await session.save();

    res.json({
        success: true,
        data: {
            intentScore
        }
    });
});




module.exports = {
    getSdkScript,
    trackEvent,
    getPersonalization, // Export new function
    calculateIntent
};