import { Request, Response } from 'express';
import { asyncHandler } from '../utils/helpers';
import { sendResponse } from '../utils/responseHandler';
import AppError from '../utils/AppError';
import { AuthenticatedRequest } from '../types';
import * as fraudService from '../services/fraudService';

/**
 * Get all fraud events for the current website
 */
export const getFraudEvents = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.website?.id) {
        throw new AppError('Forbidden: Website context not provided by authentication.', 403);
    }
    const { userId, riskLevel } = req.query;
    const fraudEvents = await fraudService.getFraudEvents(req.website.id, userId as string, riskLevel as string);
    sendResponse(res, 200, { data: fraudEvents, count: fraudEvents.length });
});

/**
 * Check fraud
 */
export const checkFraud = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.website?.id) {
        throw new AppError('Forbidden: A valid API key linked to a registered website is required.', 403);
    }
    const { userId, sessionData } = req.body;
    const result = await fraudService.checkFraudDetection(req.website.id, userId as string, sessionData);
    sendResponse(res, 200, result);
});
