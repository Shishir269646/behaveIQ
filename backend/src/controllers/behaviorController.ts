import { Request, Response } from 'express';
import { asyncHandler } from '../utils/helpers';
import { sendResponse } from '../utils/responseHandler';
import AppError from '../utils/AppError';
import * as behaviorService from '../services/behaviorService';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../types';

/**
 * Track behavior event
 */
export const trackEvent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const apiKey = req.headers['x-api-key'] as string;
    const website = await prisma.website.findUnique({ where: { apiKey } });

    if (!website) {
        throw new AppError('A valid API key is required.', 403);
    }

    const result = await behaviorService.trackEvent(website, req.body);

    if (result) {
        return sendResponse(res, 200, result);
    }

    sendResponse(res, 200, { success: true });
});

/**
 * Get behavior summary
 */
export const getBehaviorSummary = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const summary = await behaviorService.getSummary(sessionId as string);

    if (!summary) {
        throw new AppError('Session not found', 404);
    }

    sendResponse(res, 200, summary);
});
