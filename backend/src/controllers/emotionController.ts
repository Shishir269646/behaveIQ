import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../utils/helpers';
import AppError from '../utils/AppError';
import { AuthenticatedRequest } from '../types';
import * as emotionService from '../services/emotionService';

/**
 * Detect user emotion
 */
export const detectEmotion = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId, sessionId, behaviorData } = req.body;
    const pageUrl = behaviorData?.currentPage || 'unknown';

    const session = await prisma.session.findUnique({
        where: { sessionId: sessionId }
    });

    if (!session) {
        throw new AppError('Session not found', 404);
    }

    const result = await emotionService.detectEmotion(userId, behaviorData, pageUrl);

    await prisma.sessionEmotion.upsert({
        where: { sessionId: session.id },
        update: {
            current: result.emotion as any,
            changes: {
                create: {
                    to: result.emotion as any,
                    timestamp: new Date()
                }
            }
        },
        create: {
            session: { connect: { id: session.id } },
            current: result.emotion as any,
            changes: {
                create: {
                    to: result.emotion as any,
                    timestamp: new Date()
                }
            }
        }
    });

    if (userId) {
        await prisma.userEmotionalProfile.upsert({
            where: { userId: userId },
            update: {
                dominantEmotion: result.emotion as any,
                history: {
                    create: {
                        emotion: result.emotion as any,
                        timestamp: new Date(),
                        page: pageUrl
                    }
                }
            },
            create: {
                userId: userId,
                dominantEmotion: result.emotion as any,
                history: {
                    create: {
                        emotion: result.emotion as any,
                        timestamp: new Date(),
                        page: pageUrl
                    }
                }
            }
        });
    }

    if (!req.website?.id) {
        throw new AppError('Forbidden: A valid API key linked to a registered website is required.', 403);
    }

    const websiteID = req.website.id;

    const response = await emotionService.getEmotionResponse(
        websiteID,
        result.emotion
    );

    res.json({
        success: true,
        data: {
            emotion: result.emotion,
            confidence: result.confidence,
            response
        }
    });
});

/**
 * Get emotion trends
 */
export const getEmotionTrends = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { websiteId, timeRange = '7d' } = req.query;
    if (!req.user?.id) throw new AppError('Not authorized', 401);

    const website = await prisma.website.findUnique({ 
      where: { id: websiteId as string, userId: req.user.id } 
    });
    
    if (!website) {
        throw new AppError('Website not found', 404);
    }

    const days = parseInt(timeRange as string) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const emotionChanges = await prisma.emotionChange.findMany({
        where: {
            sessionEmotion: {
                session: {
                    websiteId: website.id,
                    createdAt: { gte: startDate }
                }
            }
        },
        select: {
            timestamp: true,
            to: true
        },
        orderBy: {
            timestamp: 'asc'
        }
    });

    const emotionTrendsMap = new Map<string, any>();
    emotionChanges.forEach(change => {
        const dateKey = change.timestamp!.toISOString().split('T')[0]!;
        if (!emotionTrendsMap.has(dateKey)) {
            emotionTrendsMap.set(dateKey, {});
        }
        const emotionsForDate = emotionTrendsMap.get(dateKey);
        const emotion = change.to as string;
        emotionsForDate[emotion] = (emotionsForDate[emotion] || 0) + 1;
    });

    const formattedTrends = Array.from(emotionTrendsMap.entries()).map(([date, emotions]) => ({
        date: date,
        ...emotions
    }));

    res.json({
        success: true,
        data: {
            trends: formattedTrends
        }
    });
});
