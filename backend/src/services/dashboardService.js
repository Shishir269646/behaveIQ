const Session = require('../models/Session');
const Event = require('../models/Event');
const Persona = require('../models/Persona');
const FraudScore = require('../models/FraudScore');
const Discount = require('../models/Discount');
const Intervention = require('../models/Intervention');
const ClickEvent = require('../models/ClickEvent');
const Experiment = require('../models/Experiment');
const Website = require('../models/Website');
const intentService = require('./intentService');

/**
 * Get metrics for a specific time range
 */
exports.getMetrics = async (websiteId, start, end) => {
    const totalSessions = await Session.countDocuments({
        websiteId,
        createdAt: { $gte: start, $lt: end }
    });
    const totalVisitors = await Session.distinct('fingerprint', {
        websiteId,
        createdAt: { $gte: start, $lt: end }
    }).then(arr => arr.length);
    
    const conversionData = await Session.aggregate([
        { $match: { websiteId: websiteId, createdAt: { $gte: start, $lt: end } } },
        {
            $group: {
                _id: null,
                totalConversions: { $sum: { $cond: ['$converted', 1, 0] } },
                avgIntentScore: { $avg: '$intentScore.final' } 
            }
        }
    ]);
    const conversions = conversionData[0]?.totalConversions || 0;
    const avgIntentScore = conversionData[0]?.avgIntentScore || 0;
    
    return { totalSessions, totalVisitors, conversions, avgIntentScore };
};

/**
 * Calculate percentage change
 */
exports.calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
};

/**
 * Get trend data
 */
exports.getTrendData = async (websiteId, startDate) => {
    return await Session.aggregate([
        { $match: { websiteId: websiteId, createdAt: { $gte: startDate } } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                sessions: { $sum: 1 },
                conversions: { $sum: { $cond: ['$converted', 1, 0] } }
            }
        },
        { $sort: { _id: 1 } }
    ]);
};

/**
 * Get recent sessions
 */
exports.getRecentSessions = async (websiteId, startDate, limit = 10) => {
    return await Session.find({ websiteId, createdAt: { $gte: startDate } })
        .sort('-createdAt')
        .limit(limit)
        .populate('userId', 'name email')
        .populate('personaId', 'name')
        .lean(); // Use lean() for performance
};

/**
 * Get real-time visitors data
 */
exports.getRealtimeVisitorsData = async (websiteId) => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const activeSessions = await Session.find({
        websiteId,
        lastActivityTime: { $gte: fiveMinutesAgo },
        endTime: null
    })
        .select('sessionId personaType intentScore pagesVisited lastActivityTime startTime')
        .sort('-lastActivityTime')
        .limit(50)
        .lean();

    const recentPageViews = await Event.find({
        websiteId,
        eventType: 'pageview',
        timestamp: { $gte: fiveMinutesAgo }
    })
        .select('eventData.pageUrl timestamp')
        .sort('-timestamp')
        .limit(20)
        .lean();

    return {
        activeVisitors: activeSessions.length,
        activeSessions: activeSessions.map(s => ({
            sessionId: s.sessionId,
            personaType: s.personaType,
            intentScore: s.intentScore,
            currentPage: s.pagesVisited && s.pagesVisited.length > 0 ? s.pagesVisited[s.pagesVisited.length - 1] : '/',
            duration: Math.floor((Date.now() - s.startTime) / 1000)
        })),
        recentPageViews: recentPageViews.map(e => ({
            page: e.eventData.pageUrl,
            timestamp: e.timestamp
        }))
    };
};

/**
 * Get heatmap data
 */
exports.getHeatmapData = async (websiteId, pageUrl) => {
    const clicks = await Event.find({
        websiteId,
        eventType: 'click',
        'eventData.pageUrl': pageUrl
    })
        .select('eventData.x eventData.y eventData.element')
        .limit(1000)
        .lean();

    const scrollData = await Event.aggregate([
        {
            $match: {
                websiteId: websiteId,
                eventType: 'scroll',
                'eventData.pageUrl': pageUrl
            }
        },
        {
            $group: {
                _id: null,
                avgScrollDepth: { $avg: '$eventData.scrollDepth' },
                maxScrollDepth: { $max: '$eventData.scrollDepth' }
            }
        }
    ]);

    const hoverEvents = await Event.find({
        websiteId,
        eventType: 'hover',
        'eventData.pageUrl': pageUrl
    })
        .select('eventData.element eventData.timeSpent')
        .lean();

    const confusionZones = {};
    hoverEvents.forEach(event => {
        const element = event.eventData.element;
        if (!confusionZones[element]) {
            confusionZones[element] = {
                element,
                totalHoverTime: 0,
                count: 0
            };
        }
        confusionZones[element].totalHoverTime += event.eventData.timeSpent || 0;
        confusionZones[element].count++;
    });

    const topConfusionZones = Object.values(confusionZones)
        .sort((a, b) => b.totalHoverTime - a.totalHoverTime)
        .slice(0, 10)
        .map(zone => ({
            element: zone.element,
            avgHoverTime: (zone.totalHoverTime / zone.count).toFixed(2),
            confusionScore: Math.min((zone.totalHoverTime / zone.count) / 10, 1).toFixed(2)
        }));

    return {
        pageUrl,
        clicks: clicks.map(c => ({
            x: c.eventData.x,
            y: c.eventData.y,
            element: c.eventData.element
        })),
        scrollDepth: scrollData[0] || { avgScrollDepth: 0, maxScrollDepth: 0 },
        confusionZones: topConfusionZones
    };
};

/**
 * Get conversion funnel data
 */
exports.getFunnelData = async (websiteId) => {
    const funnelSteps = [
        { name: 'Landing', path: '/' },
        { name: 'Product', path: '/product' },
        { name: 'Pricing', path: '/pricing' },
        { name: 'Checkout', path: '/checkout' },
        { name: 'Conversion', converted: true }
    ];

    const funnelData = [];

    for (let i = 0; i < funnelSteps.length; i++) {
        const step = funnelSteps[i];
        let count;

        if (step.converted) {
            count = await Session.countDocuments({
                websiteId,
                converted: true
            });
        } else {
            count = await Session.countDocuments({
                websiteId,
                pagesVisited: { $regex: step.path, $options: 'i' }
            });
        }

        const previousCount = i > 0 ? funnelData[i - 1].visitors : count;
        const dropoff = previousCount > 0
            ? (((previousCount - count) / previousCount) * 100).toFixed(1)
            : 0;

        funnelData.push({
            step: step.name,
            visitors: count,
            dropoff: parseFloat(dropoff),
            conversionRate: i === 0
                ? 100
                : ((count / funnelData[0].visitors) * 100).toFixed(1)
        });
    }

    return funnelData;
};

/**
 * Get insights
 */
exports.getInsightsData = async (websiteId, website) => {
    const insights = [];

    // Insight 1: High bounce rate pages
    const sessions = await Session.find({
        websiteId,
        // Assuming pageViews is an array, check length
        $where: "this.behavior && this.behavior.pageViews && this.behavior.pageViews.length == 1",
        totalTimeSpent: { $lt: 10 }
    })
        .select('behavior.pageViews')
        .lean();
    
    // Note: $where is slow, better to maintain a 'pageViewCount' field on session update.
    // For now, let's optimize the query:
    const bounceSessions = await Session.aggregate([
        { $match: { websiteId: websiteId, totalTimeSpent: { $lt: 10 } } },
        { $addFields: { pageViewCount: { $size: "$behavior.pageViews" } } },
        { $match: { pageViewCount: 1 } },
        { $project: { landingPage: { $arrayElemAt: ["$behavior.pageViews.url", 0] } } }
    ]);

    if (bounceSessions.length > 10) {
        const pages = {};
        bounceSessions.forEach(s => {
            if(s.landingPage) pages[s.landingPage] = (pages[s.landingPage] || 0) + 1;
        });

        const sortedPages = Object.entries(pages).sort((a, b) => b[1] - a[1]);
        if (sortedPages.length > 0) {
             const topBouncePage = sortedPages[0];
             insights.push({
                type: 'opportunity',
                priority: 'high',
                message: `High bounce rate detected on ${topBouncePage[0]}. Consider improving content or adding personalization.`,
                action: 'optimize_page',
                data: { page: topBouncePage[0], bounces: topBouncePage[1] }
            });
        }
    }

    // Insight 2: High intent but no conversion
    const highIntentNoConversion = await Session.countDocuments({
        websiteId,
        'intentScore.current': { $gte: 70 }, // Assuming scale 0-100 based on previous context, or 0.7 if 0-1
        converted: false
    });

    if (highIntentNoConversion > 5) {
        insights.push({
            type: 'opportunity',
            priority: 'high',
            message: `${highIntentNoConversion} visitors with high purchase intent didn't convert. Add urgency CTAs or special offers.`,
            action: 'add_cta',
            data: { count: highIntentNoConversion }
        });
    }

    // Insight 3: Persona discovery
    const totalSessions = await Session.countDocuments({ websiteId });
    const personaCount = await Persona.countDocuments({ websiteId });

    if (totalSessions > 100 && personaCount === 0) {
        insights.push({
            type: 'action_needed',
            priority: 'medium',
            message: `You have ${totalSessions} sessions. Ready to discover user personas!`,
            action: 'discover_personas',
            data: { sessionCount: totalSessions }
        });
    }

    // Insight 4: Learning mode completed
    if (website.status === 'learning') {
        const hoursSinceLearning = Math.floor(
            (Date.now() - website.learningStartedAt) / (1000 * 60 * 60)
        );

        if (hoursSinceLearning >= website.settings.learningPeriodHours) {
            insights.push({
                type: 'action_needed',
                priority: 'high',
                message: 'Learning period completed! Activate personalization to start optimizing.',
                action: 'activate_personalization',
                data: { hoursSinceLearning }
            });
        }
    }

    return insights;
};

/**
 * Get top pages
 */
exports.getTopPagesData = async (websiteId, startDate) => {
    const topPages = await Event.aggregate([
        {
            $match: {
                websiteId: websiteId,
                eventType: 'pageview',
                timestamp: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$eventData.pageUrl',
                views: { $sum: 1 }
            }
        },
        {
            $sort: {
                views: -1
            }
        },
        {
            $limit: 10
        }
    ]);

    return topPages.map(page => ({
        page: page._id,
        views: page.views
    }));
};

/**
 * Get fraud summary
 */
exports.getFraudSummaryData = async (websiteId, startDate) => {
    const fraudIncidentsLast30Days = await FraudScore.countDocuments({
        websiteId,
        createdAt: { $gte: startDate },
        score: { $gte: 70 } // Assuming score > 70 indicates an incident
    });

    const totalFraudScores = await FraudScore.countDocuments({
        websiteId,
        createdAt: { $gte: startDate }
    });

    return {
        fraudIncidentsLast30Days,
        totalFraudScores
    };
};

/**
 * Get persona summary
 */
exports.getPersonaSummaryData = async (websiteId, thirtyDaysAgo) => {
    const totalPersonas = await Persona.countDocuments({ websiteId, isActive: true });
    const newPersonasLast30Days = await Persona.countDocuments({
        websiteId,
        createdAt: { $gte: thirtyDaysAgo }
    });
    return { totalPersonas, newPersonasLast30Days };
};

/**
 * Get personalization status
 */
exports.getPersonalizationStatusData = async (websiteId, website) => {
     // Re-fetching website isn't necessary if passed, but consistency is key.
     // Assuming website object is passed for efficiency
     return { enabled: website.settings.autoPersonalization || false };
};

/**
 * Get heatmap summary
 */
exports.getHeatmapSummaryData = async (websiteId, fortyEightHoursAgo) => {
    const recentClickEvent = await ClickEvent.findOne({
        websiteId,
        timestamp: { $gte: fortyEightHoursAgo }
    }).sort('-timestamp').lean();

    return {
        hasRecentData: !!recentClickEvent,
        lastGenerated: recentClickEvent ? recentClickEvent.timestamp : null
    };
};

/**
 * Get experiment summary
 */
exports.getExperimentSummaryData = async (websiteId) => {
    const totalExperiments = await Experiment.countDocuments({ websiteId });
    const activeExperiments = await Experiment.countDocuments({ websiteId, status: 'active' });
    return { totalExperiments, activeExperiments };
};

/**
 * Get content summary
 */
exports.getContentSummaryData = async (websiteId) => {
    const totalContentGenerated = await Event.countDocuments({
        websiteId,
        eventType: 'content_generated'
    });
    const lastContentGeneratedEvent = await Event.findOne({
        websiteId,
        eventType: 'content_generated'
    }).sort('-timestamp').lean();

    return {
        totalContentGenerated,
        lastContentGenerated: lastContentGeneratedEvent ? lastContentGeneratedEvent.timestamp : null
    };
};

/**
 * Get abandonment summary
 */
exports.getAbandonmentSummaryData = async (websiteId, thirtyDaysAgo) => {
    const totalSessions = await Session.countDocuments({ websiteId, createdAt: { $gte: thirtyDaysAgo } });
    const abandonedSessions = await Session.countDocuments({ websiteId, outcome: 'cart_abandon', createdAt: { $gte: thirtyDaysAgo } });
    const abandonmentRate = totalSessions > 0 ? (abandonedSessions / totalSessions) * 100 : 0;

    const interventionsTriggeredLast30Days = await Intervention.countDocuments({
        websiteId, // Ensure schema supports this field
        type: 'cart_abandon_prevention',
        timestamp: { $gte: thirtyDaysAgo }
    });

    return {
        abandonmentRate: parseFloat(abandonmentRate.toFixed(2)),
        interventionsTriggeredLast30Days
    };
};

/**
 * Get discount summary
 */
exports.getDiscountSummaryData = async (websiteId) => {
    const totalDiscountsOffered = await Discount.countDocuments({ websiteId });
    const avgDiscountValueResult = await Discount.aggregate([
        { $match: { websiteId: websiteId } },
        {
            $group: {
                _id: null,
                avgDiscountValue: { $avg: '$value' }
            }
        }
    ]);
    const avgDiscountValue = avgDiscountValueResult.length > 0 ? avgDiscountValueResult[0].avgDiscountValue : 0;

    return {
        totalDiscountsOffered,
        avgDiscountValue: parseFloat(avgDiscountValue.toFixed(2))
    };
};