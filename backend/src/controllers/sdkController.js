// =======================
// Imports (ONLY ONCE)
// =======================
const Website = require('../models/Website');
const Session = require('../models/Session');
const Persona = require('../models/Persona');
const Experiment = require('../models/Experiment');
const Event = require('../models/Event');

const { asyncHandler } = require('../utils/helpers');
const mlServiceClient = require('../services/mlServiceClient');
const { identify } = require('./identityController');

// =======================
// @desc    Get dynamic SDK script
// @route   GET /api/v1/sdk/init.js?apiKey=...
// =======================
const getSdkScript = asyncHandler(async (req, res) => {
    const { apiKey } = req.query;

    res.setHeader('Content-Type', 'application/javascript');

    if (!apiKey) {
        return res.status(400).send('// BEHAVEIQ: API Key is missing.');
    }

    let personalizationData = { personalizationRules: [] };

    try {
        const website = await Website.findOne({ apiKey });

        if (website && website.status !== 'learning') {
            const fingerprint =
                req.cookies?.biq_fp || req.headers['x-fingerprint'];

            const session = await Session.findOne({ fingerprint })
                .sort({ createdAt: -1 });

            if (session) {
                // Placeholder – future personalization service
                personalizationData = {
                    personalizationRules: []
                };
            }
        }
    } catch (error) {
        console.error('Error generating SDK script:', error);
        personalizationData = { personalizationRules: [] };
    }

    const sdkBaseUrl =
        process.env.SDK_BASE_URL ||
        '../../../sdk/dist/behaveiq.min.js';

    const scriptContent = `
(function() {
    const loadScript = (url, callback) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = callback;
        script.onerror = () => console.error('Failed to load BEHAVEIQ SDK:', url);
        document.head.appendChild(script);
    };

    const initializeSdk = () => {
        if (window.BEHAVEIQ && typeof window.BEHAVEIQ.init === 'function') {
            window.BEHAVEIQ.init(
                '${apiKey}',
                ${JSON.stringify(personalizationData)}
            );
        } else {
            console.error('BEHAVEIQ SDK not found after loading.');
        }
    };

    loadScript('${sdkBaseUrl}', initializeSdk);
})();
`;

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(scriptContent);
});

const track = asyncHandler(async (req, res) => {
    const { apiKey, sessionId, eventType, eventData } = req.body;

    const website = await Website.findOne({ apiKey });
    if (!website) {
        return res
            .status(401)
            .json({ success: false, message: 'Invalid API Key' });
    }

    const event = await Event.create({
        websiteId: website._id,
        sessionId,
        eventType,
        eventData
    });

    res.status(201).json({ success: true, data: event });
});

// =======================
// @desc    Track SDK event
// @route   POST /api/v1/sdk/event
// =======================
const trackEvent = asyncHandler(async (req, res) => {
    const { apiKey, eventType, eventData } = req.body;

    const website = await Website.findOne({ apiKey });
    if (!website) {
        return res
            .status(401)
            .json({ success: false, message: 'Invalid API Key' });
    }

    const event = await Event.create({
        websiteId: website._id,
        sessionId: req.session._id,
        eventType,
        eventData
    });

    res.status(201).json({ success: true, data: event });
});

// =======================
// @desc    Get personalization rules
// @route   GET /api/v1/sdk/personalization/:apiKey/:sessionId
// =======================
const getPersonalization = asyncHandler(async (req, res) => {
    const { apiKey, sessionId } = req.params;

    const website = await Website.findOne({ apiKey });
    if (!website) {
        return res
            .status(401)
            .json({ success: false, message: 'Invalid API Key' });
    }

    const session = await Session.findOne({
        sessionId,
        websiteId: website._id
    });

    if (!session) {
        return res
            .status(404)
            .json({ success: false, message: 'Session not found' });
    }

    const personalizationRules = [];

    // Persona-based personalization
    if (website.settings?.autoPersonalization && session.personaId) {
        const persona = await Persona.findById(session.personaId);
        if (persona?.isActive) {
            personalizationRules.push(
                ...persona.personalizationRules.filter(r => r.isActive)
            );
        }
    }

    // Experiment-based personalization
    if (
        website.settings?.experimentMode &&
        session.experimentId &&
        session.experimentVariation
    ) {
        const experiment = await Experiment.findById(session.experimentId);
        if (experiment?.status === 'active') {
            const variation = experiment.variations.find(
                v => v.name === session.experimentVariation
            );

            if (variation && !variation.isControl) {
                personalizationRules.push({
                    selector: variation.selector,
                    content: variation.content,
                    contentType: variation.contentType,
                    experimentId: experiment._id,
                    variationName: variation.name
                });
            }
        }
    }

    res.json({
        success: true,
        data: {
            personalizationRules
        }
    });
});

// =======================
// @desc    Calculate intent score
// @route   POST /api/v1/sdk/intent
// =======================
const calculateIntent = asyncHandler(async (req, res) => {
    const { apiKey, sessionId, sessionData } = req.body;

    const website = await Website.findOne({ apiKey });
    if (!website) {
        return res
            .status(401)
            .json({ success: false, message: 'Invalid API Key' });
    }

    const session = await Session.findOne({
        sessionId,
        websiteId: website._id
    });

    if (!session) {
        return res
            .status(404)
            .json({ success: false, message: 'Session not found' });
    }

    let intentScore = 0;

    try {
        const mlResult = await mlServiceClient.callMLService(
            '/intent/score',
            {
                websiteId: website._id.toString(),
                sessionId: session._id.toString(),
                sessionData
            }
        );

        intentScore = mlResult?.score || 0;
    } catch (error) {
        console.error('ML intent scoring failed:', error.message);
        intentScore = session.intentScore?.current || 0.1;
    }

    session.intentScore = session.intentScore || { current: 0, changes: [] };
    session.intentScore.current = intentScore;
    session.intentScore.changes.push({
        score: intentScore,
        timestamp: new Date()
    });

    await session.save();

    res.json({
        success: true,
        data: { intentScore }
    });
});

// =======================
// Exports
// =======================
module.exports = {
    getSdkScript,
    trackEvent,
    getPersonalization,
    calculateIntent
};
