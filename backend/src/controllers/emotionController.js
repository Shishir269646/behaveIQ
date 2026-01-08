const emotionService = require('../services/emotionService');
const Session = require('../models/Session');
const User = require('../models/User');
const Website = require('../models/Website');

const detectEmotion = async (req, res) => {
  try {
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

    // Get appropriate response
    const response = emotionService.getEmotionResponse(
      result.emotion,
      behaviorData.currentPage
    );

    res.json({
      success: true,
      data: {
        emotion: result.emotion,
        confidence: result.confidence,
        response
      }
    });
  } catch (error) {
    console.error('Emotion detection error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getEmotionTrends = async (req, res) => {
  console.log('--- getEmotionTrends called ---'); // ADDED for debugging
  try {
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
  } catch (error) {
    console.error('Error getting emotion trends:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};


module.exports = {
  detectEmotion,
  getEmotionTrends
};