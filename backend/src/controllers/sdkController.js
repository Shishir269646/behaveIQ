const { prisma } = require('../config/database'); // Import prisma client
const { asyncHandler } = require('../utils/helpers');
const mlServiceClient = require('../services/mlServiceClient');
const { identify } = require('./identityController');
const AppError = require('../utils/AppError');

//  Get dynamic SDK script
const getSdkScript = asyncHandler(async (req, res) => {
    const { apiKey } = req.query;

    res.setHeader('Content-Type', 'application/javascript');

    if (!apiKey) {
        return res.status(400).send('// BEHAVEIQ: API Key is missing.');
    }

    let personalizationData = { personalizationRules: [] };

    try {
        const website = await prisma.website.findUnique({
            where: { apiKey: apiKey },
            include: { settings: { include: { emotionInterventions: true } } } // Include settings and interventions for potential personalization logic
        });

        if (website && website.status !== 'learning') {
            const fingerprint =
                req.cookies?.biq_fp || req.headers['x-fingerprint'];

            if (fingerprint) {
                const session = await prisma.session.findFirst({
                    where: { fingerprint: fingerprint },
                    orderBy: { createdAt: 'desc' },
                    include: {
                        persona: { select: { name: true, personalizationRules: true } },
                        experiment: { include: { variations: true } }
                    }
                });

                if (session) {
                    // Placeholder – future personalization service logic.
                    // This should be done by a dedicated service. For now, directly replicating logic.
                    const rules = [];

                    // Persona-based personalization
                    if (website.settings?.autoPersonalization && session.persona) {
                        const persona = session.persona;
                        if (persona?.isActive) {
                            rules.push(...persona.personalizationRules.filter(r => r.isActive));
                        }
                    }

                    // Experiment-based personalization
                    if (website.settings?.experimentMode && session.experimentId && session.experimentVariation) {
                        const experiment = session.experiment; // Included in session
                        if (experiment?.status === 'active') {
                            const variation = experiment.variations.find(v => v.name === session.experimentVariation);

                            if (variation && !variation.isControl) {
                                rules.push({
                                    selector: variation.selector,
                                    content: variation.content,
                                    contentType: variation.contentType,
                                    experimentId: experiment.id,
                                    variationName: variation.name
                                });
                            }
                        }
                    }
                    personalizationData = { personalizationRules: rules };
                }
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

// Track SDK event
const trackEvent = asyncHandler(async (req, res) => {
    const { apiKey, sessionId, eventType, eventData } = req.body;

    const website = await prisma.website.findUnique({ where: { apiKey } });
    if (!website) {
        throw new AppError('Invalid API Key', 401);
    }

    // Ensure session exists
    const session = await prisma.session.findUnique({ where: { sessionId: sessionId, websiteId: website.id } });
    if (!session) {
        throw new AppError('Session not found', 404);
    }

    const event = await prisma.event.create({
        data: {
            websiteId: website.id,
            sessionId: sessionId,
            eventType: eventType, // Ensure eventType matches enum
            eventData: eventData,
        }
    });

    res.status(201).json({ success: true, data: event });
});


// Get personalization rules
const getPersonalization = asyncHandler(async (req, res) => {
    const { apiKey, sessionId } = req.params;

    const website = await prisma.website.findUnique({ where: { apiKey } });
    if (!website) {
        throw new AppError('Invalid API Key', 401);
    }

    const session = await prisma.session.findUnique({
        where: { sessionId: sessionId, websiteId: website.id },
        include: {
            persona: { include: { personalizationRules: true } },
            // If experiment is stored on Session directly or linked
            // experiment: { include: { variations: true } } // This requires Experiment relation on Session
        }
    });

    if (!session) {
        throw new AppError('Session not found', 404);
    }

    const personalizationRules = [];

    // Persona-based personalization
    if (website.settings?.autoPersonalization && session.persona) {
        const persona = session.persona;
        if (persona?.isActive) {
            personalizationRules.push(...persona.personalizationRules.filter(r => r.isActive));
        }
    }

    // Experiment-based personalization
    // This part assumes session has experimentId and experimentVariation directly
    if (website.settings?.experimentMode && session.experimentId && session.experimentVariation) {
        const experiment = await prisma.experiment.findUnique({
            where: { id: session.experimentId },
            include: { variations: true }
        });

        if (experiment?.status === 'active') {
            const variation = experiment.variations.find(v => v.name === session.experimentVariation);

            if (variation && !variation.isControl) {
                personalizationRules.push({
                    selector: variation.selector,
                    content: variation.content,
                    contentType: variation.contentType,
                    experimentId: experiment.id,
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


// Calculate intent score
const calculateIntent = asyncHandler(async (req, res) => {
    const { apiKey, sessionId, sessionData } = req.body;

    const website = await prisma.website.findUnique({ where: { apiKey } });
    if (!website) {
        throw new AppError('Invalid API Key', 401);
    }

    const session = await prisma.session.findUnique({
        where: { sessionId: sessionId, websiteId: website.id },
        include: { intentScore: true }
    });

    if (!session) {
        throw new AppError('Session not found', 404);
    }

    let intentScore = 0;

    try {
        const mlResult = await mlServiceClient.callMLService(
            '/intent/score',
            {
                websiteId: website.id, // Use website.id
                sessionId: session.id, // Use session.id
                sessionData
            }
        );

        intentScore = mlResult?.score || 0;
    } catch (error) {
        console.error('ML intent scoring failed:', error.message);
        // Fallback to existing intent score if ML fails
        intentScore = session.intentScore?.current || 0.1;
    }

    // Update session intent score
    await prisma.sessionIntentScore.upsert({
        where: { sessionId: session.id }, // Use sessionId for upsert
        update: {
            current: intentScore,
            changes: {
                create: {
                    score: intentScore,
                    timestamp: new Date()
                }
            }
        },
        create: {
            sessionId: session.id,
            current: intentScore,
            changes: {
                create: {
                    score: intentScore,
                    timestamp: new Date()
                }
            }
        }
    });

    res.json({
        success: true,
        data: { intentScore }
    });
});


// Exports
module.exports = {
    getSdkScript,
    trackEvent,
    getPersonalization,
    calculateIntent
};