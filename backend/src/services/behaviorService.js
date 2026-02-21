const Behavior = require('../models/Behavior');
const Session = require('../models/Session');
const Event = require('../models/Event');
const ClickEvent = require('../models/ClickEvent');
const emotionService = require('./emotionService');

/**
 * Process and save click event for heatmaps
 */
exports.processClickEvent = async (websiteId, eventData) => {
    if (typeof eventData.x === 'number' && typeof eventData.y === 'number') {
        await ClickEvent.create({
            websiteId,
            pageUrl: eventData.pageUrl,
            x: eventData.x,
            y: eventData.y,
            timestamp: new Date()
        });
    }
};

/**
 * Track a behavior event
 */
exports.trackEvent = async (website, data) => {
    const { userId, sessionId, eventType, eventData } = data;
    const websiteId = website._id;

    // Create behavior record
    await Behavior.create({
        userId,
        websiteId,
        sessionId,
        eventType,
        eventData,
        timestamp: new Date()
    });

    // Create general event
    await Event.create({
        sessionId,
        websiteId,
        eventType,
        eventData: { ...eventData },
        timestamp: new Date()
    });

    // Specific click processing
    if (eventType === 'click') {
        await this.processClickEvent(websiteId, eventData);
    }

    // Update session behavior
    await Session.findOneAndUpdate(
        { sessionId, websiteId },
        {
            $push: {
                [`behavior.${eventType}s`]: {
                    ...eventData,
                    timestamp: new Date()
                }
            }
        }
    );

    // Emotion detection on interaction
    if (eventType === 'mouse_move' || eventType === 'scroll') {
        const session = await Session.findOne({ sessionId, websiteId }).lean();
        if (session && session.behavior && session.behavior.mouseMovements && session.behavior.mouseMovements.length > 10) {
            const emotionResult = await emotionService.detectEmotion(userId, {
                mouseMovements: session.behavior.mouseMovements,
                scrollData: session.behavior.pageViews,
                clickData: session.behavior.clicks,
                timeOnPage: Date.now() - session.startTime
            }, eventData.pageUrl);

            const response = await emotionService.getEmotionResponse(websiteId, emotionResult.emotion);

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
    const session = await Session.findOne({ sessionId }).lean();
    if (!session) return null;

    return {
        pageViews: session.behavior?.pageViews?.length || 0,
        clicks: session.behavior?.clicks?.length || 0,
        timeSpent: Date.now() - session.startTime,
        emotion: session.emotion?.current,
        intentScore: session.intentScore?.current
    };
};