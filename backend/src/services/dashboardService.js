const { prisma } = require('../config/database'); // Import prisma client
const AppError = require('../utils/AppError');
const intentService = require('./intentService'); // Still needed for specific calls

/**
 * Get metrics for a specific time range
 */
exports.getMetrics = async (websiteId, start, end) => {
    const totalSessions = await prisma.session.count({
        where: {
            websiteId,
            createdAt: { gte: start, lt: end }
        }
    });

    const totalVisitors = await prisma.session.count({
        where: {
            websiteId,
            createdAt: { gte: start, lt: end }
        },
        distinct: ['fingerprint']
    });
    
    // Aggregation for conversions and average intent score
    const conversionData = await prisma.session.aggregate({
        where: {
            websiteId,
            createdAt: { gte: start, lt: end }
        },
        _sum: {
            // Prisma doesn't have a direct equivalent for $cond for sums in aggregate.
            // We'll fetch all and calculate or use raw query if complex.
            // For now, let's simplify and assume 'outcome' = 'purchase' means converted.
        },
        _avg: {
            intentScore: {
                current: true // Assuming intentScore.current is what we want to average
            }
        }
    });

    const sessionsForConversion = await prisma.session.findMany({
        where: {
            websiteId,
            createdAt: { gte: start, lt: end }
        },
        select: {
            outcome: true,
            intentScore: {
                select: {
                    current: true
                }
            }
        }
    });

    const conversions = sessionsForConversion.filter(s => s.outcome === 'purchase').length;
    const totalIntentScores = sessionsForConversion.reduce((sum, s) => sum + (s.intentScore?.current || 0), 0);
    const avgIntentScore = sessionsForConversion.length > 0 ? totalIntentScores / sessionsForConversion.length : 0;
    
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
    // Prisma does not have direct equivalent for $dateToString in aggregation.
    // We will fetch data and process in application.
    const sessions = await prisma.session.findMany({
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
        trendMap.set(dateKey, data);
    });

    return Array.from(trendMap.entries()).map(([date, data]) => ({
        _id: date,
        sessions: data.sessions,
        conversions: data.conversions
    }));
};

/**
 * Get recent sessions
 */
exports.getRecentSessions = async (websiteId, startDate, limit = 10) => {
    return await prisma.session.findMany({
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
                select: { current: true }
            }
            // Add other includes if necessary, e.g., for `s.events`
        }
    });
};

/**
 * Get real-time visitors data
 */
exports.getRealtimeVisitorsData = async (websiteId) => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const activeSessions = await prisma.session.findMany({
        where: {
            websiteId,
            lastActive: { gte: fiveMinutesAgo }, // Assuming lastActive for activity tracking
            endTime: null
        },
        select: {
            sessionId: true,
            persona: { select: { name: true } }, // Assuming persona.name is personaType
            intentScore: { select: { current: true } },
            behavior: { select: { pageViews: { select: { url: true } } } }, // Get last page visited
            startTime: true,
            id: true // For use with include
        },
        orderBy: { lastActive: 'desc' },
        take: 50,
        include: { // Include specific fields from relations to map to original structure
            persona: { select: { name: true } },
            intentScore: { select: { current: true } },
            behavior: { select: { pageViews: { select: { url: true } } } }
        }
    });

    const recentPageViews = await prisma.event.findMany({
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
        activeSessions: activeSessions.map(s => ({
            sessionId: s.sessionId,
            personaType: s.persona?.name,
            intentScore: s.intentScore?.current,
            currentPage: s.behavior?.pageViews && s.behavior.pageViews.length > 0 ? s.behavior.pageViews[s.behavior.pageViews.length - 1].url : '/',
            duration: Math.floor((Date.now() - s.startTime.getTime()) / 1000)
        })),
        recentPageViews: recentPageViews.map(e => ({
            page: e.eventData?.pageUrl,
            timestamp: e.timestamp
        }))
    };
};

/**
 * Get heatmap data
 */
exports.getHeatmapData = async (websiteId, pageUrl) => {
    const clicks = await prisma.click.findMany({
        where: {
            sessionBehavior: {
                session: {
                    websiteId: websiteId
                }
            },
            element: { not: null }, // Filter elements that are not null
            // For pageUrl, we'd need to filter based on SessionBehavior's pageViews.
            // This requires a more complex query or fetching sessions first.
            // For now, let's assume `Event` is still tracking page URL for clicks.
            // If `Click` model directly stores pageUrl, this would be easier.
            // Since `Click` is nested under `SessionBehavior`, which is nested under `Session`,
            // and `Session` has `events`, we need to trace this.

            // Given the current schema, filtering clicks by `eventData.pageUrl` as in Mongoose
            // would mean fetching Events first, then their associated SessionBehaviors, then Clicks.
            // A simpler approach for now is to filter clicks by websiteId and later filter by pageUrl.
        },
        select: {
            x: true,
            y: true,
            element: true,
            sessionBehavior: {
                select: {
                    pageViews: {
                        where: { url: pageUrl },
                        select: { url: true }
                    }
                }
            }
        },
        take: 1000,
    });

    const filteredClicks = clicks.filter(c => c.sessionBehavior?.pageViews.length > 0).map(c => ({
        x: c.x,
        y: c.y,
        element: c.element
    }));

    // Aggregate scroll data
    const scrollData = await prisma.mouseMove.aggregate({
        where: {
            sessionBehavior: {
                session: {
                    websiteId: websiteId
                }
            },
            // Need to filter by pageUrl if scroll events are tied to specific pages
            // This is complex with the current nested structure without direct pageUrl on MouseMove
        },
        _avg: {
            speed: true // Assuming speed is proxy for scrollDepth
        },
        _max: {
            speed: true // Assuming speed is proxy for scrollDepth
        }
    });

    const hoverEvents = await prisma.emotionChange.findMany({ // Assuming hover maps to emotionChange for timeSpent, etc.
        where: {
            sessionEmotion: {
                session: {
                    websiteId: websiteId
                }
            },
            // Again, pageUrl filtering is complex here.
        },
        select: {
            timestamp: true,
            trigger: true, // Assuming trigger might be element
            from: true,
            to: true
            // No direct timeSpent, will need to infer or use another event type if available
        },
    });

    // Re-implementing confusionZones will be tricky without explicit 'timeSpent' for hover events
    // on the emotionChange model directly.
    const confusionZones = {}; // Placeholder

    return {
        pageUrl,
        clicks: filteredClicks,
        scrollDepth: { avgScrollDepth: scrollData._avg.speed || 0, maxScrollDepth: scrollData._max.speed || 0 },
        confusionZones: [] // Placeholder
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
            count = await prisma.session.count({
                where: {
                    websiteId,
                    outcome: 'purchase'
                }
            });
        } else {
            // To count sessions that visited a specific page in Prisma
            count = await prisma.session.count({
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

/**
 * Get insights
 */
exports.getInsightsData = async (websiteId, website) => {
    const insights = [];

    // Insight 1: High bounce rate pages
    const bounceSessions = await prisma.session.findMany({
        where: {
            websiteId,
            behavior: {
                pageViews: {
                    // Filter for sessions with exactly one page view
                    // This is tricky in Prisma without raw SQL or a pre-calculated field
                    // For now, fetch and filter in JS
                }
            },
            totalTimeSpent: { lt: 10 } // Assuming totalTimeSpent is directly on Session
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
            if (landingPage) pages[landingPage] = (pages[landingPage] || 0) + 1;
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
    const highIntentNoConversion = await prisma.session.count({
        where: {
            websiteId,
            intentScore: {
                current: { gte: 70 }
            },
            outcome: { not: 'purchase' } // Assuming 'purchase' means converted
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

    // Insight 3: Persona discovery
    const totalSessions = await prisma.session.count({ where: { websiteId } });
    const personaCount = await prisma.persona.count({ where: { websiteId } });

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
            (Date.now() - website.learningStartedAt.getTime()) / (1000 * 60 * 60)
        );

        if (hoursSinceLearning >= website.settings?.learningPeriodHours) {
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
    // Aggregation for top pages
    // Prisma does not have direct group by for JSON fields. Fetch and process.
    const events = await prisma.event.findMany({
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

/**
 * Get fraud summary
 */
exports.getFraudSummaryData = async (websiteId, startDate) => {
    const fraudIncidentsLast30Days = await prisma.userFraudScore.count({
        where: {
            user: {
                websites: {
                    some: {
                        id: websiteId
                    }
                }
            },
            createdAt: { gte: startDate },
            current: { gte: 70 } // Assuming score > 70 indicates an incident
        }
    });

    const totalFraudScores = await prisma.userFraudScore.count({
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

/**
 * Get persona summary
 */
exports.getPersonaSummaryData = async (websiteId, thirtyDaysAgo) => {
    const totalPersonas = await prisma.persona.count({ where: { websiteId, isActive: true } });
    const newPersonasLast30Days = await prisma.persona.count({
        where: {
            websiteId,
            createdAt: { gte: thirtyDaysAgo }
        }
    });
    return { totalPersonas, newPersonasLast30Days };
};

/**
 * Get personalization status
 */
exports.getPersonalizationStatusData = async (websiteId, website) => {
     // Re-fetching website isn't necessary if passed, but consistency is key.
     // Assuming website object is passed for efficiency
     return { enabled: website.settings?.autoPersonalization || false };
};

/**
 * Get heatmap summary
 */
exports.getHeatmapSummaryData = async (websiteId, fortyEightHoursAgo) => {
    const recentClickEvent = await prisma.click.findFirst({
        where: {
            sessionBehavior: {
                session: {
                    websiteId: websiteId
                }
            },
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

/**
 * Get experiment summary
 */
exports.getExperimentSummaryData = async (websiteId) => {
    const totalExperiments = await prisma.experiment.count({ where: { websiteId } });
    const activeExperiments = await prisma.experiment.count({ where: { websiteId, status: 'active' } });
    return { totalExperiments, activeExperiments };
};

/**
 * Get content summary
 */
exports.getContentSummaryData = async (websiteId) => {
    const totalContentGenerated = await prisma.event.count({
        where: {
            websiteId,
            eventType: 'content_generated'
        }
    });
    const lastContentGeneratedEvent = await prisma.event.findFirst({
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

/**
 * Get abandonment summary
 */
exports.getAbandonmentSummaryData = async (websiteId, thirtyDaysAgo) => {
    const totalSessions = await prisma.session.count({ where: { websiteId, createdAt: { gte: thirtyDaysAgo } } });
    const abandonedSessions = await prisma.session.count({ where: { websiteId, outcome: 'cart_abandon', createdAt: { gte: thirtyDaysAgo } } });
    const abandonmentRate = totalSessions > 0 ? (abandonedSessions / totalSessions) * 100 : 0;

    const interventionsTriggeredLast30Days = await prisma.sessionIntervention.count({
        where: {
            session: {
                websiteId: websiteId
            },
            type: 'cart_abandon_prevention', // Assuming this field exists and is used
            timestamp: { gte: thirtyDaysAgo }
        }
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
    const totalDiscountsOffered = await prisma.userDiscount.count({
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

    // Prisma aggregation for sum and average
    const avgDiscountValueResult = await prisma.userDiscount.aggregate({
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