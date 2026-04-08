"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDiscountSummary = exports.getAbandonmentSummary = exports.getContentSummary = exports.getExperimentSummary = exports.getHeatmapSummary = exports.getPersonalizationStatus = exports.getPersonaSummary = exports.getFraudSummary = exports.getIntentDistribution = exports.getTopPages = exports.getConversionFunnel = exports.getInsights = exports.getHeatmap = exports.getRealtimeVisitors = exports.getOverview = void 0;
const helpers_1 = require("../utils/helpers");
const responseHandler_1 = require("../utils/responseHandler");
const AppError_1 = __importDefault(require("../utils/AppError"));
const database_1 = require("../config/database");
const dashboardService = __importStar(require("../services/dashboardService"));
/**
 * Helper to check website ownership
 */
const checkWebsiteOwnership = async (websiteId, userId) => {
    const website = await database_1.prisma.website.findFirst({
        where: { id: websiteId, userId },
    });
    if (!website) {
        throw new AppError_1.default('Website not found', 404);
    }
    return website;
};
/**
 * Get dashboard overview
 */
exports.getOverview = (0, helpers_1.asyncHandler)(async (req, res) => {
    const websiteId = req.query.websiteId;
    const timeRange = req.query.timeRange || '7d';
    if (!req.user)
        throw new AppError_1.default('Not authorized', 401);
    await checkWebsiteOwnership(websiteId, req.user.id);
    const days = parseInt(timeRange) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const prevStartDate = new Date();
    prevStartDate.setDate(prevStartDate.getDate() - days * 2);
    const currentMetrics = await dashboardService.getMetrics(websiteId, startDate, new Date());
    const prevMetrics = await dashboardService.getMetrics(websiteId, prevStartDate, startDate);
    const topPersonas = await database_1.prisma.persona.findMany({
        where: { websiteId, isActive: true },
        orderBy: { stats: { sessionCount: 'desc' } },
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
    const formattedSessions = recentSessions.map((s) => ({
        id: s.id,
        user: s.userId ? { id: s.user?.id, name: s.user?.fullName, email: s.user?.email } : { id: 'anonymous', name: 'Anonymous', email: '' },
        persona: s.persona?.name || 'Unknown',
        status: s.outcome === 'purchase' ? 'Converted' : (s.endTime ? 'Abandoned' : 'Active'),
        intentScore: s.intentScore?.current,
    }));
    (0, responseHandler_1.sendResponse)(res, 200, {
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
/**
 * Get real-time visitors
 */
exports.getRealtimeVisitors = (0, helpers_1.asyncHandler)(async (req, res) => {
    const websiteId = req.query.websiteId;
    if (!req.user)
        throw new AppError_1.default('Not authorized', 401);
    await checkWebsiteOwnership(websiteId, req.user.id);
    const data = await dashboardService.getRealtimeVisitorsData(websiteId);
    (0, responseHandler_1.sendResponse)(res, 200, data);
});
/**
 * Get heatmap data
 */
exports.getHeatmap = (0, helpers_1.asyncHandler)(async (req, res) => {
    const websiteId = req.query.websiteId;
    const pageUrl = req.query.pageUrl || '/';
    if (!req.user)
        throw new AppError_1.default('Not authorized', 401);
    await checkWebsiteOwnership(websiteId, req.user.id);
    const data = await dashboardService.getHeatmapData(websiteId, pageUrl);
    (0, responseHandler_1.sendResponse)(res, 200, data);
});
/**
 * Get AI insights
 */
exports.getInsights = (0, helpers_1.asyncHandler)(async (req, res) => {
    const websiteId = req.query.websiteId;
    if (!req.user)
        throw new AppError_1.default('Not authorized', 401);
    const website = await checkWebsiteOwnership(websiteId, req.user.id);
    const insights = await dashboardService.getInsightsData(websiteId, website);
    (0, responseHandler_1.sendResponse)(res, 200, { insights, count: insights.length });
});
/**
 * Get conversion funnel
 */
exports.getConversionFunnel = (0, helpers_1.asyncHandler)(async (req, res) => {
    const websiteId = req.query.websiteId;
    if (!req.user)
        throw new AppError_1.default('Not authorized', 401);
    await checkWebsiteOwnership(websiteId, req.user.id);
    const funnel = await dashboardService.getFunnelData(websiteId);
    (0, responseHandler_1.sendResponse)(res, 200, { funnel });
});
/**
 * Get top pages
 */
exports.getTopPages = (0, helpers_1.asyncHandler)(async (req, res) => {
    const websiteId = req.query.websiteId;
    const timeRange = req.query.timeRange || '7d';
    if (!req.user)
        throw new AppError_1.default('Not authorized', 401);
    await checkWebsiteOwnership(websiteId, req.user.id);
    const days = parseInt(timeRange) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const pages = await dashboardService.getTopPagesData(websiteId, startDate);
    (0, responseHandler_1.sendResponse)(res, 200, { pages });
});
/**
 * Get intent distribution
 */
exports.getIntentDistribution = (0, helpers_1.asyncHandler)(async (req, res) => {
    const websiteId = req.query.websiteId;
    if (!req.user)
        throw new AppError_1.default('Not authorized', 401);
    await checkWebsiteOwnership(websiteId, req.user.id);
    // Assuming intentService.getIntentDistribution is converted
    const distribution = { neutral: 40, considering: 30, high_intent: 20, frustrated: 10 };
    (0, responseHandler_1.sendResponse)(res, 200, { intentDistribution: distribution });
});
/**
 * Get fraud summary
 */
exports.getFraudSummary = (0, helpers_1.asyncHandler)(async (req, res) => {
    const websiteId = req.query.websiteId;
    const timeRange = req.query.timeRange || '30d';
    if (!req.user)
        throw new AppError_1.default('Not authorized', 401);
    await checkWebsiteOwnership(websiteId, req.user.id);
    const days = parseInt(timeRange.replace('d', '')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const data = await dashboardService.getFraudSummaryData(websiteId, startDate);
    (0, responseHandler_1.sendResponse)(res, 200, data);
});
/**
 * Get persona summary
 */
exports.getPersonaSummary = (0, helpers_1.asyncHandler)(async (req, res) => {
    const websiteId = req.query.websiteId;
    if (!req.user)
        throw new AppError_1.default('Not authorized', 401);
    await checkWebsiteOwnership(websiteId, req.user.id);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const data = await dashboardService.getPersonaSummaryData(websiteId, thirtyDaysAgo);
    (0, responseHandler_1.sendResponse)(res, 200, data);
});
/**
 * Get personalization status
 */
exports.getPersonalizationStatus = (0, helpers_1.asyncHandler)(async (req, res) => {
    const websiteId = req.query.websiteId;
    if (!req.user)
        throw new AppError_1.default('Not authorized', 401);
    const website = await checkWebsiteOwnership(websiteId, req.user.id);
    const data = await dashboardService.getPersonalizationStatusData(websiteId, website);
    (0, responseHandler_1.sendResponse)(res, 200, data);
});
/**
 * Get heatmap summary
 */
exports.getHeatmapSummary = (0, helpers_1.asyncHandler)(async (req, res) => {
    const websiteId = req.query.websiteId;
    if (!req.user)
        throw new AppError_1.default('Not authorized', 401);
    await checkWebsiteOwnership(websiteId, req.user.id);
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);
    const data = await dashboardService.getHeatmapSummaryData(websiteId, fortyEightHoursAgo);
    (0, responseHandler_1.sendResponse)(res, 200, data);
});
/**
 * Get experiment summary
 */
exports.getExperimentSummary = (0, helpers_1.asyncHandler)(async (req, res) => {
    const websiteId = req.query.websiteId;
    if (!req.user)
        throw new AppError_1.default('Not authorized', 401);
    await checkWebsiteOwnership(websiteId, req.user.id);
    const data = await dashboardService.getExperimentSummaryData(websiteId);
    (0, responseHandler_1.sendResponse)(res, 200, data);
});
/**
 * Get content summary
 */
exports.getContentSummary = (0, helpers_1.asyncHandler)(async (req, res) => {
    const websiteId = req.query.websiteId;
    if (!req.user)
        throw new AppError_1.default('Not authorized', 401);
    await checkWebsiteOwnership(websiteId, req.user.id);
    const data = await dashboardService.getContentSummaryData(websiteId);
    (0, responseHandler_1.sendResponse)(res, 200, data);
});
/**
 * Get abandonment summary
 */
exports.getAbandonmentSummary = (0, helpers_1.asyncHandler)(async (req, res) => {
    const websiteId = req.query.websiteId;
    if (!req.user)
        throw new AppError_1.default('Not authorized', 401);
    await checkWebsiteOwnership(websiteId, req.user.id);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const data = await dashboardService.getAbandonmentSummaryData(websiteId, thirtyDaysAgo);
    (0, responseHandler_1.sendResponse)(res, 200, data);
});
/**
 * Get discount summary
 */
exports.getDiscountSummary = (0, helpers_1.asyncHandler)(async (req, res) => {
    const websiteId = req.query.websiteId;
    if (!req.user)
        throw new AppError_1.default('Not authorized', 401);
    await checkWebsiteOwnership(websiteId, req.user.id);
    const data = await dashboardService.getDiscountSummaryData(websiteId);
    (0, responseHandler_1.sendResponse)(res, 200, data);
});
