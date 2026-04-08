import { Request, Response } from 'express';
import { asyncHandler } from '../utils/helpers';
import { sendResponse } from '../utils/responseHandler';
import * as abandonmentService from '../services/abandonmentService';
import * as websiteService from '../services/websiteService';
import { AuthenticatedRequest } from '../types';

/**
 * Predict abandonment risk
 */
export const predictRisk = asyncHandler(async (req: Request, res: Response) => {
    const { userId, sessionId, websiteId } = req.body;
    const result = await abandonmentService.predictAbandonmentRisk(sessionId, websiteId, userId);
    sendResponse(res, 200, result);
});

/**
 * Track intervention response
 */
export const trackInterventionResponse = asyncHandler(async (req: Request, res: Response) => {
    const { interventionId, response, outcome } = req.body;
    const result = await abandonmentService.trackInterventionResponse(interventionId, response, outcome);
    sendResponse(res, 200, result);
});

/**
 * Get abandonment statistics
 */
export const getAbandonmentStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { websiteId, timeRange = '7d' } = req.query;
    if (!req.user?.id) return res.status(401).json({ success: false, message: 'Not authorized' });

    await websiteService.getWebsiteAndVerify(websiteId as string, req.user.id);

    const days = parseInt(timeRange as string) || 7;
    const stats = await abandonmentService.getStats(websiteId as string, days);

    sendResponse(res, 200, stats);
});
