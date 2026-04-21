import { prisma } from '../config/database';
import AppError from '../utils/AppError';
import { calculateChange } from '../utils/helpers'; // Assuming calculateChange is here or will be moved.
import { checkWebsiteOwnership } from '../utils/authUtils';
import * as intentService from './intentService';

// --- Utility Functions (Internal to Service) ---

/**
 * Parses timeRange string (e.g., '7d', '1m') into start and end dates.
 */
const parseTimeRange = (timeRange: string = '7d') => {
  let days: number;
  const value = parseInt(timeRange.slice(0, -1));
  const unit = timeRange.slice(-1);

  switch (unit) {
    case 'd': days = value; break;
    case 'w': days = value * 7; break;
    case 'm': days = value * 30; break; // Approximation
    case 'y': days = value * 365; break; // Approximation
    default: days = 7;
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  return { startDate, endDate, days };
};

/**
 * Formats session data for recent sessions display.
 */
const formatSessionForDisplay = (s: any) => ({
  id: s.id,
  user: s.userId ? { id: s.user?.id, name: s.user?.fullName, email: s.user?.email } : { id: 'anonymous', name: 'Anonymous', email: '' },
  persona: s.persona?.name || 'Unknown',
  status: s.outcome === 'purchase' ? 'Converted' : (s.endTime ? 'Abandoned' : 'Active'),
  intentScore: s.intentScore?.final,
});

// --- Core Service Functions ---

/**
 * Get dashboard overview data including metrics, top personas, trends, and recent sessions.
 */
export const getOverviewData = async (websiteId: string, userId: string, timeRange: string = '7d') => {
  await checkWebsiteOwnership(websiteId, userId);

  const { startDate, endDate, days } = parseTimeRange(timeRange);
  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - days);

  const currentMetrics = await getMetrics(websiteId, startDate, endDate);
  const prevMetrics = await getMetrics(websiteId, prevStartDate, startDate);

  const topPersonas = await prisma.persona.findMany({
    where: { websiteId, isActive: true },
    orderBy: { stats: { sessionCount: 'desc' } },
    take: 5,
    select: { name: true, stats: { select: { sessionCount: true } } },
  });

  const trendData = await getTrendData(websiteId, startDate);
  const recentSessions = await getRecentSessions(websiteId, startDate);

  return {
    overview: {
      totalVisitors: { value: currentMetrics.totalVisitors, change: calculateChange(currentMetrics.totalVisitors, prevMetrics.totalVisitors) },
      totalSessions: { value: currentMetrics.totalSessions, change: calculateChange(currentMetrics.totalSessions, prevMetrics.totalSessions) },
      totalConversions: { value: currentMetrics.conversions, change: calculateChange(currentMetrics.conversions, prevMetrics.conversions) },
      avgIntentScore: { value: parseFloat(currentMetrics.avgIntentScore.toFixed(2)), change: calculateChange(currentMetrics.avgIntentScore, prevMetrics.avgIntentScore) },
    },
    topPersonas,
    trendData,
    recentSessions: recentSessions.map(formatSessionForDisplay),
    timeRange: `${days}d`,
  };
};

/**
 * Get metrics for a specific time range
 */
export const getMetrics = async (websiteId: string, start: Date, end: Date) => {
  const totalSessions = await prisma.session.count({
    where: { websiteId, createdAt: { gte: start, lt: end } },
  });

  const totalVisitorsGroup = await prisma.session.groupBy({
    by: ['fingerprint'],
    where: { websiteId, createdAt: { gte: start, lt: end } },
  });
  const totalVisitors = totalVisitorsGroup.length;

  const sessionsForConversion = await prisma.session.findMany({
    where: { websiteId, createdAt: { gte: start, lt: end } },
    select: { outcome: true, intentScore: { select: { final: true } } },
  });

  const conversions = sessionsForConversion.filter(s => s.outcome === 'purchase').length;
  const totalIntentScores = sessionsForConversion.reduce((sum, s) => sum + (s.intentScore?.final || 0), 0);
  const avgIntentScore = sessionsForConversion.length > 0 ? totalIntentScores / sessionsForConversion.length : 0;

  return { totalSessions, totalVisitors, conversions, avgIntentScore };
};

/**
 * Get trend data
 */
export const getTrendData = async (websiteId: string, startDate: Date) => {
  const sessions = await prisma.session.findMany({
    where: { websiteId, createdAt: { gte: startDate } },
    select: { createdAt: true, outcome: true },
    orderBy: { createdAt: 'asc' },
  });

  const trendMap = new Map<string, { sessions: number; conversions: number }>();
  sessions.forEach(session => {
    const dateKey = session.createdAt.toISOString().split('T')[0]!;
    if (!trendMap.has(dateKey)) {
      trendMap.set(dateKey, { sessions: 0, conversions: 0 });
    }
    const data = trendMap.get(dateKey)!;
    data.sessions++;
    if (session.outcome === 'purchase') {
      data.conversions++;
    }
  });

  return Array.from(trendMap.entries()).map(([date, data]) => ({
    _id: date,
    sessions: data.sessions,
    conversions: data.conversions,
  }));
};

/**
 * Get recent sessions
 */
export const getRecentSessions = async (websiteId: string, startDate: Date, limit: number = 10) => {
  return prisma.session.findMany({
    where: { websiteId, createdAt: { gte: startDate } },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      persona: { select: { name: true } },
      intentScore: { select: { final: true } },
    },
  });
};

/**
 * Get real-time visitors data
 */
export const getRealtimeVisitorsData = async (websiteId: string, userId: string) => {
  await checkWebsiteOwnership(websiteId, userId);
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const activeSessions = await prisma.session.findMany({
    where: { websiteId, startTime: { gte: fiveMinutesAgo }, endTime: null },
    select: {
      sessionId: true,
      persona: { select: { name: true } },
      intentScore: { select: { final: true } },
      behavior: {
        select: {
          pageViews: {
            select: { url: true },
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
      },
      startTime: true,
      id: true,
    },
    orderBy: { startTime: 'desc' },
    take: 50,
  });

  const recentPageViews = await prisma.event.findMany({
    where: { websiteId, eventType: 'pageview', timestamp: { gte: fiveMinutesAgo } },
    select: { eventData: true, timestamp: true },
    orderBy: { timestamp: 'desc' },
    take: 20,
  });

  return {
    activeVisitors: activeSessions.length,
    activeSessions: activeSessions.map((s: any) => ({
      sessionId: s.sessionId,
      personaType: s.persona?.name,
      intentScore: s.intentScore?.final,
      currentPage: s.behavior?.pageViews && s.behavior.pageViews.length > 0 ? s.behavior.pageViews[0].url : '/',
      duration: Math.floor((Date.now() - s.startTime.getTime()) / 1000),
    })),
    recentPageViews: recentPageViews.map(e => ({
      page: (e.eventData as any)?.pageUrl,
      timestamp: e.timestamp,
    })),
  };
};

/**
 * Get heatmap data
 */
export const getHeatmapData = async (websiteId: string, pageUrl: string, userId: string) => {
  await checkWebsiteOwnership(websiteId, userId);
  const clicks = await prisma.click.findMany({
    where: { websiteId, pageUrl },
    select: { x: true, y: true, element: true },
    take: 1000,
  });

  const scrollData = await prisma.pageView.aggregate({
    where: {
      sessionBehavior: {
        session: { websiteId: websiteId },
      },
      url: pageUrl,
    },
    _avg: { scrollDepth: true },
    _max: { scrollDepth: true },
  });

  return {
    pageUrl,
    clicks,
    scrollDepth: {
      avgScrollDepth: scrollData._avg.scrollDepth || 0,
      maxScrollDepth: scrollData._max.scrollDepth || 0,
    },
    confusionZones: [],
  };
};

/**
 * Get conversion funnel data
 */
export const getFunnelData = async (websiteId: string, userId: string) => {
  await checkWebsiteOwnership(websiteId, userId);
  const funnelSteps = [
    { name: 'Landing', path: '/' },
    { name: 'Product', path: '/product' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Checkout', path: '/checkout' },
    { name: 'Conversion', converted: true },
  ];

  const funnelData: any[] = [];

  for (let i = 0; i < funnelSteps.length; i++) {
    const step = funnelSteps[i]!;
    let count: number;

    if (step.converted) {
      count = await prisma.session.count({
        where: { websiteId, outcome: 'purchase' },
      });
    } else {
      count = await prisma.session.count({
        where: {
          websiteId,
          behavior: {
            pageViews: {
              some: {
                url: { contains: step.path, mode: 'insensitive' },
              },
            },
          },
        },
      });
    }

    const previousCount = i > 0 ? funnelData[i - 1].visitors : count;
    const dropoff = previousCount > 0 ? (((previousCount - count) / previousCount) * 100).toFixed(1) : 0;

    funnelData.push({
      step: step.name,
      visitors: count,
      dropoff: parseFloat(dropoff as string),
      conversionRate: i === 0 ? 100 : ((count / funnelData[0].visitors) * 100).toFixed(1),
    });
  }

  return funnelData;
};

/**
 * Generate insights based on website data.
 */
export const getInsightsData = async (websiteId: string, userId: string) => {
  const website = await checkWebsiteOwnership(websiteId, userId);
  const insights: any[] = [];

  // Insight 1: High bounce rate on specific pages
  const bounceInsights = await generateBounceRateInsight(websiteId);
  if (bounceInsights) insights.push(bounceInsights);

  // Insight 2: High intent, no conversion
  const highIntentInsights = await generateHighIntentNoConversionInsight(websiteId);
  if (highIntentInsights) insights.push(highIntentInsights);

  // Insight 3: Opportunity to discover personas
  const personaDiscoveryInsight = await generatePersonaDiscoveryInsight(websiteId);
  if (personaDiscoveryInsight) insights.push(personaDiscoveryInsight);

  // Insight 4: Learning period completed
  const learningPeriodInsight = await generateLearningPeriodInsight(website);
  if (learningPeriodInsight) insights.push(learningPeriodInsight);

  return insights;
};

// --- Sub-functions for getInsightsData ---
async function generateBounceRateInsight(websiteId: string) {
  const bounceSessions = await prisma.session.findMany({
    where: { websiteId, duration: { lt: 10 } },
    include: { behavior: { select: { pageViews: { select: { url: true } } } } },
  });

  const filteredBounceSessions = bounceSessions.filter(s => s.behavior?.pageViews.length === 1);

  if (filteredBounceSessions.length > 10) {
    const pages: Record<string, number> = {};
    filteredBounceSessions.forEach(s => {
      const landingPage = s.behavior?.pageViews[0]?.url;
      if (landingPage) pages[landingPage] = (pages[landingPage] || 0) + 1;
    });

    const sortedPages = Object.entries(pages).sort((a, b) => b[1] - a[1]);
    if (sortedPages.length > 0) {
      const topBouncePage = sortedPages[0]!;
      return {
        type: 'opportunity',
        priority: 'high',
        message: `High bounce rate detected on ${topBouncePage[0]}. Consider improving content or adding personalization.`,
        action: 'optimize_page',
        data: { page: topBouncePage[0], bounces: topBouncePage[1] },
      };
    }
  }
  return null;
}

async function generateHighIntentNoConversionInsight(websiteId: string) {
  const highIntentNoConversion = await prisma.session.count({
    where: { websiteId, intentScore: { final: { gte: 70 } }, outcome: { not: 'purchase' } },
  });

  if (highIntentNoConversion > 5) {
    return {
      type: 'opportunity',
      priority: 'high',
      message: `${highIntentNoConversion} visitors with high purchase intent didn't convert. Add urgency CTAs or special offers.`,
      action: 'add_cta',
      data: { count: highIntentNoConversion },
    };
  }
  return null;
}

async function generatePersonaDiscoveryInsight(websiteId: string) {
  const totalSessions = await prisma.session.count({ where: { websiteId } });
  const personaCount = await prisma.persona.count({ where: { websiteId } });

  if (totalSessions > 100 && personaCount === 0) {
    return {
      type: 'action_needed',
      priority: 'medium',
      message: `You have ${totalSessions} sessions. Ready to discover user personas!`,
      action: 'discover_personas',
      data: { sessionCount: totalSessions },
    };
  }
  return null;
}

async function generateLearningPeriodInsight(website: any) {
  if (website.status === 'learning' && website.learningStartedAt) {
    const hoursSinceLearning = Math.floor(
      (Date.now() - website.learningStartedAt.getTime()) / (1000 * 60 * 60)
    );

    if (hoursSinceLearning >= (website.settings?.learningPeriodHours || 48)) {
      return {
        type: 'action_needed',
        priority: 'high',
        message: 'Learning period completed! Activate personalization to start optimizing.',
        action: 'activate_personalization',
        data: { hoursSinceLearning },
      };
    }
  }
  return null;
}

/**
 * Get top pages
 */
export const getTopPagesData = async (websiteId: string, userId: string, timeRange: string = '7d') => {
  await checkWebsiteOwnership(websiteId, userId);
  const { startDate } = parseTimeRange(timeRange);

  const events = await prisma.event.findMany({
    where: { websiteId, eventType: 'pageview', timestamp: { gte: startDate } },
    select: { eventData: true },
  });

  const pageViewsMap = new Map<string, number>();
  events.forEach(event => {
    const pageUrl = (event.eventData as any)?.pageUrl;
    if (pageUrl) {
      pageViewsMap.set(pageUrl, (pageViewsMap.get(pageUrl) || 0) + 1);
    }
  });

  const sortedPages = Array.from(pageViewsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return sortedPages.map(([page, views]) => ({ page, views }));
};

/**
 * Get intent distribution
 */
export const getIntentDistributionData = async (websiteId: string, userId: string) => {
  await checkWebsiteOwnership(websiteId, userId);
  // Calling the dedicated intent service
  return intentService.getIntentDistribution(websiteId);
};

/**
 * Get fraud summary
 */
export const getFraudSummaryData = async (websiteId: string, userId: string, timeRange: string = '30d') => {
  await checkWebsiteOwnership(websiteId, userId);
  const { startDate } = parseTimeRange(timeRange);

  const fraudIncidentsLast30Days = await prisma.userFraudScore.count({
    where: {
      user: { websites: { some: { id: websiteId } } },
      createdAt: { gte: startDate },
      current: { gte: 70 },
    },
  });

  const totalFraudScores = await prisma.userFraudScore.count({
    where: {
      user: { websites: { some: { id: websiteId } } },
      createdAt: { gte: startDate },
    },
  });

  return { fraudIncidentsLast30Days, totalFraudScores };
};

/**
 * Get persona summary
 */
export const getPersonaSummaryData = async (websiteId: string, userId: string) => {
  await checkWebsiteOwnership(websiteId, userId);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const totalPersonas = await prisma.persona.count({ where: { websiteId, isActive: true } });
  const newPersonasLast30Days = await prisma.persona.count({
    where: { websiteId, createdAt: { gte: thirtyDaysAgo } },
  });
  return { totalPersonas, newPersonasLast30Days };
};

/**
 * Get personalization status
 */
export const getPersonalizationStatusData = async (websiteId: string, userId: string) => {
  const website = await checkWebsiteOwnership(websiteId, userId);
  return { enabled: website.settings?.autoPersonalization || false };
};

/**
 * Get heatmap summary
 */
export const getHeatmapSummaryData = async (websiteId: string, userId: string) => {
  await checkWebsiteOwnership(websiteId, userId);
  const fortyEightHoursAgo = new Date();
  fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

  const recentClickEvent = await prisma.click.findFirst({
    where: { websiteId, timestamp: { gte: fortyEightHoursAgo } },
    orderBy: { timestamp: 'desc' },
    select: { timestamp: true },
  });

  return {
    hasRecentData: !!recentClickEvent,
    lastGenerated: recentClickEvent ? recentClickEvent.timestamp : null,
  };
};

/**
 * Get experiment summary
 */
export const getExperimentSummaryData = async (websiteId: string, userId: string) => {
  await checkWebsiteOwnership(websiteId, userId);
  const totalExperiments = await prisma.experiment.count({ where: { websiteId } });
  const activeExperiments = await prisma.experiment.count({ where: { websiteId, status: 'active' } });
  return { totalExperiments, activeExperiments };
};

/**
 * Get content summary
 */
export const getContentSummaryData = async (websiteId: string, userId: string) => {
  await checkWebsiteOwnership(websiteId, userId);
  const totalContentGenerated = await prisma.event.count({
    where: { websiteId, eventType: 'content_generated' },
  });
  const lastContentGeneratedEvent = await prisma.event.findFirst({
    where: { websiteId, eventType: 'content_generated' },
    orderBy: { timestamp: 'desc' },
    select: { timestamp: true },
  });

  return {
    totalContentGenerated,
    lastContentGenerated: lastContentGeneratedEvent ? lastContentGeneratedEvent.timestamp : null,
  };
};

/**
 * Get abandonment summary
 */
export const getAbandonmentSummaryData = async (websiteId: string, userId: string, timeRange: string = '30d') => {
  await checkWebsiteOwnership(websiteId, userId);
  const { startDate } = parseTimeRange(timeRange);

  const totalSessions = await prisma.session.count({ where: { websiteId, createdAt: { gte: startDate } } });
  const abandonedSessions = await prisma.session.count({ where: { websiteId, outcome: 'cart_abandon', createdAt: { gte: startDate } } });
  const abandonmentRate = totalSessions > 0 ? (abandonedSessions / totalSessions) * 100 : 0;

  const interventionsTriggeredLast30Days = await prisma.sessionIntervention.count({
    where: {
      session: { websiteId: websiteId },
      type: 'cart_abandon_prevention',
      timestamp: { gte: startDate },
    },
  });

  return {
    abandonmentRate: parseFloat(abandonmentRate.toFixed(2)),
    interventionsTriggeredLast30Days,
  };
};

/**
 * Get discount summary
 */
export const getDiscountSummaryData = async (websiteId: string, userId: string) => {
  await checkWebsiteOwnership(websiteId, userId);
  const totalDiscountsOffered = await prisma.userDiscount.count({
    where: { user: { websites: { some: { id: websiteId } } } },
  });

  const avgDiscountValueResult = await prisma.userDiscount.aggregate({
    where: { user: { websites: { some: { id: websiteId } } } },
    _avg: { amount: true },
  });
  const avgDiscountValue = avgDiscountValueResult._avg.amount || 0;

  return {
    totalDiscountsOffered,
    avgDiscountValue: parseFloat(avgDiscountValue.toFixed(2)),
  };
};
