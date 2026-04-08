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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmotionTrends = exports.detectEmotion = void 0;
const database_1 = require("../config/database");
const helpers_1 = require("../utils/helpers");
const AppError_1 = __importDefault(require("../utils/AppError"));
const emotionService = __importStar(require("../services/emotionService"));
/**
 * Detect user emotion
 */
exports.detectEmotion = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { userId, sessionId, behaviorData } = req.body;
    const pageUrl = behaviorData?.currentPage || 'unknown';
    const session = await database_1.prisma.session.findUnique({
        where: { sessionId: sessionId }
    });
    if (!session) {
        throw new AppError_1.default('Session not found', 404);
    }
    const result = await emotionService.detectEmotion(userId, behaviorData, pageUrl);
    await database_1.prisma.sessionEmotion.upsert({
        where: { sessionId: session.id },
        update: {
            current: result.emotion,
            changes: {
                create: {
                    to: result.emotion,
                    timestamp: new Date()
                }
            }
        },
        create: {
            session: { connect: { id: session.id } },
            current: result.emotion,
            changes: {
                create: {
                    to: result.emotion,
                    timestamp: new Date()
                }
            }
        }
    });
    if (userId) {
        await database_1.prisma.userEmotionalProfile.upsert({
            where: { userId: userId },
            update: {
                dominantEmotion: result.emotion,
                history: {
                    create: {
                        emotion: result.emotion,
                        timestamp: new Date(),
                        page: pageUrl
                    }
                }
            },
            create: {
                userId: userId,
                dominantEmotion: result.emotion,
                history: {
                    create: {
                        emotion: result.emotion,
                        timestamp: new Date(),
                        page: pageUrl
                    }
                }
            }
        });
    }
    if (!req.website?.id) {
        throw new AppError_1.default('Forbidden: A valid API key linked to a registered website is required.', 403);
    }
    const websiteID = req.website.id;
    const response = await emotionService.getEmotionResponse(websiteID, result.emotion);
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
exports.getEmotionTrends = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { websiteId, timeRange = '7d' } = req.query;
    if (!req.user?.id)
        throw new AppError_1.default('Not authorized', 401);
    const website = await database_1.prisma.website.findUnique({
        where: { id: websiteId, userId: req.user.id }
    });
    if (!website) {
        throw new AppError_1.default('Website not found', 404);
    }
    const days = parseInt(timeRange) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const emotionChanges = await database_1.prisma.emotionChange.findMany({
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
    const emotionTrendsMap = new Map();
    emotionChanges.forEach(change => {
        const dateKey = change.timestamp.toISOString().split('T')[0];
        if (!emotionTrendsMap.has(dateKey)) {
            emotionTrendsMap.set(dateKey, {});
        }
        const emotionsForDate = emotionTrendsMap.get(dateKey);
        const emotion = change.to;
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
