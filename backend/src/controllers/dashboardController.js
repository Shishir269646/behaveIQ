const { asyncHandler } = require('../utils/helpers');
const { sendResponse } = require('../utils/responseHandler');
const AppError = require('../utils/AppError');
const { prisma } = require('../config/database'); // Import prisma client
const intentService = require('../services/intentService');
const dashboardService = require('../services/dashboardService');

// Helper to check website ownership
const checkWebsiteOwnership = async (websiteId, userId) => {
    const website = await prisma.website.findUnique({
        where: { id: websiteId, userId }, // Prisma allows compound unique on a combination of fields if defined in schema or just for querying
    });
    if (!website) {
        throw new AppError('Website not found', 404);
    }
    return website;
};

//  Get dashboard overview
const getOverview = asyncHandler(async (req, res) => {
    const { websiteId, timeRange = '7d' } = req.query;
    await checkWebsiteOwnership(websiteId, req.user.id); // Use req.user.id

    const days = parseInt(timeRange) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const prevStartDate = new Date();
    prevStartDate.setDate(prevStartDate.getDate() - days * 2);

    const currentMetrics = await dashboardService.getMetrics(websiteId, startDate, new Date());
    const prevMetrics = await dashboardService.getMetrics(websiteId, prevStartDate, startDate);

    const topPersonas = await prisma.persona.findMany({
        where: { websiteId, isActive: true },
        orderBy: { stats: { sessionCount: 'desc' } }, // Order by nested field
        take: 5,
        select: {
            name: true,
            stats: {
                select: {
                    sessionCount: true
                }
            }
        },
    });

    const trendData = await dashboardService.getTrendData(websiteId, startDate);
    const recentSessions = await dashboardService.getRecentSessions(websiteId, startDate);

    const formattedSessions = recentSessions.map(s => ({
        id: s.id, // Prisma uses 'id' not '_id'
        user: s.userId ? { id: s.user?.id, name: s.user?.fullName, email: s.user?.email } : { id: 'anonymous', name: 'Anonymous', email: '' }, // Access user via relation
        persona: s.persona?.name || 'Unknown', // Access persona via relation
        status: s.outcome === 'purchase' ? 'Converted' : (s.endTime ? 'Abandoned' : 'Active'), // Use outcome field
        intentScore: s.intentScore?.current, // Access nested intent score
        // events: s.events, // This needs to be included in recentSessions if needed
    }));

    sendResponse(res, 200, {
        overview: {
            totalVisitors: {
                value: currentMetrics.totalVisitors,
                change: dashboardService.calculateChange(currentMetrics.totalVisitors, prevMetrics.totalVisitors)
            },
            totalSessions: {
                value: currentMetrics.totalSessions,
                change: dashboardService.calculateChange(currentMetrics.totalSessions, prevMetrics.totalSessions)
            },
            totalConversions: {
                value: currentMetrics.conversions,
                change: dashboardService.calculateChange(currentMetrics.conversions, prevMetrics.conversions)
            },
            avgIntentScore: {
                value: parseFloat(currentMetrics.avgIntentScore.toFixed(2)),
                change: dashboardService.calculateChange(currentMetrics.avgIntentScore, prevMetrics.avgIntentScore)
            },
        },
        topPersonas,
        trendData,
        recentSessions: formattedSessions,
        timeRange: `${days}d`
    });
});

//  Get real-time visitors
const getRealtimeVisitors = asyncHandler(async (req, res) => {
    const { websiteId } = req.query;
    await checkWebsiteOwnership(websiteId, req.user.id); // Use req.user.id

    const data = await dashboardService.getRealtimeVisitorsData(websiteId);
    sendResponse(res, 200, data);
});

//  Get heatmap data
const getHeatmap = asyncHandler(async (req, res) => {
    const { websiteId, pageUrl = '/' } = req.query;
    await checkWebsiteOwnership(websiteId, req.user.id); // Use req.user.id

    const data = await dashboardService.getHeatmapData(websiteId, pageUrl);
    sendResponse(res, 200, data);
});

//  Get AI insights
const getInsights = asyncHandler(async (req, res) => {
    const { websiteId } = req.query;
    const website = await checkWebsiteOwnership(websiteId, req.user.id); // Use req.user.id

    const insights = await dashboardService.getInsightsData(websiteId, website);
    sendResponse(res, 200, { insights, count: insights.length });
});

// Get conversion funnel
const getConversionFunnel = asyncHandler(async (req, res) => {
    const { websiteId } = req.query;
    await checkWebsiteOwnership(websiteId, req.user.id); // Use req.user.id

    const funnel = await dashboardService.getFunnelData(websiteId);
    sendResponse(res, 200, { funnel });
});

// Get top pages
const getTopPages = asyncHandler(async (req, res) => {
    const { websiteId, timeRange = '7d' } = req.query;
    await checkWebsiteOwnership(websiteId, req.user.id); // Use req.user.id

    const days = parseInt(timeRange) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pages = await dashboardService.getTopPagesData(websiteId, startDate);
    sendResponse(res, 200, { pages });
});

//  Get intent distribution
const getIntentDistribution = asyncHandler(async (req, res) => {
    const { websiteId } = req.query;
    await checkWebsiteOwnership(websiteId, req.user.id); // Use req.user.id

    const distribution = await intentService.getIntentDistribution(websiteId);
    sendResponse(res, 200, { intentDistribution: distribution });
});

//  Get fraud summary
const getFraudSummary = asyncHandler(async (req, res) => {
    const { websiteId, timeRange = '30d' } = req.query;
    await checkWebsiteOwnership(websiteId, req.user.id); // Use req.user.id

    const days = parseInt(timeRange.replace('d', '')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const data = await dashboardService.getFraudSummaryData(websiteId, startDate);
    sendResponse(res, 200, data);
});

// Placeholder for getPersonaSummary
const getPersonaSummary = asyncHandler(async (req, res) => {
    const { websiteId } = req.query;
    await checkWebsiteOwnership(websiteId, req.user.id); // Use req.user.id

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const data = await dashboardService.getPersonaSummaryData(websiteId, thirtyDaysAgo);
    sendResponse(res, 200, data);
});

// Placeholder for getPersonalizationStatus
const getPersonalizationStatus = asyncHandler(async (req, res) => {
    const { websiteId } = req.query;
    const website = await checkWebsiteOwnership(websiteId, req.user.id); // Use req.user.id

    const data = await dashboardService.getPersonalizationStatusData(websiteId, website);
    sendResponse(res, 200, data);
});

// Placeholder for getHeatmapSummary
const getHeatmapSummary = asyncHandler(async (req, res) => {
    const { websiteId } = req.query;
    await checkWebsiteOwnership(websiteId, req.user.id); // Use req.user.id

    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

    const data = await dashboardService.getHeatmapSummaryData(websiteId, fortyEightHoursAgo);
    sendResponse(res, 200, data);
});

// Placeholder for getExperimentSummary
const getExperimentSummary = asyncHandler(async (req, res) => {
    const { websiteId } = req.query;
    await checkWebsiteOwnership(websiteId, req.user.id); // Use req.user.id

    const data = await dashboardService.getExperimentSummaryData(websiteId);
    sendResponse(res, 200, data);
});

// Placeholder for getContentSummary
const getContentSummary = asyncHandler(async (req, res) => {
    const { websiteId } = req.query;
    await checkWebsiteOwnership(websiteId, req.user.id); // Use req.user.id

    const data = await dashboardService.getContentSummaryData(websiteId);
    sendResponse(res, 200, data);
});

// Placeholder for getAbandonmentSummary
const getAbandonmentSummary = asyncHandler(async (req, res) => {
    const { websiteId } = req.query;
    await checkWebsiteOwnership(websiteId, req.user.id); // Use req.user.id

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const data = await dashboardService.getAbandonmentSummaryData(websiteId, thirtyDaysAgo);
    sendResponse(res, 200, data);
});

// Placeholder for getDiscountSummary
const getDiscountSummary = asyncHandler(async (req, res) => {
    const { websiteId } = req.query;
    await checkWebsiteOwnership(websiteId, req.user.id); // Use req.user.id

    const data = await dashboardService.getDiscountSummaryData(websiteId);
    sendResponse(res, 200, data);
});

module.exports = {
    getOverview,
    getRealtimeVisitors,
    getHeatmap,
    getInsights,
    getConversionFunnel,
    getTopPages,
    getIntentDistribution,
    getFraudSummary,
    getPersonaSummary,        
    getPersonalizationStatus, 
    getHeatmapSummary,        
    getExperimentSummary,    
    getContentSummary,        
    getAbandonmentSummary,    
    getDiscountSummary,      
};