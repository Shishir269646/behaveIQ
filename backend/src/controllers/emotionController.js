const { asyncHandler } = require("../utils/helpers");
const emotionService = require('../services/emotionService');
const { prisma } = require('../config/database'); // Import prisma client
const AppError = require('../utils/AppError');

const detectEmotion = asyncHandler(async (req, res) => {
    const { userId, sessionId, behaviorData } = req.body;
    const pageUrl = behaviorData?.currentPage || 'unknown';

    // Find the session to get the UUID 'id' for foreign key reference
    const session = await prisma.session.findUnique({
        where: { sessionId: sessionId }
    });

    if (!session) {
        throw new AppError('Session not found', 404);
    }

    // Detect emotion
    const result = await emotionService.detectEmotion(userId, behaviorData, pageUrl);

    // Update session emotion - Use session.id (UUID) as the foreign key
    await prisma.sessionEmotion.upsert({
        where: { sessionId: session.id }, // sessionId field in SessionEmotion model references Session.id
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

    // Update user emotional profile only if userId exists
    if (userId) {
        await prisma.userEmotionalProfile.upsert({
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

    // Ensure that a website context is available from the auth middleware
    if (!req.website) {
        throw new AppError('Forbidden: A valid API key linked to a registered website is required.', 403);
    }

    const websiteID = req.website.id; // Use req.website.id directly

    // Get appropriate response
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

const getEmotionTrends = asyncHandler(async (req, res) => {
    console.log('--- getEmotionTrends called ---');
    const { websiteId, timeRange = '7d' } = req.query;

    const website = await prisma.website.findUnique({ where: { id: websiteId, userId: req.user.id } });
    if (!website) {
        throw new AppError('Website not found', 404);
    }

    const days = parseInt(timeRange) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Prisma does not have direct equivalent for complex $unwind and $group aggregations.
    // Fetch relevant data and process in application logic.
    const emotionChanges = await prisma.emotionChange.findMany({
        where: {
            sessionEmotion: {
                session: {
                    websiteId: website.id,
                    createdAt: { gte: startDate } // Filter sessions by creation date
                }
            }
        },
        select: {
            timestamp: true,
            to: true // The 'to' emotion
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
        emotionsForDate[change.to] = (emotionsForDate[change.to] || 0) + 1;
        emotionTrendsMap.set(dateKey, emotionsForDate);
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


module.exports = {
    detectEmotion,
    getEmotionTrends
};