const { prisma } = require('../config/database');
const emotionService = require('./emotionService');

/**
 * Process and save click event for heatmaps
 */
exports.processClickEvent = async (websiteId, sessionBehaviorId, eventData) => {
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
exports.trackEvent = async (website, data) => {
    const { userId, sessionId, eventType, eventData } = data;
    const websiteId = website.id;

    // Find the session first to get the correct UUID 'id'
    const session = await prisma.session.findUnique({ where: { sessionId } });
    if (!session) {
        console.error(`Session with sessionId ${sessionId} not found for behavior update.`);
        return null; // Or throw an error, depending on desired behavior
    }

    // Create general event using session.id (UUID)
    await prisma.event.create({
        data: {
            sessionId: session.id, // Use session.id (UUID)
            websiteId,
            eventType, // Assuming eventType string matches Prisma EventType enum for now
            eventData: { ...eventData },
            timestamp: new Date()
        }
    });

    // Specific click processing - Handled in the switch below, removed redundant buggy call
    /* 
    if (eventType === 'click') {
        await this.processClickEvent(websiteId, eventData);
    }
    */

    let sessionBehavior = await prisma.sessionBehavior.findUnique({
        where: { sessionId: session.id },
        include: { pageViews: true, clicks: true, mouseMovements: true, cartActions: true }
    });

    if (!sessionBehavior) {
        sessionBehavior = await prisma.sessionBehavior.create({
            data: {
                session: { connect: { id: session.id } },
                website: { connect: { id: website.id } }
            },
            include: { pageViews: true, clicks: true, mouseMovements: true, cartActions: true }
        });
    }

    const newEventData = { ...eventData, timestamp: new Date() };

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
            // Call the refactored processClickEvent to handle Click creation with sessionBehaviorId
            await this.processClickEvent(websiteId, sessionBehavior.id, eventData);
            break;
        case 'mouse_move':
            // Handle array of movements (standard for the SDK)
            if (Array.isArray(eventData.movements)) {
                await Promise.all(eventData.movements.map(move => 
                    prisma.mouseMove.create({
                        data: {
                            x: move.x,
                            y: move.y,
                            timestamp: new Date(move.timestamp || Date.now()),
                            sessionBehavior: { connect: { id: sessionBehavior.id } }
                        }
                    })
                ));
            } 
            // Handle single movement if provided directly in eventData
            else if (typeof eventData.x === 'number' && typeof eventData.y === 'number') {
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
                    action: eventData.action,
                    productId: eventData.productId,
                    timestamp: new Date(eventData.timestamp || Date.now()),
                    sessionBehavior: { connect: { id: sessionBehavior.id } }
                }
            });
            break;
        // Add other event types as needed
    }


    // Emotion detection on interaction
    if (eventType === 'mouse_move' || eventType === 'scroll') {
        // Fetch behavior data for the session if we have enough movements
        const sessionWithBehavior = await prisma.session.findUnique({
            where: { id: session.id },
            include: {
                behavior: {
                    include: {
                        mouseMovements: true,
                        pageViews: true,
                        clicks: true
                    }
                }
            }
        });

        // Ensure session, behavior, and required behavior components exist
        if (sessionWithBehavior && sessionWithBehavior.behavior && sessionWithBehavior.behavior.mouseMovements && sessionWithBehavior.behavior.mouseMovements.length > 10) {
            const emotionResult = await emotionService.detectEmotion(sessionWithBehavior.userId, { // Assuming userId is available on session
                mouseMovements: sessionWithBehavior.behavior.mouseMovements,
                scrollData: sessionWithBehavior.behavior.pageViews,
                clickData: sessionWithBehavior.behavior.clicks,
                timeOnPage: sessionWithBehavior.startTime ? Date.now() - sessionWithBehavior.startTime.getTime() : 0 // Adjusting for Prisma's DateTime
            }, eventData.pageUrl);

            // Update session emotion in database
            await prisma.sessionEmotion.upsert({
                where: { sessionId: session.id },
                update: {
                    current: emotionResult.emotion,
                    changes: {
                        create: {
                            to: emotionResult.emotion,
                            timestamp: new Date()
                        }
                    }
                },
                create: {
                    session: { connect: { id: session.id } },
                    current: emotionResult.emotion,
                    changes: {
                        create: {
                            to: emotionResult.emotion,
                            timestamp: new Date()
                        }
                    }
                }
            });

            const response = await emotionService.getEmotionResponse(session.websiteId, emotionResult.emotion); // Assuming websiteId is available on session

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
exports.getSummary = async (sessionId) => {
    // sessionId here might be the SDK string session_... or the database UUID
    // Try both or look up by sessionId field first
    const session = await prisma.session.findUnique({
        where: { sessionId },
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
        timeSpent: session.startTime ? Date.now() - session.startTime.getTime() : 0, // Adjusting for Prisma's DateTime
        emotion: session.emotion?.dominantEmotion, // Assuming emotion.current maps to dominantEmotion in Prisma
        intentScore: session.intentScore?.current
    };
};