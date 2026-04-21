import { Request, Response } from 'express';
import { asyncHandler } from '../utils/helpers';
import { sendResponse } from '../utils/responseHandler';
import * as sdkService from '../services/sdkService';

/**
 * Get SDK configuration
 */
export const getSDKConfig = asyncHandler(async (req: Request, res: Response) => {
    const { apiKey } = req.query;
    const config = await sdkService.getSDKConfiguration(apiKey as string);
    sendResponse(res, 200, { config });
});

/**
 * Identify user
 */
export const identifyUser = asyncHandler(async (req: Request, res: Response) => {
    const { apiKey, externalId, traits, fingerprint } = req.body;
    const result = await sdkService.identifyUserWithExternalId(apiKey, externalId, traits, fingerprint);
    sendResponse(res, 200, result);
});

/**
 * Track event from SDK
 */
export const trackEvent = asyncHandler(async (req: Request, res: Response) => {
    const { apiKey, sessionId, eventType, eventData, url, timestamp, fingerprint } = req.body;
    const result = await sdkService.trackSDKEvent(apiKey, sessionId, eventType, eventData, url, timestamp, fingerprint);
    sendResponse(res, 200, result);
});

/**
 * Send heartbeat
 */
export const sendHeartbeat = asyncHandler(async (req: Request, res: Response) => {
    const { apiKey, sessionId } = req.body;
    const result = await sdkService.updateSessionHeartbeat(apiKey, sessionId);
    sendResponse(res, 200, result);
});

/**
 * Get personalization rules
 */
export const getPersonalization = asyncHandler(async (req: Request, res: Response) => {
    const { apiKey, sessionId } = req.params;
    const result = await sdkService.getPersonalizationRules(apiKey, sessionId);
    sendResponse(res, 200, result);
});

/**
 * Calculate intent score
 */
export const calculateIntent = asyncHandler(async (req: Request, res: Response) => {
    const { apiKey, sessionId, sessionData } = req.body;
    const result = await sdkService.calculateSessionIntent(apiKey, sessionId, sessionData);
    sendResponse(res, 200, result);
});
