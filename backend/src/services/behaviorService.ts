import { prisma } from '../config/database';
import * as emotionService from './emotionService';
import { EmotionType, CartActionType, EventType } from '@prisma/client';

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
 * Track a behavior event
 */
export const trackEvent = async (website: any, data: any) => {
    const { sessionId, eventType, eventData } = data;
    const websiteId = website.id;

    // Find the session first to get the correct UUID 'id'
    const session = await prisma.session.findUnique({ where: { sessionId } });
    if (!session) {
        console.error(`Session with sessionId ${sessionId} not found for behavior update.`);
        return null;
    }

    // Create general event using session.id (UUID)
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
                websiteId: website.id
            }
        });
    }

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
            if (Array.isArray(eventData.movements)) {
                await Promise.all(eventData.movements.map((move: any) => 
                    prisma.mouseMove.create({
                        data: {
                            x: move.x,
                            y: move.y,
                            timestamp: new Date(move.timestamp || Date.now()),
                            sessionBehavior: { connect: { id: sessionBehavior.id } }
                        }
                    })
                ));
            } else if (typeof eventData.x === 'number' && typeof eventData.y === 'number') {
                await prisma.mouseMove.create({
                    data: {
                        x: eventData.x,
                        y: eventData.y,
                        timestamp: new Date(eventData.timestamp || Date.now()),
                        sessionBehavior: { connect: { id: sessionBehavior.id } }
                    }
                });
            }
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

    // Emotion detection on interaction
    if (eventType === 'mouse_move' || eventType === 'scroll') {
        const sessionWithBehavior = await prisma.session.findUnique({
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

        if (sessionWithBehavior?.behavior && sessionWithBehavior.behavior.mouseMovements.length > 10) {
            const emotionResult = await emotionService.detectEmotion(sessionWithBehavior.userId || undefined, {
                mouseMovements: sessionWithBehavior.behavior.mouseMovements,
                scrollData: sessionWithBehavior.behavior.pageViews,
                clickData: sessionWithBehavior.behavior.clicks,
                timeOnPage: sessionWithBehavior.startTime ? Date.now() - sessionWithBehavior.startTime.getTime() : 0
            }, eventData.pageUrl);

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

            const response = await emotionService.getEmotionResponse(session.websiteId, emotionResult.emotion);

            return {
                emotion: emotionResult.emotion,
                response
            };
        }
    }

    return null;
};

/**
 * Get behavior summary
 */
export const getSummary = async (sessionId: string) => {
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

    if (!session) return null;

    return {
        pageViews: session.behavior?.pageViews?.length || 0,
        clicks: session.behavior?.clicks?.length || 0,
        timeSpent: session.startTime ? Date.now() - session.startTime.getTime() : 0,
        emotion: session.emotion?.current,
        intentScore: session.intentScore?.final
    };
};
