// src/controllers/behaviorController.js
const Behavior = require('../models/Behavior');
const Session = require('../models/Session');
const Event = require('../models/Event'); // Import Event model
const emotionService = require('../services/emotionService');
const Website = require('../models/Website'); // Import Website model

const trackEvent = async (req, res) => {
  try {

    const websiteapiKey = req.headers['x-api-key'];

    const website = await Website.findOne({ apiKey: websiteapiKey });

    const websiteID = website._id;



    if (!req.website) {
      console.log('Behavior trackEvent - website is NOT present.'); // DEBUG LOG
      return res.status(403).json({
        success: false,
        error: 'Forbidden: A valid API key linked to a registered website is required.'
      });
    }
    console.log('Behavior trackEvent - websiteID:', websiteID); // DEBUG LOG

    const { userId, sessionId, eventType, eventData } = req.body;








    // Create behavior event
    const behavior = await Behavior.create({
      userId,
      websiteId: websiteID, // Associate behavior with the website
      sessionId,
      eventType,
      eventData,
      timestamp: new Date()
    });

    // Verify website from API key



    if (!websiteID) {
      return res
        .status(401)
        .json({ success: false, message: 'Mismatched website' });
    }


    // Also create a record in the general Event model for dashboard display
    await Event.create({
      sessionId,
      websiteId: websiteID,
      eventType,
      eventData, // Assuming eventData schema is compatible or flexible enough
      timestamp: new Date()
    });

    // Update session - websiteId is already on session, no need to add here again
    await Session.findOneAndUpdate(
      { sessionId, websiteId: websiteID }, // Ensure we update session for the correct website
      {
        $push: {
          [`behavior.${eventType}s`]: {
            ...eventData,
            timestamp: new Date()
            // Add websiteId to individual events within session behavior if needed for finer filtering,
            // but for now, it's on the Session itself.
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
        const response = await emotionService.getEmotionResponse(
          websiteID, // Pass websiteId
          emotionResult.emotion
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