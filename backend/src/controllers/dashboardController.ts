import { Response } from 'express';
import { asyncHandler } from '../utils/helpers';
import { sendResponse } from '../utils/responseHandler';
import AppError from '../utils/AppError';
import * as dashboardService from '../services/dashboardService';
import { AuthenticatedRequest } from '../types';
import { checkWebsiteOwnership } from '../utils/authUtils';

/**
 * Get dashboard overview
 */
export const getOverview = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const { websiteId, timeRange } = req.query;

    const data = await dashboardService.getOverviewData(websiteId as string, req.user.id!, timeRange as string);
    sendResponse(res, 200, data);
});

/**
 * Get real-time visitors
 */
export const getRealtimeVisitors = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const { websiteId } = req.query;

    const data = await dashboardService.getRealtimeVisitorsData(websiteId as string, req.user.id!);
    sendResponse(res, 200, data);
});

/**
 * Get heatmap data
 */
export const getHeatmap = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const { websiteId, pageUrl } = req.query;

    const data = await dashboardService.getHeatmapData(websiteId as string, pageUrl as string, req.user.id!);
    sendResponse(res, 200, data);
});

/**
 * Get AI insights
 */
export const getInsights = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const { websiteId } = req.query;

    const insights = await dashboardService.getInsightsData(websiteId as string, req.user.id!);
    sendResponse(res, 200, { insights, count: insights.length });
});

/**
 * Get conversion funnel
 */
export const getConversionFunnel = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const { websiteId } = req.query;

    const funnel = await dashboardService.getFunnelData(websiteId as string, req.user.id!);
    sendResponse(res, 200, { funnel });
});

/**
 * Get top pages
 */
export const getTopPages = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const { websiteId, timeRange } = req.query;

    const pages = await dashboardService.getTopPagesData(websiteId as string, req.user.id!, timeRange as string);
    sendResponse(res, 200, { pages });
});

/**
 * Get intent distribution
 */
export const getIntentDistribution = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const { websiteId } = req.query;

    const distribution = await dashboardService.getIntentDistributionData(websiteId as string, req.user.id!);
    sendResponse(res, 200, { intentDistribution: distribution });
});

/**
 * Get fraud summary
 */
export const getFraudSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const { websiteId, timeRange } = req.query;

    const data = await dashboardService.getFraudSummaryData(websiteId as string, req.user.id!, timeRange as string);
    sendResponse(res, 200, data);
});

/**
 * Get persona summary
 */
export const getPersonaSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const { websiteId } = req.query;

    const data = await dashboardService.getPersonaSummaryData(websiteId as string, req.user.id!);
    sendResponse(res, 200, data);
});

/**
 * Get personalization status
 */
export const getPersonalizationStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const { websiteId } = req.query;

    const data = await dashboardService.getPersonalizationStatusData(websiteId as string, req.user.id!);
    sendResponse(res, 200, data);
});

/**
 * Get heatmap summary
 */
export const getHeatmapSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const { websiteId } = req.query;

    const data = await dashboardService.getHeatmapSummaryData(websiteId as string, req.user.id!);
    sendResponse(res, 200, data);
});

/**
 * Get experiment summary
 */
export const getExperimentSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const { websiteId } = req.query;

    const data = await dashboardService.getExperimentSummaryData(websiteId as string, req.user.id!);
    sendResponse(res, 200, data);
});

/**
 * Get content summary
 */
export const getContentSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const { websiteId } = req.query;

    const data = await dashboardService.getContentSummaryData(websiteId as string, req.user.id!);
    sendResponse(res, 200, data);
});

/**
 * Get abandonment summary
 */
export const getAbandonmentSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const { websiteId, timeRange } = req.query;

    const data = await dashboardService.getAbandonmentSummaryData(websiteId as string, req.user.id!, timeRange as string);
    sendResponse(res, 200, data);
});

/**
 * Get discount summary
 */
export const getDiscountSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const { websiteId } = req.query;

    const data = await dashboardService.getDiscountSummaryData(websiteId as string, req.user.id!);
    sendResponse(res, 200, data);
});
