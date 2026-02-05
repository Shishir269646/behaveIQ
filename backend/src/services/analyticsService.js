
const Session = require('../models/Session');
const Event = require('../models/Event');
const Website = require('../models/Website');


exports.getWebsiteAnalyticsSummary = async (websiteId, timeRange = '7d') => {
    try {
        const website = await Website.findById(websiteId);
        if (!website) {
            throw new Error('Website not found');
        }

        const days = parseInt(timeRange.replace('d', '')) || 7;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const sessionQuery = {
            websiteId: website._id,
            startTime: { $gte: startDate }
        };
        const eventQuery = {
            websiteId: website._id,
            timestamp: { $gte: startDate }
        };

        const totalSessions = await Session.countDocuments(sessionQuery);
        const totalPageViews = await Event.countDocuments({ ...eventQuery, eventType: 'pageview' });
        const totalUniqueVisitors = await Session.distinct('fingerprint', sessionQuery).then(arr => arr.length);

  
        return {
            totalSessions,
            totalPageViews,
            totalUniqueVisitors,
            timeRange: `${days}d`
        };
    } catch (error) {
        console.error('[AnalyticsService] Error getting website analytics summary:', error);
        throw error;
    }
};
