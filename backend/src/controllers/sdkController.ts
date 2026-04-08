import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../utils/helpers';
import AppError from '../utils/AppError';
import * as mlServiceClient from '../services/mlServiceClient';

/**
 * Get SDK configuration
 */
export const getSDKConfig = asyncHandler(async (req: Request, res: Response) => {
    const apiKey = req.query.apiKey as string;

    if (!apiKey) {
        throw new AppError('API Key is required', 400);
    }

    const website = await prisma.website.findUnique({
        where: { apiKey },
        include: { settings: true }
    });

    if (!website) {
        throw new AppError('Invalid API Key', 401);
    }

    res.json({
        success: true,
        data: {
            websiteId: website.id,
            name: website.name,
            settings: website.settings,
            plan: website.plan,
            status: website.status
        }
    });
});

/**
 * Identify user
 */
export const identifyUser = asyncHandler(async (req: Request, res: Response) => {
    const { apiKey, externalId, traits, fingerprint } = req.body;

    const website = await prisma.website.findUnique({ where: { apiKey } });
    if (!website) {
        throw new AppError('Invalid API Key', 401);
    }

    // Logic to link externalId/traits to a user and session
    // This is a simplified version
    res.json({
        success: true,
        message: 'User identified'
    });
});

/**
 * Track event from SDK
 */
export const trackEvent = asyncHandler(async (req: Request, res: Response) => {
    const { apiKey, sessionId, eventType, eventData, url, timestamp } = req.body;

    const website = await prisma.website.findUnique({ where: { apiKey } });
    if (!website) {
        throw new AppError('Invalid API Key', 401);
    }

    let session = await prisma.session.findUnique({
        where: { sessionId }
    });

    if (!session) {
        session = await prisma.session.create({
            data: {
                sessionId,
                websiteId: website.id,
                fingerprint: req.body.fingerprint || 'unknown',
                startTime: new Date(timestamp || Date.now())
            }
        });
    }

    const event = await prisma.event.create({
        data: {
            sessionId: session.id,
            websiteId: website.id,
            eventType: eventType,
            eventData: eventData || {},
            timestamp: new Date(timestamp || Date.now())
        }
    });

    res.json({
        success: true,
        data: { eventId: event.id }
    });
});

/**
 * Send heartbeat
 */
export const sendHeartbeat = asyncHandler(async (req: Request, res: Response) => {
    const { apiKey, sessionId } = req.body;

    const website = await prisma.website.findUnique({ where: { apiKey } });
    if (!website) {
        throw new AppError('Invalid API Key', 401);
    }

    await prisma.session.update({
        where: { sessionId },
        data: { updatedAt: new Date() }
    });

    res.json({ success: true });
});

/**
 * Get personalization rules
 */
export const getPersonalization = asyncHandler(async (req: Request, res: Response) => {
    const apiKey = req.params.apiKey as string;
    const sessionId = req.params.sessionId as string;

    const website = await prisma.website.findUnique({ 
        where: { apiKey },
        include: { settings: true }
    });
    if (!website) {
        throw new AppError('Invalid API Key', 401);
    }

    const session = await prisma.session.findUnique({
        where: { sessionId: sessionId },
        include: {
            persona: { include: { personalizationRules: true } },
        }
    });

    if (!session) {
        throw new AppError('Session not found', 404);
    }

    const personalizationRules: any[] = [];

    if (website.settings?.autoPersonalization && session.persona) {
        const persona = session.persona;
        if (persona?.isActive) {
            personalizationRules.push(...persona.personalizationRules.filter((r: any) => r.isActive));
        }
    }

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
        data: { personalizationRules }
    });
});

/**
 * Calculate intent score
 */
export const calculateIntent = asyncHandler(async (req: Request, res: Response) => {
    const { apiKey, sessionId, sessionData } = req.body;

    const website = await prisma.website.findUnique({ where: { apiKey } });
    if (!website) {
        throw new AppError('Invalid API Key', 401);
    }

    const session = await prisma.session.findUnique({
        where: { sessionId: sessionId },
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
                websiteId: website.id,
                sessionId: session.id,
                sessionData
            }
        );

        intentScore = mlResult?.score || 0;
    } catch (error: any) {
        console.error('ML intent scoring failed:', error.message);
        intentScore = session.intentScore?.final || 10;
    }

    await prisma.sessionIntentScore.upsert({
        where: { sessionId: session.id },
        update: {
            final: intentScore,
            changes: {
                create: {
                    score: intentScore,
                    timestamp: new Date()
                }
            }
        },
        create: {
            sessionId: session.id,
            final: intentScore,
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
