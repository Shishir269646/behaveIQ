const { prisma } = require('../config/database'); // Import prisma client
const { callMLService } = require('../services/mlServiceClient');
const { asyncHandler } = require('../utils/helpers');
const AppError = require('../utils/AppError');

// Get all personas for a specific website
const getPersonas = asyncHandler(async (req, res) => {
    console.log('--- getPersonas called ---');
    const websiteId = req.params.websiteId;

    if (!websiteId) {
        throw new AppError('No website ID provided.', 400);
    }

    console.log(`Fetching personas for websiteId: ${websiteId}, userId: ${req.user.id}`); // Use req.user.id

    const personas = await prisma.persona.findMany({
        where: { websiteId, isActive: true },
        orderBy: {
            stats: {
                sessionCount: 'desc' // Order by nested field
            }
        },
        include: {
            stats: true, // Include stats to order by sessionCount
            clusterData: true, // Include clusterData if needed in response
        }
    });
    
    res.json({
        success: true,
        count: personas.length,
        data: { personas }
    });
});

// @desc    Discover new personas using ML
// @route   POST /api/v1/personas/discover
const discoverPersonas = asyncHandler(async (req, res) => {
    console.log('--- discoverPersonas called ---');

    if (!req.website || !req.website.id) { // Use req.website.id
        throw new AppError('No website context found. Please ensure you are authenticated and have an associated website.', 400);
    }

    const websiteId = req.website.id; // Use req.website.id
    const { minSessions = 10 } = req.body;

    // Check session count
    const sessionCount = await prisma.session.count({ where: { websiteId } });
    if (sessionCount < minSessions) {
        throw new AppError(`Need at least ${minSessions} sessions. Current: ${sessionCount}`, 400);
    }

    // Get session data
    const sessions = await prisma.session.findMany({
        where: { websiteId },
        select: {
            id: true,
            fingerprint: true, // Include fingerprint for device identification if needed
            intentScore: {
                select: {
                    initial: true,
                    final: true,
                }
            },
            behavior: {
                select: {
                    pageViews: {
                        select: { url: true, timeSpent: true, scrollDepth: true }
                    },
                    clicks: {
                        select: { id: true } // Just need count
                    }
                }
            },
            deviceInfo: {
                select: { type: true }
            }
        },
        take: 1000,
    });

    const formattedSessions = sessions.map(s => {
        const pageViews = s.behavior?.pageViews || [];
        const clicks = s.behavior?.clicks || [];

        const totalTimeSpent = pageViews.reduce((sum, pv) => sum + (pv.timeSpent || 0), 0);
        const avgScrollDepth = pageViews.length
            ? pageViews.reduce((sum, pv) => sum + (pv.scrollDepth || 0), 0) / pageViews.length
            : 0;

        const deviceObj = { type: s.deviceInfo?.type || 'unknown' }; // Access type from deviceInfo

        let intentScore = 0.3;
        if (s.intentScore?.final != null) intentScore = s.intentScore.final;
        else if (s.intentScore?.initial != null) intentScore = s.intentScore.initial;
        else if (clicks.length > 5) intentScore = 0.6;

        return {
            _id: s.id, // Use s.id
            device: deviceObj,
            intentScore: Number(intentScore),
            avgScrollDepth: Number(avgScrollDepth),
            totalClicks: Number(clicks.length),
            pageViews: Number(pageViews.length),
            totalTimeSpent: Number(totalTimeSpent),
            pagesVisited: pageViews.map(pv => pv.url).filter(Boolean).slice(0, 10)
        };
    });

    // Prepare ML payload with exact fields ML expects
    // After mapping sessions to formattedSessions
    const meaningfulSessions = formattedSessions.filter(
        s => s.totalClicks > 0 || s.pageViews > 0 || s.totalTimeSpent > 0 || s.avgScrollDepth > 0
    );

    if (meaningfulSessions.length < 3) {
        throw new AppError('Not enough meaningful session data for persona discovery', 400);
    }

    // Then use meaningfulSessions in ML payload
    const mlPayload = {
        websiteId: websiteId,
        sessionData: meaningfulSessions.map(s => ({
            _id: s._id,
            device: s.device,
            intentScore: Number(s.intentScore),
            avgScrollDepth: Number(s.avgScrollDepth),
            totalClicks: Number(s.totalClicks),
            pageViews: Number(s.pageViews),
            totalTimeSpent: Number(s.totalTimeSpent),
            pagesVisited: s.pagesVisited
        })),
        minClusters: 3,
        maxClusters: 6
    };

    if (mlPayload.sessionData.length < 3) {
        throw new AppError('Not enough meaningful session data for persona discovery', 400);
    }

    // Call ML service
    const mlResult = await callMLService('/clustering/discover-personas', mlPayload);

    // Save discovered personas
    const createdPersonas = [];
    for (const personaData of mlResult.personas) {
        const persona = await prisma.persona.create({
            data: {
                websiteId,
                name: personaData.name,
                description: personaData.description,
                clusterData: {
                    create: { // Create nested PersonaClusterData
                        clusterId: personaData.clusterData.clusterId,
                        avgTimeSpent: personaData.clusterData.avgTimeSpent,
                        avgScrollDepth: personaData.clusterData.avgScrollDepth,
                        avgClickRate: personaData.clusterData.avgClickRate,
                        avgPageViews: personaData.clusterData.avgPageViews,
                        commonPages: personaData.clusterData.commonPages,
                        commonDevices: personaData.clusterData.commonDevices,
                        behaviorPattern: {
                            create: {
                                exploreMore: personaData.clusterData.behaviorPattern.exploreMore,
                                quickDecision: personaData.clusterData.behaviorPattern.quickDecision,
                                priceConscious: personaData.clusterData.behaviorPattern.priceConscious,
                                featureFocused: personaData.clusterData.behaviorPattern.featureFocused,
                            }
                        },
                        confidence: personaData.clusterData.confidence,
                        characteristics: personaData.clusterData.characteristics,
                    }
                },
                isAutoDiscovered: true,
                // sessionIds is not directly mapped, sessions will be connected
            },
            include: {
                stats: true, // Include stats for updateStats call
            }
        });

        // Update sessions to link to the newly created persona
        if (personaData.sessionIds && personaData.sessionIds.length > 0) {
            await prisma.session.updateMany({
                where: { id: { in: personaData.sessionIds }, websiteId },
                data: {
                    personaId: persona.id,
                    persona: { connect: { id: persona.id } } // Explicitly connect to the persona model
                }
            });
        }
        
        // Update Persona stats (equivalent of persona.updateStats())
        // This logic needs to be re-implemented directly using Prisma or a dedicated service.
        // For simplicity, let's assume persona.stats will be calculated or updated elsewhere.
        // A direct equivalent for Mongoose's `updateStats` method on the model does not exist in Prisma.
        // It would typically be a service call or a direct update here.
        // For now, I will manually update the sessionCount for the persona stats.
        const personaSessionCount = await prisma.session.count({ where: { personaId: persona.id } });
        await prisma.personaStats.upsert({
            where: { personaId: persona.id },
            update: { sessionCount: personaSessionCount, lastUpdated: new Date() },
            create: { personaId: persona.id, sessionCount: personaSessionCount, lastUpdated: new Date() }
        });


        createdPersonas.push(persona);
    }

    // Update website stats
    await prisma.website.update({
        where: { id: req.website.id }, // Use req.website.id
        data: {
            stats: {
                upsert: {
                    create: { totalPersonas: createdPersonas.length },
                    update: { totalPersonas: createdPersonas.length }
                }
            }
        }
    });

    res.json({
        success: true,
        message: `Discovered ${createdPersonas.length} personas`,
        data: { personas: createdPersonas }
    });
});

// Other endpoints remain unchanged
const getPersona = asyncHandler(async (req, res) => {
    const persona = await prisma.persona.findUnique({
        where: { id: req.params.id },
        include: {
            website: {
                select: { name: true, domain: true }
            }
        }
    });

    if (!persona) throw new AppError('Persona not found', 404);

    if (!req.website || !req.website.id || persona.websiteId !== req.website.id) { // Use req.website.id
        throw new AppError('Not authorized to access this persona.', 403);
    }

    res.json({ success: true, data: { persona } });
});

const updatePersona = asyncHandler(async (req, res) => {
    const { name, description, isActive } = req.body;

    const existingPersona = await prisma.persona.findUnique({ where: { id: req.params.id } });
    if (!existingPersona) throw new AppError('Persona not found', 404);

    if (!req.website || !req.website.id || existingPersona.websiteId !== req.website.id) { // Use req.website.id
        throw new AppError('Not authorized to update this persona.', 403);
    }

    const persona = await prisma.persona.update({
        where: { id: req.params.id },
        data: { name, description, isActive },
    });

    res.json({ success: true, data: { persona } });
});

const createPersonalizationRule = asyncHandler(async (req, res) => {
    const { selector, content, contentType, variation, priority } = req.body;
    
    const persona = await prisma.persona.findUnique({
        where: { id: req.params.id },
        include: { personalizationRules: true } // Include existing rules to push
    });

    if (!persona) throw new AppError('Persona not found', 404);

    if (!req.website || !req.website.id || persona.websiteId !== req.website.id) { // Use req.website.id
        throw new AppError('Not authorized to create personalization rule for this persona.', 403);
    }

    const newRule = await prisma.personalizationRule.create({
        data: {
            selector,
            content,
            contentType: contentType || 'text',
            variation: variation || '', // variation is not enum
            priority: priority || 1,
            isActive: true,
            createdAt: new Date(),
            persona: { connect: { id: persona.id } } // Connect to the persona
        }
    });

    res.status(201).json({ success: true, data: { rule: newRule } });
});

module.exports = {
    getPersonas,
    discoverPersonas,
    getPersona,
    updatePersona,
    createPersonalizationRule
};