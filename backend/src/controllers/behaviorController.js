// src/controllers/behaviorController.js
const Behavior = require('../models/Behavior');
const Session = require('../models/Session');
const emotionService = require('../services/emotionService');

const trackEvent = async (req, res) => {
  try {
    const { userId, sessionId, eventType, eventData } = req.body;

    // Create behavior event
    const behavior = await Behavior.create({
      userId,
      sessionId,
      eventType,
      eventData,
      timestamp: new Date()
    });

    // Update session
    await Session.findOneAndUpdate(
      { sessionId },
      {
        $push: {
          [`behavior.${eventType}s`]: {
            ...eventData,
            timestamp: new Date()
          }
        }
      }
    );

    // Analyze emotion if enough data
    if (eventType === 'mouse_move' || eventType === 'scroll') {
      const session = await Session.findOne({ sessionId });
      if (session.behavior.mouseMovements.length > 10) {
        const emotionResult = await emotionService.detectEmotion(userId, {
          mouseMovements: session.behavior.mouseMovements,
          scrollData: session.behavior.pageViews,
          clickData: session.behavior.clicks,
          timeOnPage: Date.now() - session.startTime
        });

        // Get appropriate response
        const response = emotionService.getEmotionResponse(
          emotionResult.emotion,
          eventData.url
        );

        return res.json({
          success: true,
          emotion: emotionResult.emotion,
          response
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Behavior tracking error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getBehaviorSummary = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const summary = {
      pageViews: session.behavior.pageViews.length,
      clicks: session.behavior.clicks.length,
      timeSpent: Date.now() - session.startTime,
      emotion: session.emotion.current,
      intentScore: session.intentScore.current
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};


module.exports = {
  trackEvent,
  getBehaviorSummary
};