"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSummary = exports.trackEvent = exports.processClickEvent = void 0;
const database_1 = require("../config/database");
const emotionService = __importStar(require("./emotionService"));
/**
 * Process and save click event for heatmaps
 */
const processClickEvent = async (websiteId, sessionBehaviorId, eventData) => {
    if (typeof eventData.x === 'number' && typeof eventData.y === 'number') {
        await database_1.prisma.click.create({
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
exports.processClickEvent = processClickEvent;
/**
 * Track a behavior event
 */
const trackEvent = async (website, data) => {
    const { sessionId, eventType, eventData } = data;
    const websiteId = website.id;
    // Find the session first to get the correct UUID 'id'
    const session = await database_1.prisma.session.findUnique({ where: { sessionId } });
    if (!session) {
        console.error(`Session with sessionId ${sessionId} not found for behavior update.`);
        return null;
    }
    // Create general event using session.id (UUID)
    await database_1.prisma.event.create({
        data: {
            sessionId: session.id,
            websiteId,
            eventType: eventType,
            eventData: { ...eventData },
            timestamp: new Date()
        }
    });
    let sessionBehavior = await database_1.prisma.sessionBehavior.findUnique({
        where: { sessionId: session.id },
    });
    if (!sessionBehavior) {
        sessionBehavior = await database_1.prisma.sessionBehavior.create({
            data: {
                sessionId: session.id,
                websiteId: website.id
            }
        });
    }
    switch (eventType) {
        case 'pageview':
            await database_1.prisma.pageView.create({
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
            await (0, exports.processClickEvent)(websiteId, sessionBehavior.id, eventData);
            break;
        case 'mouse_move':
            if (Array.isArray(eventData.movements)) {
                await Promise.all(eventData.movements.map((move) => database_1.prisma.mouseMove.create({
                    data: {
                        x: move.x,
                        y: move.y,
                        timestamp: new Date(move.timestamp || Date.now()),
                        sessionBehavior: { connect: { id: sessionBehavior.id } }
                    }
                })));
            }
            else if (typeof eventData.x === 'number' && typeof eventData.y === 'number') {
                await database_1.prisma.mouseMove.create({
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
            await database_1.prisma.cartAction.create({
                data: {
                    action: eventData.action,
                    productId: eventData.productId,
                    timestamp: new Date(eventData.timestamp || Date.now()),
                    sessionBehavior: { connect: { id: sessionBehavior.id } }
                }
            });
            break;
    }
    // Emotion detection on interaction
    if (eventType === 'mouse_move' || eventType === 'scroll') {
        const sessionWithBehavior = await database_1.prisma.session.findUnique({
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
            await database_1.prisma.sessionEmotion.upsert({
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
                    sessionId: session.id,
                    current: emotionResult.emotion,
                    changes: {
                        create: {
                            to: emotionResult.emotion,
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
exports.trackEvent = trackEvent;
/**
 * Get behavior summary
 */
const getSummary = async (sessionId) => {
    const session = await database_1.prisma.session.findUnique({
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
    if (!session)
        return null;
    return {
        pageViews: session.behavior?.pageViews?.length || 0,
        clicks: session.behavior?.clicks?.length || 0,
        timeSpent: session.startTime ? Date.now() - session.startTime.getTime() : 0,
        emotion: session.emotion?.current,
        intentScore: session.intentScore?.final
    };
};
exports.getSummary = getSummary;
