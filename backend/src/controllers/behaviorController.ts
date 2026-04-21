import { Request, Response } from 'express';
import { asyncHandler } from '../utils/helpers';
import { sendSuccess } from '../utils/responseHandler';
import * as behaviorService from '../services/behaviorService';
import { AuthenticatedRequest } from '../types';

/**
 * Track a behavior event from the SDK
 */
export const trackEvent = asyncHandler(async (req: Request, res: Response) => {
    const apiKey = req.headers['x-api-key'] as string;
    const result = await behaviorService.trackBehaviorEvent(apiKey, req.body);
    
    sendSuccess(res, result || { success: true }, 'Behavior event tracked successfully');
});

/**
 * Get behavioral summary for a specific session
 */
export const getBehaviorSummary = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const summary = await behaviorService.getSessionBehaviorSummary(sessionId as string);

    sendSuccess(res, summary, 'Behavior summary retrieved successfully');
});
