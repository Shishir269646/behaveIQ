import { prisma } from '../config/database';
import * as emotionService from './emotionService';
import { EmotionType, CartActionType, EventType } from '@prisma/client';
import AppError from '../utils/AppError';

/**
 * Process and save click event for heatmaps
 */
export const processClickEvent = async (websiteId: string, sessionBehaviorId: string, eventData: any) => {
    if (typeof eventData.x === 'number' && typeof eventData.y === 'number') {
        await prisma.click.create({
            data: {
                websiteId,
                sessionBehaviorId,
                pageUrl: eventData.pageUrl,
                x: eventData.x,
                y: eventData.y,
                timestamp: new Date()
            }
        });
    }
};

/**
 * Track a behavior event from the SDK, including session and emotion processing
 */
export const trackBehaviorEvent = async (apiKey: string, data: any) => {
    const website = await prisma.website.findUnique({ where: { apiKey } });

    if (!website) {
        throw new AppError('A valid API key is required.', 403);
    }

    const { sessionId, eventType, eventData } = data;
    const websiteId = website.id;

    // Find the session first to get the correct internal UUID 'id'
    const session = await prisma.session.findUnique({ where: { sessionId } });
    if (!session) {
        console.error(`[BehaviorService] Session not found for sessionId: ${sessionId}`);
        throw new AppError('Session not found', 404);
    }

    // Record the general event
    await prisma.event.create({
        data: {
            sessionId: session.id,
            websiteId,
            eventType: eventType as EventType,
            eventData: { ...eventData },
            timestamp: new Date()
        }
    });

    let sessionBehavior = await prisma.sessionBehavior.findUnique({
        where: { sessionId: session.id },
    });

    if (!sessionBehavior) {
        sessionBehavior = await prisma.sessionBehavior.create({
            data: {
                sessionId: session.id,
                websiteId
            }
        });
    }

    // Process specific event types
    switch (eventType) {
        case 'pageview':
            await prisma.pageView.create({
                data: {
                    url: eventData.pageUrl || eventData.url,
                    timestamp: new Date(eventData.timestamp || Date.now()),
                    timeSpent: eventData.timeSpent || 0,
                    scrollDepth: eventData.scrollDepth || 0,
                    sessionBehavior: { connect: { id: sessionBehavior.id } }
                }
            });
            break;
        case 'click':
            await processClickEvent(websiteId, sessionBehavior.id, eventData);
            break;
        case 'mouse_move':
            await handleMouseMovements(sessionBehavior.id, eventData);
            break;
        case 'cart_action':
            await prisma.cartAction.create({
                data: {
                    action: eventData.action as CartActionType,
                    productId: eventData.productId,
                    timestamp: new Date(eventData.timestamp || Date.now()),
                    sessionBehavior: { connect: { id: sessionBehavior.id } }
                }
            });
            break;
    }

    // Detect emotions based on interactions
    return await processEmotionalResponse(session, eventType, eventData);
};

/**
 * Internal helper to handle mouse movement data
 */
async function handleMouseMovements(sessionBehaviorId: string, eventData: any) {
    if (Array.isArray(eventData.movements)) {
        await Promise.all(eventData.movements.map((move: any) => 
            prisma.mouseMove.create({
                data: {
                    x: move.x,
                    y: move.y,
                    timestamp: new Date(move.timestamp || Date.now()),
                    sessionBehavior: { connect: { id: sessionBehaviorId } }
                }
            })
        ));
    } else if (typeof eventData.x === 'number' && typeof eventData.y === 'number') {
        await prisma.mouseMove.create({
            data: {
                x: eventData.x,
                y: eventData.y,
                timestamp: new Date(eventData.timestamp || Date.now()),
                sessionBehavior: { connect: { id: sessionBehaviorId } }
            }
        });
    }
}

/**
 * Internal helper to process emotion detection and response
 */
async function processEmotionalResponse(session: any, eventType: string, eventData: any) {
    if (eventType !== 'mouse_move' && eventType !== 'scroll') {
        return null;
    }

    const sessionWithDetails = await prisma.session.findUnique({
        where: { id: session.id },
        include: {
            behavior: {
                include: {
                    mouseMovements: { take: 100, orderBy: { timestamp: 'desc' } },
                    pageViews: { take: 10, orderBy: { timestamp: 'desc' } },
                    clicks: { take: 50, orderBy: { timestamp: 'desc' } }
                }
            }
        }
    });

    if (!sessionWithDetails?.behavior || sessionWithDetails.behavior.mouseMovements.length <= 10) {
        return null;
    }

    const emotionResult = await emotionService.detectEmotion(
        sessionWithDetails.userId || undefined, 
        {
            mouseMovements: sessionWithDetails.behavior.mouseMovements,
            scrollData: sessionWithDetails.behavior.pageViews,
            clickData: sessionWithDetails.behavior.clicks,
            timeOnPage: sessionWithDetails.startTime ? Date.now() - sessionWithDetails.startTime.getTime() : 0
        }, 
        eventData.pageUrl
    );

    await prisma.sessionEmotion.upsert({
        where: { sessionId: session.id },
        update: {
            current: emotionResult.emotion as EmotionType,
            changes: {
                create: {
                    to: emotionResult.emotion as EmotionType,
                    timestamp: new Date()
                }
            }
        },
        create: {
            sessionId: session.id,
            current: emotionResult.emotion as EmotionType,
            changes: {
                create: {
                    to: emotionResult.emotion as EmotionType,
                    timestamp: new Date()
                }
            }
        }
    });

    const recommendation = await emotionService.getEmotionResponse(session.websiteId, emotionResult.emotion);

    return {
        emotion: emotionResult.emotion,
        response: recommendation
    };
}

/**
 * Get behavior summary for a session
 */
export const getSessionBehaviorSummary = async (sessionId: string) => {
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
            behavior: {
                include: {
                    pageViews: true,
                    clicks: true
                }
            },
            emotion: true,
            intentScore: true
        }
    });

    if (!session) {
        throw new AppError('Session behavior data not found', 404);
    }

    return {
        pageViewsCount: session.behavior?.pageViews?.length || 0,
        clicksCount: session.behavior?.clicks?.length || 0,
        totalTimeSpent: session.startTime ? Date.now() - session.startTime.getTime() : 0,
        currentEmotion: session.emotion?.current,
        lastIntentScore: session.intentScore?.final
    };
};
