const Session = require('../models/Session');
const Event = require('../models/Event');

/**
 * Calculate intent score for a session
 */
exports.calculateIntentScore = async (sessionId) => {
    try {
        const session = await Session.findById(sessionId);
        if (!session) return;

        // Get session events
        const events = await Event.find({ sessionId })
            .sort('timestamp')
            .lean();

        if (events.length === 0) return;

        // Calculate metrics
        const timeSpent = session.totalTimeSpent || 0;
        const scrollDepth = session.avgScrollDepth || 0;
        const clickRate = session.totalClicks / Math.max(session.pageViews, 1);

        // Normalize values
        const normalizedTime = Math.min(timeSpent / 300, 1); // Max 5 minutes
        const normalizedScroll = scrollDepth;
        const normalizedClick = Math.min(clickRate, 1);

        // Intent Score Formula: (Time × 0.3) + (Scroll × 0.2) + (Click × 0.5)
        const intentScore =
            (normalizedTime * 0.3) +
            (normalizedScroll * 0.2) +
            (normalizedClick * 0.5);

        // Update session
        session.intentScore = Math.min(intentScore, 1);
        await session.save();

        return intentScore;

    } catch (error) {
        console.error('Intent calculation error:', error);
        throw error;
    }
};

/**
 * Get intent distribution for website
 */
exports.getIntentDistribution = async (websiteId) => {
    const sessions = await Session.find({ websiteId })
        .select('intentScore')
        .lean();

    const distribution = {
        low: 0,
        medium: 0,
        high: 0
    };

    sessions.forEach(session => {
        const score = session.intentScore || 0;
        if (score < 0.4) distribution.low++;
        else if (score < 0.7) distribution.medium++;
        else distribution.high++;
    });

    return distribution;
};