import { Response } from 'express';
import { asyncHandler } from '../utils/helpers';
import { sendSuccess } from '../utils/responseHandler';
import * as abandonmentService from '../services/abandonmentService';
import { AuthenticatedRequest } from '../types';

export const getAbandonmentStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const websiteId = req.params.websiteId;
  const stats = await abandonmentService.getWebsiteAbandonmentStats(websiteId, req.user.id);
  sendSuccess(res, stats, 'Abandonment statistics retrieved');
});

export const trackAbandonmentIntent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await abandonmentService.processAbandonmentIntent(req.body);
  sendSuccess(res, result, 'Abandonment intent tracked', 201);
});
