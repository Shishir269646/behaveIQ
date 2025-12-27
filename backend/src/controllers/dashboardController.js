const Session = require('../models/Session');
const Event = require('../models/Event');
const Website = require('../models/Website');
const Persona = require('../models/Persona');
const { asyncHandler } = require('../utils/helpers');

// @desc    Get dashboard overview
// @route   GET /api/v1/dashboard/overview?websiteId=xxx&timeRange=7d
exports.getOverview = asyncHandler(async (req, res) => {
    const { websiteId, timeRange = '7d' } = req.query;

    // Verify ownership
    const website = await Website.findOne({
        _id: websiteId,
        userId: req.user._id
    });

    if (!website) {
        return res.status(404).json({
            success: false,
            message: 'Website not found'
        });
    }

    // Calculate time range
    const days = parseInt(timeRange) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get metrics
    const totalSessions = await Session.countDocuments({
        websiteId,
        createdAt: { $gte: startDate }
    });

    const totalVisitors = await Session.distinct('fingerprint', {
        websiteId,
        createdAt: { $gte: startDate }
    }).then(arr => arr.length);

    const conversionData = await Session.aggregate([
        {
            $match: {
                websiteId: website._id,
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: null,
                totalConversions: {
                    $sum: { $cond: ['$converted', 1, 0] }
                },
                avgIntentScore: { $avg: '$intentScore' }
            }
        }
    ]);

    const conversions = conversionData[0]?.totalConversions || 0;
    const avgIntentScore = conversionData[0]?.avgIntentScore || 0;
    const conversionRate = totalSessions > 0
        ? ((conversions / totalSessions) * 100).toFixed(2)
        : 0;

    // Get top personas
    const topPersonas = await Persona.find({
        websiteId,
        isActive: true
    })
        .sort('-stats.sessionCount')
        .limit(5)
        .select('name stats.sessionCount stats.conversionRate');

    // Get trend data (daily)
    const trendData = await Session.aggregate([
        {
            $match: {
                websiteId: website._id,
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: '%Y-%m-%d',
                        date: '$createdAt'
                    }
                },
                sessions: { $sum: 1 },
                conversions: {
                    $sum: { $cond: ['$converted', 1, 0] }
                }
            }
        },
        { $sort: { _id: 1 } }
    ]);
    
    const recentSessions = await Session.find({ websiteId, createdAt: { $gte: startDate } })
        .sort('-createdAt')
        .limit(10)
        .populate('userId', 'name email')
        .populate('personaId', 'name');

    const sessions = recentSessions.map(s => ({
        id: s._id,
        user: s.userId ? { name: s.userId.name, email: s.userId.email } : { name: 'Anonymous', email: ''},
        persona: s.personaId ? s.personaId.name : 'Unknown',
        status: s.converted ? 'Converted' : (s.endTime ? 'Abandoned' : 'Active'),
        intentScore: s.intentScore,
    }));

    res.json({
        success: true,
        data: {
            overview: {
                totalVisitors,
                totalSessions,
                conversionRate: parseFloat(conversionRate),
                avgIntentScore: parseFloat(avgIntentScore.toFixed(2)),
                totalConversions: conversions
            },
            topPersonas,
            trendData,
            recentSessions: sessions,
            timeRange: `${days}d`
        }
    });
});

// @desc    Get real-time visitors
// @route   GET /api/v1/dashboard/realtime?websiteId=xxx
exports.getRealtimeVisitors = asyncHandler(async (req, res) => {
    const { websiteId } = req.query;

    // Verify ownership
    const website = await Website.findOne({
        _id: websiteId,
        userId: req.user._id
    });

    if (!website) {
        return res.status(404).json({
            success: false,
            message: 'Website not found'
        });
    }

    // Get sessions active in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const activeSessions = await Session.find({
        websiteId,
        lastActivityTime: { $gte: fiveMinutesAgo },
        endTime: null
    })
        .select('sessionId personaType intentScore pagesVisited lastActivityTime startTime')
        .sort('-lastActivityTime')
        .limit(50);

    const activeVisitors = activeSessions.length;

    // Get current page views
    const recentEvents = await Event.find({
        websiteId,
        eventType: 'pageview',
        timestamp: { $gte: fiveMinutesAgo }
    })
        .select('eventData.pageUrl timestamp')
        .sort('-timestamp')
        .limit(20);

    res.json({
        success: true,
        data: {
            activeVisitors,
            activeSessions: activeSessions.map(s => ({
                sessionId: s.sessionId,
                personaType: s.personaType,
                intentScore: s.intentScore,
                currentPage: s.pagesVisited[s.pagesVisited.length - 1],
                duration: Math.floor((Date.now() - s.startTime) / 1000)
            })),
            recentPageViews: recentEvents.map(e => ({
                page: e.eventData.pageUrl,
                timestamp: e.timestamp
            }))
        }
    });
});

// @desc    Get heatmap data
// @route   GET /api/v1/dashboard/heatmap?websiteId=xxx&pageUrl=/pricing
exports.getHeatmap = asyncHandler(async (req, res) => {
    const { websiteId, pageUrl } = req.query;

    // Verify ownership
    const website = await Website.findOne({
        _id: websiteId,
        userId: req.user._id
    });

    if (!website) {
        return res.status(404).json({
            success: false,
            message: 'Website not found'
        });
    }

    // Get click events
    const clicks = await Event.find({
        websiteId,
        eventType: 'click',
        'eventData.pageUrl': pageUrl
    })
        .select('eventData.x eventData.y eventData.element')
        .limit(1000)
        .lean();

    // Get scroll depth data
    const scrollData = await Event.aggregate([
        {
            $match: {
                websiteId: website._id,
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

    // Get hover/confusion zones (elements with high hover time)
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

    res.json({
        success: true,
        data: {
            pageUrl,
            clicks: clicks.map(c => ({
                x: c.eventData.x,
                y: c.eventData.y,
                element: c.eventData.element
            })),
            scrollDepth: scrollData[0] || { avgScrollDepth: 0, maxScrollDepth: 0 },
            confusionZones: topConfusionZones
        }
    });
});

// @desc    Get AI insights
// @route   GET /api/v1/dashboard/insights?websiteId=xxx
exports.getInsights = asyncHandler(async (req, res) => {
    const { websiteId } = req.query;

    // Verify ownership
    const website = await Website.findOne({
        _id: websiteId,
        userId: req.user._id
    });

    if (!website) {
        return res.status(404).json({
            success: false,
            message: 'Website not found'
        });
    }

    const insights = [];

    // Insight 1: High bounce rate pages
    const sessions = await Session.find({
        websiteId,
        pageViews: 1,
        totalTimeSpent: { $lt: 10 }
    })
        .select('landingPage')
        .lean();

    if (sessions.length > 10) {
        const pages = {};
        sessions.forEach(s => {
            pages[s.landingPage] = (pages[s.landingPage] || 0) + 1;
        });

        const topBouncePage = Object.entries(pages)
            .sort((a, b) => b[1] - a[1])[0];

        if (topBouncePage) {
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
        intentScore: { $gte: 0.7 },
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

    res.json({
        success: true,
        count: insights.length,
        data: { insights }
    });
});

// @desc    Get conversion funnel
// @route   GET /api/v1/dashboard/conversion-funnel?websiteId=xxx
exports.getConversionFunnel = asyncHandler(async (req, res) => {
    const { websiteId } = req.query;

    // Verify ownership
    const website = await Website.findOne({
        _id: websiteId,
        userId: req.user._id
    });

    if (!website) {
        return res.status(404).json({
            success: false,
            message: 'Website not found'
        });
    }

    // Define funnel steps (customize based on website)
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

    res.json({
        success: true,
        data: { funnel: funnelData }
    });
});

// @desc    Get top pages
// @route   GET /api/v1/dashboard/top-pages?websiteId=xxx&timeRange=7d
exports.getTopPages = asyncHandler(async (req, res) => {
    const { websiteId, timeRange = '7d' } = req.query;

    const website = await Website.findOne({ _id: websiteId, userId: req.user._id });
    if (!website) {
        return res.status(404).json({ success: false, message: 'Website not found' });
    }

    const days = parseInt(timeRange) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const topPages = await Event.aggregate([
        {
            $match: {
                websiteId: website._id,
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

    const formattedPages = topPages.map(page => ({
        page: page._id,
        views: page.views
    }));

    res.json({
        success: true,
        data: {
            pages: formattedPages
        }
    });
});