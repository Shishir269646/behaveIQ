"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDiscountSummaryData = exports.getAbandonmentSummaryData = exports.getContentSummaryData = exports.getExperimentSummaryData = exports.getHeatmapSummaryData = exports.getPersonalizationStatusData = exports.getPersonaSummaryData = exports.getFraudSummaryData = exports.getTopPagesData = exports.getInsightsData = exports.getFunnelData = exports.getHeatmapData = exports.getRealtimeVisitorsData = exports.getRecentSessions = exports.getTrendData = exports.calculateChange = exports.getMetrics = void 0;
const database_1 = require("../config/database");
/**
 * Get metrics for a specific time range
 */
const getMetrics = async (websiteId, start, end) => {
    const totalSessions = await database_1.prisma.session.count({
        where: {
            websiteId,
            createdAt: { gte: start, lt: end }
        }
    });
    const totalVisitorsGroup = await database_1.prisma.session.groupBy({
        by: ['fingerprint'],
        where: {
            websiteId,
            createdAt: { gte: start, lt: end }
        }
    });
    const totalVisitors = totalVisitorsGroup.length;
    const sessionsForConversion = await database_1.prisma.session.findMany({
        where: {
            websiteId,
            createdAt: { gte: start, lt: end }
        },
        select: {
            outcome: true,
            intentScore: {
                select: {
                    final: true
                }
            }
        }
    });
    const conversions = sessionsForConversion.filter(s => s.outcome === 'purchase').length;
    const totalIntentScores = sessionsForConversion.reduce((sum, s) => sum + (s.intentScore?.final || 0), 0);
    const avgIntentScore = sessionsForConversion.length > 0 ? totalIntentScores / sessionsForConversion.length : 0;
    return { totalSessions, totalVisitors, conversions, avgIntentScore };
};
exports.getMetrics = getMetrics;
/**
 * Calculate percentage change
 */
const calculateChange = (current, previous) => {
    if (previous === 0)
        return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
};
exports.calculateChange = calculateChange;
/**
 * Get trend data
 */
const getTrendData = async (websiteId, startDate) => {
    const sessions = await database_1.prisma.session.findMany({
        where: {
            websiteId,
            createdAt: { gte: startDate }
        },
        select: {
            createdAt: true,
            outcome: true
        },
        orderBy: {
            createdAt: 'asc'
        }
    });
    const trendMap = new Map();
    sessions.forEach(session => {
        const dateKey = session.createdAt.toISOString().split('T')[0];
        if (!trendMap.has(dateKey)) {
            trendMap.set(dateKey, { sessions: 0, conversions: 0 });
        }
        const data = trendMap.get(dateKey);
        data.sessions++;
        if (session.outcome === 'purchase') {
            data.conversions++;
        }
    });
    return Array.from(trendMap.entries()).map(([date, data]) => ({
        _id: date,
        sessions: data.sessions,
        conversions: data.conversions
    }));
};
exports.getTrendData = getTrendData;
/**
 * Get recent sessions
 */
const getRecentSessions = async (websiteId, startDate, limit = 10) => {
    return await database_1.prisma.session.findMany({
        where: { websiteId, createdAt: { gte: startDate } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
            user: {
                select: { id: true, fullName: true, email: true }
            },
            persona: {
                select: { name: true }
            },
            intentScore: {
                select: { final: true }
            }
        }
    });
};
exports.getRecentSessions = getRecentSessions;
/**
 * Get real-time visitors data
 */
const getRealtimeVisitorsData = async (websiteId) => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeSessions = await database_1.prisma.session.findMany({
        where: {
            websiteId,
            startTime: { gte: fiveMinutesAgo },
            endTime: null
        },
        select: {
            sessionId: true,
            persona: { select: { name: true } },
            intentScore: { select: { final: true } },
            behavior: {
                select: {
                    pageViews: {
                        select: { url: true },
                        orderBy: { timestamp: 'desc' },
                        take: 1
                    }
                }
            },
            startTime: true,
            id: true
        },
        orderBy: { startTime: 'desc' },
        take: 50
    });
    const recentPageViews = await database_1.prisma.event.findMany({
        where: {
            websiteId,
            eventType: 'pageview',
            timestamp: { gte: fiveMinutesAgo }
        },
        select: {
            eventData: true,
            timestamp: true
        },
        orderBy: { timestamp: 'desc' },
        take: 20
    });
    return {
        activeVisitors: activeSessions.length,
        activeSessions: activeSessions.map((s) => ({
            sessionId: s.sessionId,
            personaType: s.persona?.name,
            intentScore: s.intentScore?.final,
            currentPage: s.behavior?.pageViews && s.behavior.pageViews.length > 0 ? s.behavior.pageViews[0].url : '/',
            duration: Math.floor((Date.now() - s.startTime.getTime()) / 1000)
        })),
        recentPageViews: recentPageViews.map(e => ({
            page: e.eventData?.pageUrl,
            timestamp: e.timestamp
        }))
    };
};
exports.getRealtimeVisitorsData = getRealtimeVisitorsData;
/**
 * Get heatmap data
 */
const getHeatmapData = async (websiteId, pageUrl) => {
    const clicks = await database_1.prisma.click.findMany({
        where: {
            websiteId,
            pageUrl,
        },
        select: {
            x: true,
            y: true,
            element: true
        },
        take: 1000,
    });
    const scrollData = await database_1.prisma.pageView.aggregate({
        where: {
            sessionBehavior: {
                session: {
                    websiteId: websiteId
                }
            },
            url: pageUrl
        },
        _avg: {
            scrollDepth: true
        },
        _max: {
            scrollDepth: true
        }
    });
    return {
        pageUrl,
        clicks,
        scrollDepth: {
            avgScrollDepth: scrollData._avg.scrollDepth || 0,
            maxScrollDepth: scrollData._max.scrollDepth || 0
        },
        confusionZones: []
    };
};
exports.getHeatmapData = getHeatmapData;
/**
 * Get conversion funnel data
 */
const getFunnelData = async (websiteId) => {
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
            count = await database_1.prisma.session.count({
                where: {
                    websiteId,
                    outcome: 'purchase'
                }
            });
        }
        else {
            count = await database_1.prisma.session.count({
                where: {
                    websiteId,
                    behavior: {
                        pageViews: {
                            some: {
                                url: { contains: step.path, mode: 'insensitive' }
                            }
                        }
                    }
                }
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
exports.getFunnelData = getFunnelData;
/**
 * Get insights
 */
const getInsightsData = async (websiteId, website) => {
    const insights = [];
    const bounceSessions = await database_1.prisma.session.findMany({
        where: {
            websiteId,
            duration: { lt: 10 }
        },
        include: {
            behavior: {
                select: {
                    pageViews: {
                        select: { url: true }
                    }
                }
            }
        }
    });
    const filteredBounceSessions = bounceSessions.filter(s => s.behavior?.pageViews.length === 1);
    if (filteredBounceSessions.length > 10) {
        const pages = {};
        filteredBounceSessions.forEach(s => {
            const landingPage = s.behavior?.pageViews[0]?.url;
            if (landingPage)
                pages[landingPage] = (pages[landingPage] || 0) + 1;
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
    const highIntentNoConversion = await database_1.prisma.session.count({
        where: {
            websiteId,
            intentScore: {
                final: { gte: 70 }
            },
            outcome: { not: 'purchase' }
        }
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
    const totalSessions = await database_1.prisma.session.count({ where: { websiteId } });
    const personaCount = await database_1.prisma.persona.count({ where: { websiteId } });
    if (totalSessions > 100 && personaCount === 0) {
        insights.push({
            type: 'action_needed',
            priority: 'medium',
            message: `You have ${totalSessions} sessions. Ready to discover user personas!`,
            action: 'discover_personas',
            data: { sessionCount: totalSessions }
        });
    }
    if (website.status === 'learning' && website.learningStartedAt) {
        const hoursSinceLearning = Math.floor((Date.now() - website.learningStartedAt.getTime()) / (1000 * 60 * 60));
        if (hoursSinceLearning >= (website.settings?.learningPeriodHours || 48)) {
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
exports.getInsightsData = getInsightsData;
/**
 * Get top pages
 */
const getTopPagesData = async (websiteId, startDate) => {
    const events = await database_1.prisma.event.findMany({
        where: {
            websiteId,
            eventType: 'pageview',
            timestamp: { gte: startDate }
        },
        select: {
            eventData: true
        }
    });
    const pageViewsMap = new Map();
    events.forEach(event => {
        const pageUrl = event.eventData?.pageUrl;
        if (pageUrl) {
            pageViewsMap.set(pageUrl, (pageViewsMap.get(pageUrl) || 0) + 1);
        }
    });
    const sortedPages = Array.from(pageViewsMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    return sortedPages.map(([page, views]) => ({
        page: page,
        views: views
    }));
};
exports.getTopPagesData = getTopPagesData;
/**
 * Get fraud summary
 */
const getFraudSummaryData = async (websiteId, startDate) => {
    const fraudIncidentsLast30Days = await database_1.prisma.userFraudScore.count({
        where: {
            user: {
                websites: {
                    some: {
                        id: websiteId
                    }
                }
            },
            createdAt: { gte: startDate },
            current: { gte: 70 }
        }
    });
    const totalFraudScores = await database_1.prisma.userFraudScore.count({
        where: {
            user: {
                websites: {
                    some: {
                        id: websiteId
                    }
                }
            },
            createdAt: { gte: startDate }
        }
    });
    return {
        fraudIncidentsLast30Days,
        totalFraudScores
    };
};
exports.getFraudSummaryData = getFraudSummaryData;
/**
 * Get persona summary
 */
const getPersonaSummaryData = async (websiteId, thirtyDaysAgo) => {
    const totalPersonas = await database_1.prisma.persona.count({ where: { websiteId, isActive: true } });
    const newPersonasLast30Days = await database_1.prisma.persona.count({
        where: {
            websiteId,
            createdAt: { gte: thirtyDaysAgo }
        }
    });
    return { totalPersonas, newPersonasLast30Days };
};
exports.getPersonaSummaryData = getPersonaSummaryData;
/**
 * Get personalization status
 */
const getPersonalizationStatusData = async (websiteId, website) => {
    return { enabled: website.settings?.autoPersonalization || false };
};
exports.getPersonalizationStatusData = getPersonalizationStatusData;
/**
 * Get heatmap summary
 */
const getHeatmapSummaryData = async (websiteId, fortyEightHoursAgo) => {
    const recentClickEvent = await database_1.prisma.click.findFirst({
        where: {
            websiteId,
            timestamp: { gte: fortyEightHoursAgo }
        },
        orderBy: { timestamp: 'desc' },
        select: {
            timestamp: true
        }
    });
    return {
        hasRecentData: !!recentClickEvent,
        lastGenerated: recentClickEvent ? recentClickEvent.timestamp : null
    };
};
exports.getHeatmapSummaryData = getHeatmapSummaryData;
/**
 * Get experiment summary
 */
const getExperimentSummaryData = async (websiteId) => {
    const totalExperiments = await database_1.prisma.experiment.count({ where: { websiteId } });
    const activeExperiments = await database_1.prisma.experiment.count({ where: { websiteId, status: 'active' } });
    return { totalExperiments, activeExperiments };
};
exports.getExperimentSummaryData = getExperimentSummaryData;
/**
 * Get content summary
 */
const getContentSummaryData = async (websiteId) => {
    const totalContentGenerated = await database_1.prisma.event.count({
        where: {
            websiteId,
            eventType: 'content_generated'
        }
    });
    const lastContentGeneratedEvent = await database_1.prisma.event.findFirst({
        where: {
            websiteId,
            eventType: 'content_generated'
        },
        orderBy: { timestamp: 'desc' },
        select: {
            timestamp: true
        }
    });
    return {
        totalContentGenerated,
        lastContentGenerated: lastContentGeneratedEvent ? lastContentGeneratedEvent.timestamp : null
    };
};
exports.getContentSummaryData = getContentSummaryData;
/**
 * Get abandonment summary
 */
const getAbandonmentSummaryData = async (websiteId, thirtyDaysAgo) => {
    const totalSessions = await database_1.prisma.session.count({ where: { websiteId, createdAt: { gte: thirtyDaysAgo } } });
    const abandonedSessions = await database_1.prisma.session.count({ where: { websiteId, outcome: 'cart_abandon', createdAt: { gte: thirtyDaysAgo } } });
    const abandonmentRate = totalSessions > 0 ? (abandonedSessions / totalSessions) * 100 : 0;
    const interventionsTriggeredLast30Days = await database_1.prisma.sessionIntervention.count({
        where: {
            session: {
                websiteId: websiteId
            },
            type: 'cart_abandon_prevention',
            timestamp: { gte: thirtyDaysAgo }
        }
    });
    return {
        abandonmentRate: parseFloat(abandonmentRate.toFixed(2)),
        interventionsTriggeredLast30Days
    };
};
exports.getAbandonmentSummaryData = getAbandonmentSummaryData;
/**
 * Get discount summary
 */
const getDiscountSummaryData = async (websiteId) => {
    const totalDiscountsOffered = await database_1.prisma.userDiscount.count({
        where: {
            user: {
                websites: {
                    some: {
                        id: websiteId
                    }
                }
            }
        }
    });
    const avgDiscountValueResult = await database_1.prisma.userDiscount.aggregate({
        where: {
            user: {
                websites: {
                    some: {
                        id: websiteId
                    }
                }
            }
        },
        _avg: {
            amount: true
        }
    });
    const avgDiscountValue = avgDiscountValueResult._avg.amount || 0;
    return {
        totalDiscountsOffered,
        avgDiscountValue: parseFloat(avgDiscountValue.toFixed(2))
    };
};
exports.getDiscountSummaryData = getDiscountSummaryData;
