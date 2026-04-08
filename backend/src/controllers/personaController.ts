import { Response } from 'express';
import { prisma } from '../config/database';
import { callMLService } from '../services/mlServiceClient';
import { asyncHandler } from '../utils/helpers';
import AppError from '../utils/AppError';
import { AuthenticatedRequest } from '../types';

/**
 * Get all personas for a specific website
 */
export const getPersonas = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const websiteId = req.params.websiteId as string;

    if (!websiteId) {
        throw new AppError('No website ID provided.', 400);
    }

    const personas = await prisma.persona.findMany({
        where: { websiteId, isActive: true },
        orderBy: {
            stats: {
                sessionCount: 'desc'
            }
        },
        include: {
            stats: true,
            clusterData: {
                include: {
                    behaviorPattern: true
                }
            },
        }
    });
    
    res.json({
        success: true,
        count: personas.length,
        data: { personas }
    });
});

/**
 * Discover new personas using ML
 */
export const discoverPersonas = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.website?.id) {
        throw new AppError('No website context found. Please ensure you are authenticated and have an associated website.', 400);
    }

    const websiteId = req.website.id;
    const { minSessions = 10 } = req.body;

    const sessionCount = await prisma.session.count({ where: { websiteId } });
    if (sessionCount < minSessions) {
        throw new AppError(`Need at least ${minSessions} sessions. Current: ${sessionCount}`, 400);
    }

    const sessions = await prisma.session.findMany({
        where: { websiteId },
        select: {
            id: true,
            fingerprint: true,
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
                        select: { id: true }
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

        const deviceObj = { type: s.deviceInfo?.type || 'unknown' };

        let intentScore = 30; // Default as integer 0-100
        if (s.intentScore?.final != null) intentScore = s.intentScore.final;
        else if (s.intentScore?.initial != null) intentScore = s.intentScore.initial;
        else if (clicks.length > 5) intentScore = 60;

        return {
            _id: s.id,
            device: deviceObj,
            intentScore: Number(intentScore),
            avgScrollDepth: Number(avgScrollDepth),
            totalClicks: Number(clicks.length),
            pageViews: Number(pageViews.length),
            totalTimeSpent: Number(totalTimeSpent),
            pagesVisited: pageViews.map(pv => pv.url).filter(Boolean).slice(0, 10)
        };
    });

    const meaningfulSessions = formattedSessions.filter(
        s => s.totalClicks > 0 || s.pageViews > 0 || s.totalTimeSpent > 0 || s.avgScrollDepth > 0
    );

    if (meaningfulSessions.length < 3) {
        throw new AppError('Not enough meaningful session data for persona discovery', 400);
    }

    const mlPayload = {
        websiteId: websiteId,
        sessionData: meaningfulSessions,
        minClusters: 3,
        maxClusters: 6
    };

    const mlResult = await callMLService('/clustering/discover-personas', mlPayload);

    const createdPersonas = [];
    for (const personaData of mlResult.personas) {
        const persona = await prisma.persona.create({
            data: {
                websiteId,
                name: personaData.name,
                description: personaData.description,
                clusterData: {
                    create: {
                        clusterId: personaData.clusterId,
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
            },
            include: {
                stats: true,
                clusterData: {
                    include: {
                        behaviorPattern: true
                    }
                },
            }
        });

        if (personaData.sessionIds && personaData.sessionIds.length > 0) {
            await prisma.session.updateMany({
                where: { id: { in: personaData.sessionIds }, websiteId },
                data: { personaId: persona.id }
            });
        }
        
        const personaSessionCount = await prisma.session.count({ where: { personaId: persona.id } });
        await prisma.personaStats.upsert({
            where: { personaId: persona.id },
            update: { sessionCount: personaSessionCount, lastUpdated: new Date() },
            create: { personaId: persona.id, sessionCount: personaSessionCount, lastUpdated: new Date() }
        });

        createdPersonas.push(persona);
    }

    await prisma.websiteStats.upsert({
        where: { websiteId: req.website.id },
        update: { totalPersonas: { increment: createdPersonas.length } },
        create: { websiteId: req.website.id, totalPersonas: createdPersonas.length }
    });

    res.json({
        success: true,
        message: `Discovered ${createdPersonas.length} personas`,
        data: { personas: createdPersonas }
    });
});

/**
 * Create a new persona manually
 */
export const createPersona = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name, description, isActive } = req.body;
    const websiteId = req.params.websiteId as string;

    if (!websiteId) {
        throw new AppError('No website ID provided.', 400);
    }

    const persona = await prisma.persona.create({
        data: {
            websiteId,
            name,
            description,
            isActive: isActive !== undefined ? isActive : true,
            isAutoDiscovered: false
        }
    });

    res.status(201).json({
        success: true,
        data: { persona }
    });
});

/**
 * Get single persona
 */
export const getPersona = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const persona = await prisma.persona.findUnique({
        where: { id: req.params.id as string },
        include: {
            stats: true,
            clusterData: {
                include: {
                    behaviorPattern: true
                }
            },
            website: {
                select: { name: true, domain: true }
            }
        }
    });

    if (!persona) throw new AppError('Persona not found', 404);

    if (!req.website?.id || persona.websiteId !== req.website.id) {
        throw new AppError('Not authorized to access this persona.', 403);
    }

    res.json({ success: true, data: { persona } });
});

/**
 * Update persona
 */
export const updatePersona = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name, description, isActive } = req.body;

    const existingPersona = await prisma.persona.findUnique({ where: { id: req.params.id as string } });
    if (!existingPersona) throw new AppError('Persona not found', 404);

    if (!req.website?.id || existingPersona.websiteId !== req.website.id) {
        throw new AppError('Not authorized to update this persona.', 403);
    }

    const persona = await prisma.persona.update({
        where: { id: req.params.id as string },
        data: { name, description, isActive },
        include: {
            stats: true,
            clusterData: {
                include: {
                    behaviorPattern: true
                }
            },
            website: {
                select: { name: true, domain: true }
            }
        }
    });

    res.json({ success: true, data: { persona } });
});

/**
 * Delete a persona
 */
export const deletePersona = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const existingPersona = await prisma.persona.findUnique({ where: { id: id as string } });
    if (!existingPersona) throw new AppError('Persona not found', 404);

    if (!req.website?.id || existingPersona.websiteId !== req.website.id) {
        throw new AppError('Not authorized to delete this persona.', 403);
    }

    await prisma.persona.delete({ where: { id: id as string } });

    res.json({
        success: true,
        message: 'Persona deleted successfully'
    });
});

/**
 * Create personalization rule
 */
export const createPersonalizationRule = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { selector, content, contentType, variation, priority } = req.body;
    
    const persona = await prisma.persona.findUnique({
        where: { id: req.params.id as string }
    });

    if (!persona) throw new AppError('Persona not found', 404);

    if (!req.website?.id || persona.websiteId !== req.website.id) {
        throw new AppError('Not authorized to create personalization rule for this persona.', 403);
    }

    const newRule = await prisma.personalizationRule.create({
        data: {
            selector,
            content,
            contentType: contentType || 'text',
            variation: variation || '',
            priority: priority || 1,
            isActive: true,
            persona: { connect: { id: persona.id } }
        }
    });

    res.status(201).json({ success: true, data: { rule: newRule } });
});
