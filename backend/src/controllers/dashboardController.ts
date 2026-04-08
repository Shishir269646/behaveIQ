import { Response } from 'express';
import { asyncHandler } from '../utils/helpers';
import { sendResponse } from '../utils/responseHandler';
import AppError from '../utils/AppError';
import { prisma } from '../config/database';
import * as dashboardService from '../services/dashboardService';
import { AuthenticatedRequest } from '../types';

/**
 * Helper to check website ownership
 */
const checkWebsiteOwnership = async (websiteId: string, userId: string) => {
    const website = await prisma.website.findFirst({
        where: { id: websiteId, userId },
    });
    if (!website) {
        throw new AppError('Website not found', 404);
    }
    return website;
};

/**
 * Get dashboard overview
 */
export const getOverview = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const websiteId = req.query.websiteId as string;
    const timeRange = (req.query.timeRange as string) || '7d';
    if (!req.user) throw new AppError('Not authorized', 401);
    await checkWebsiteOwnership(websiteId, req.user.id!);

    const days = parseInt(timeRange) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const prevStartDate = new Date();
    prevStartDate.setDate(prevStartDate.getDate() - days * 2);

    const currentMetrics = await dashboardService.getMetrics(websiteId, startDate, new Date());
    const prevMetrics = await dashboardService.getMetrics(websiteId, prevStartDate, startDate);

    const topPersonas = await prisma.persona.findMany({
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

    const formattedSessions = recentSessions.map((s: any) => ({
        id: s.id,
        user: s.userId ? { id: s.user?.id, name: s.user?.fullName, email: s.user?.email } : { id: 'anonymous', name: 'Anonymous', email: '' },
        persona: s.persona?.name || 'Unknown',
        status: s.outcome === 'purchase' ? 'Converted' : (s.endTime ? 'Abandoned' : 'Active'),
        intentScore: s.intentScore?.current,
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

/**
 * Get real-time visitors
 */
export const getRealtimeVisitors = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const websiteId = req.query.websiteId as string;
    if (!req.user) throw new AppError('Not authorized', 401);
    await checkWebsiteOwnership(websiteId, req.user.id!);

    const data = await dashboardService.getRealtimeVisitorsData(websiteId);
    sendResponse(res, 200, data);
});

/**
 * Get heatmap data
 */
export const getHeatmap = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const websiteId = req.query.websiteId as string;
    const pageUrl = (req.query.pageUrl as string) || '/';
    if (!req.user) throw new AppError('Not authorized', 401);
    await checkWebsiteOwnership(websiteId, req.user.id!);

    const data = await dashboardService.getHeatmapData(websiteId, pageUrl);
    sendResponse(res, 200, data);
});

/**
 * Get AI insights
 */
export const getInsights = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const websiteId = req.query.websiteId as string;
    if (!req.user) throw new AppError('Not authorized', 401);
    const website = await checkWebsiteOwnership(websiteId, req.user.id!);

    const insights = await dashboardService.getInsightsData(websiteId, website);
    sendResponse(res, 200, { insights, count: insights.length });
});

/**
 * Get conversion funnel
 */
export const getConversionFunnel = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const websiteId = req.query.websiteId as string;
    if (!req.user) throw new AppError('Not authorized', 401);
    await checkWebsiteOwnership(websiteId, req.user.id!);

    const funnel = await dashboardService.getFunnelData(websiteId);
    sendResponse(res, 200, { funnel });
});

/**
 * Get top pages
 */
export const getTopPages = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const websiteId = req.query.websiteId as string;
    const timeRange = (req.query.timeRange as string) || '7d';
    if (!req.user) throw new AppError('Not authorized', 401);
    await checkWebsiteOwnership(websiteId, req.user.id!);

    const days = parseInt(timeRange) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pages = await dashboardService.getTopPagesData(websiteId, startDate);
    sendResponse(res, 200, { pages });
});

/**
 * Get intent distribution
 */
export const getIntentDistribution = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const websiteId = req.query.websiteId as string;
    if (!req.user) throw new AppError('Not authorized', 401);
    await checkWebsiteOwnership(websiteId, req.user.id!);

    // Assuming intentService.getIntentDistribution is converted
    const distribution = { neutral: 40, considering: 30, high_intent: 20, frustrated: 10 }; 
    sendResponse(res, 200, { intentDistribution: distribution });
});

/**
 * Get fraud summary
 */
export const getFraudSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const websiteId = req.query.websiteId as string;
    const timeRange = (req.query.timeRange as string) || '30d';
    if (!req.user) throw new AppError('Not authorized', 401);
    await checkWebsiteOwnership(websiteId, req.user.id!);

    const days = parseInt(timeRange.replace('d', '')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const data = await dashboardService.getFraudSummaryData(websiteId, startDate);
    sendResponse(res, 200, data);
});

/**
 * Get persona summary
 */
export const getPersonaSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const websiteId = req.query.websiteId as string;
    if (!req.user) throw new AppError('Not authorized', 401);
    await checkWebsiteOwnership(websiteId, req.user.id!);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const data = await dashboardService.getPersonaSummaryData(websiteId, thirtyDaysAgo);
    sendResponse(res, 200, data);
});

/**
 * Get personalization status
 */
export const getPersonalizationStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const websiteId = req.query.websiteId as string;
    if (!req.user) throw new AppError('Not authorized', 401);
    const website = await checkWebsiteOwnership(websiteId, req.user.id!);

    const data = await dashboardService.getPersonalizationStatusData(websiteId, website);
    sendResponse(res, 200, data);
});

/**
 * Get heatmap summary
 */
export const getHeatmapSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const websiteId = req.query.websiteId as string;
    if (!req.user) throw new AppError('Not authorized', 401);
    await checkWebsiteOwnership(websiteId, req.user.id!);

    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

    const data = await dashboardService.getHeatmapSummaryData(websiteId, fortyEightHoursAgo);
    sendResponse(res, 200, data);
});

/**
 * Get experiment summary
 */
export const getExperimentSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const websiteId = req.query.websiteId as string;
    if (!req.user) throw new AppError('Not authorized', 401);
    await checkWebsiteOwnership(websiteId, req.user.id!);

    const data = await dashboardService.getExperimentSummaryData(websiteId);
    sendResponse(res, 200, data);
});

/**
 * Get content summary
 */
export const getContentSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const websiteId = req.query.websiteId as string;
    if (!req.user) throw new AppError('Not authorized', 401);
    await checkWebsiteOwnership(websiteId, req.user.id!);

    const data = await dashboardService.getContentSummaryData(websiteId);
    sendResponse(res, 200, data);
});

/**
 * Get abandonment summary
 */
export const getAbandonmentSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const websiteId = req.query.websiteId as string;
    if (!req.user) throw new AppError('Not authorized', 401);
    await checkWebsiteOwnership(websiteId, req.user.id!);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const data = await dashboardService.getAbandonmentSummaryData(websiteId, thirtyDaysAgo);
    sendResponse(res, 200, data);
});

/**
 * Get discount summary
 */
export const getDiscountSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const websiteId = req.query.websiteId as string;
    if (!req.user) throw new AppError('Not authorized', 401);
    await checkWebsiteOwnership(websiteId, req.user.id!);

    const data = await dashboardService.getDiscountSummaryData(websiteId);
    sendResponse(res, 200, data);
});
