import { Response } from 'express';
import { asyncHandler } from '../utils/helpers';
import { sendSuccess } from '../utils/responseHandler';
import * as websiteService from '../services/websiteService';
import { AuthenticatedRequest } from '../types';

/**
 * Helper to enrich website object with SDK script
 */
const withScript = (website: any) => ({
  ...website,
  sdkScript: websiteService.generateSDKScript(website)
});

export const getWebsites = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const websites = await websiteService.getWebsites(req.user.id);
  sendSuccess(res, websites.map(withScript), 'Websites retrieved', 200, { count: websites.length });
});

export const createWebsite = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const website = await websiteService.createWebsite(req.user.id, req.body);
  sendSuccess(res, withScript(website), 'Website created', 201);
});

export const getWebsite = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const website = await websiteService.getWebsiteAndVerify(req.params.id, req.user.id);
  sendSuccess(res, withScript(website), 'Website retrieved');
});

export const updateWebsite = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const website = await websiteService.updateWebsite(req.params.id, req.user.id, req.body);
  sendSuccess(res, withScript(website), 'Website updated');
});

export const deleteWebsite = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await websiteService.getWebsiteAndVerify(req.params.id, req.user.id);
  await websiteService.deleteWebsite(req.params.id);
  sendSuccess(res, null, 'Website deleted successfully');
});

export const getSDKScript = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const website = await websiteService.getWebsiteAndVerify(req.params.id, req.user.id);
  sendSuccess(res, { script: websiteService.generateSDKScript(website) });
});

export const getWebsitePages = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await websiteService.getWebsiteAndVerify(req.params.websiteId, req.user.id);
  const pages = await websiteService.getWebsitePages(req.params.websiteId);
  sendSuccess(res, pages, 'Pages retrieved', 200, { count: pages.length });
});
