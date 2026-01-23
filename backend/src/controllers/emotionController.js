const { asyncHandler } = require("../utils/helpers");
const emotionService = require('../services/emotionService');
const Session = require('../models/Session');
const User = require('../models/User');
const Website = require('../models/Website');

const detectEmotion = asyncHandler(async (req, res) => {
    const { userId, sessionId, behaviorData } = req.body;

    // Detect emotion
    const result = await emotionService.detectEmotion(userId, behaviorData);

    // Update session
    await Session.findOneAndUpdate(
        { sessionId },
        {
            $set: { 'emotion.current': result.emotion },
            $push: {
                'emotion.changes': {
                    to: result.emotion,
                    timestamp: new Date()
                }
            }
        }
    );

    // Update user profile
    await User.findByIdAndUpdate(userId, {
        $set: {
            'emotionalProfile.dominantEmotion': result.emotion
        },
        $push: {
            'emotionalProfile.history': {
                emotion: result.emotion,
                timestamp: new Date(),
                page: behaviorData.currentPage
            }
        }
    });

    // Ensure that a website context is available from the auth middleware
    if (!req.website) {
        return res.status(403).json({
            success: false,
            error: 'Forbidden: A valid API key linked to a registered website is required.'
        });
    }

    const websiteapiKey = req.headers['x-api-key'];
    const website = await Website.findOne({ apiKey: websiteapiKey });
    const websiteID = website._id;

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
    console.log('--- getEmotionTrends called ---'); // ADDED for debugging
    const { websiteId, timeRange = '7d' } = req.query;

    const website = await Website.findOne({ _id: websiteId, userId: req.user._id });
    if (!website) {
        return res.status(404).json({ success: false, message: 'Website not found' });
    }

    const days = parseInt(timeRange) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const emotionTrends = await Session.aggregate([
        {
            $match: {
                websiteId: website._id,
                createdAt: { $gte: startDate },
                'emotion.current': { $ne: null }
            }
        },
        {
            $unwind: '$emotion.changes'
        },
        {
            $group: {
                _id: {
                    date: { $dateToString: { format: '%Y-%m-%d', date: '$emotion.changes.timestamp' } },
                    emotion: '$emotion.changes.to'
                },
                count: { $sum: 1 }
            }
        },
        {
            $group: {
                _id: '$_id.date',
                emotions: {
                    $push: {
                        emotion: '$_id.emotion',
                        count: '$count'
                    }
                }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);

    const formattedTrends = emotionTrends.map(trend => {
        const emotions = trend.emotions.reduce((acc, e) => {
            acc[e.emotion] = e.count;
            return acc;
        }, {});
        return {
            date: trend._id,
            ...emotions
        };
    });

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