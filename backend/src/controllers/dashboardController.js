const { asyncHandler } = require('../utils/helpers');
const { sendResponse } = require('../utils/responseHandler');
const AppError = require('../utils/AppError');
const Website = require('../models/Website');
const Persona = require('../models/Persona');
const intentService = require('../services/intentService');
const dashboardService = require('../services/dashboardService');

// Helper to check website ownership
const checkWebsiteOwnership = async (websiteId, userId) => {
    const website = await Website.findOne({ _id: websiteId, userId });
    if (!website) {
        throw new AppError('Website not found', 404);
    }
    return website;
};

//  Get dashboard overview
const getOverview = asyncHandler(async (req, res) => {
    const { websiteId, timeRange = '7d' } = req.query;
    await checkWebsiteOwnership(websiteId, req.user._id);

    const days = parseInt(timeRange) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const prevStartDate = new Date();
    prevStartDate.setDate(prevStartDate.getDate() - days * 2);

    const currentMetrics = await dashboardService.getMetrics(websiteId, startDate, new Date());
    const prevMetrics = await dashboardService.getMetrics(websiteId, prevStartDate, startDate);

    const topPersonas = await Persona.find({ websiteId, isActive: true })
        .sort('-stats.sessionCount')
        .limit(5)
        .select('name stats')
        .lean();

    const trendData = await dashboardService.getTrendData(websiteId, startDate);
    const recentSessions = await dashboardService.getRecentSessions(websiteId, startDate);

    const formattedSessions = recentSessions.map(s => ({
        id: s._id,
        user: s.userId ? { id: s.userId._id, name: s.userId.name, email: s.userId.email } : { id: 'anonymous', name: 'Anonymous', email: '' },
        persona: s.personaId ? s.personaId.name : 'Unknown',
        status: s.converted ? 'Converted' : (s.endTime ? 'Abandoned' : 'Active'),
        intentScore: s.intentScore,
        events: s.events,
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
    await checkWebsiteOwnership(websiteId, req.user._id);

    const data = await dashboardService.getRealtimeVisitorsData(websiteId);
    sendResponse(res, 200, data);
});

//  Get heatmap data
const getHeatmap = asyncHandler(async (req, res) => {
    const { websiteId, pageUrl = '/' } = req.query;
    await checkWebsiteOwnership(websiteId, req.user._id);

    const data = await dashboardService.getHeatmapData(websiteId, pageUrl);
    sendResponse(res, 200, data);
});

//  Get AI insights
const getInsights = asyncHandler(async (req, res) => {
    const { websiteId } = req.query;
    const website = await checkWebsiteOwnership(websiteId, req.user._id);

    const insights = await dashboardService.getInsightsData(websiteId, website);
    sendResponse(res, 200, { insights, count: insights.length });
});

// Get conversion funnel
const getConversionFunnel = asyncHandler(async (req, res) => {
    const { websiteId } = req.query;
    await checkWebsiteOwnership(websiteId, req.user._id);

    const funnel = await dashboardService.getFunnelData(websiteId);
    sendResponse(res, 200, { funnel });
});

// Get top pages
const getTopPages = asyncHandler(async (req, res) => {
    const { websiteId, timeRange = '7d' } = req.query;
    await checkWebsiteOwnership(websiteId, req.user._id);

    const days = parseInt(timeRange) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pages = await dashboardService.getTopPagesData(websiteId, startDate);
    sendResponse(res, 200, { pages });
});

//  Get intent distribution
const getIntentDistribution = asyncHandler(async (req, res) => {
    const { websiteId } = req.query;
    await checkWebsiteOwnership(websiteId, req.user._id);

    const distribution = await intentService.getIntentDistribution(websiteId);
    sendResponse(res, 200, { intentDistribution: distribution });
});

//  Get fraud summary
const getFraudSummary = asyncHandler(async (req, res) => {
    const { websiteId, timeRange = '30d' } = req.query;
    await checkWebsiteOwnership(websiteId, req.user._id);

    const days = parseInt(timeRange.replace('d', '')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const data = await dashboardService.getFraudSummaryData(websiteId, startDate);
    sendResponse(res, 200, data);
});

// Placeholder for getPersonaSummary
const getPersonaSummary = asyncHandler(async (req, res) => {
    const { websiteId } = req.query;
    await checkWebsiteOwnership(websiteId, req.user._id);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const data = await dashboardService.getPersonaSummaryData(websiteId, thirtyDaysAgo);
    sendResponse(res, 200, data);
});

// Placeholder for getPersonalizationStatus
const getPersonalizationStatus = asyncHandler(async (req, res) => {
    const { websiteId } = req.query;
    const website = await checkWebsiteOwnership(websiteId, req.user._id);

    const data = await dashboardService.getPersonalizationStatusData(websiteId, website);
    sendResponse(res, 200, data);
});

// Placeholder for getHeatmapSummary
const getHeatmapSummary = asyncHandler(async (req, res) => {
    const { websiteId } = req.query;
    await checkWebsiteOwnership(websiteId, req.user._id);

    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

    const data = await dashboardService.getHeatmapSummaryData(websiteId, fortyEightHoursAgo);
    sendResponse(res, 200, data);
});

// Placeholder for getExperimentSummary
const getExperimentSummary = asyncHandler(async (req, res) => {
    const { websiteId } = req.query;
    await checkWebsiteOwnership(websiteId, req.user._id);

    const data = await dashboardService.getExperimentSummaryData(websiteId);
    sendResponse(res, 200, data);
});

// Placeholder for getContentSummary
const getContentSummary = asyncHandler(async (req, res) => {
    const { websiteId } = req.query;
    await checkWebsiteOwnership(websiteId, req.user._id);

    const data = await dashboardService.getContentSummaryData(websiteId);
    sendResponse(res, 200, data);
});

// Placeholder for getAbandonmentSummary
const getAbandonmentSummary = asyncHandler(async (req, res) => {
    const { websiteId } = req.query;
    await checkWebsiteOwnership(websiteId, req.user._id);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const data = await dashboardService.getAbandonmentSummaryData(websiteId, thirtyDaysAgo);
    sendResponse(res, 200, data);
});

// Placeholder for getDiscountSummary
const getDiscountSummary = asyncHandler(async (req, res) => {
    const { websiteId } = req.query;
    await checkWebsiteOwnership(websiteId, req.user._id);

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