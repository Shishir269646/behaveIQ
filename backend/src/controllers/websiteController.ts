import { Response } from 'express';
import { asyncHandler } from '../utils/helpers';
import { sendResponse } from '../utils/responseHandler';
import * as websiteService from '../services/websiteService';
import { AuthenticatedRequest } from '../types';
import AppError from '../utils/AppError';

/**
 * Get all websites for the current user
 */
export const getWebsites = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const websites = await websiteService.getWebsites(req.user.id!);
    
    const websitesWithScripts = websites.map(website => ({
        ...website,
        sdkScript: websiteService.generateSDKScript(website),
    }));

    sendResponse(res, 200, { websites: websitesWithScripts, count: websites.length });
});

/**
 * Create a new website
 */
export const createWebsite = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const website = await websiteService.createWebsite(req.user.id!, req.body);
    const sdkScript = websiteService.generateSDKScript(website);

    sendResponse(res, 201, {
        website: {
            ...website,
            sdkScript,
            apiKey: website.apiKey,
        }
    });
});

/**
 * Get a single website by ID
 */
export const getWebsite = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const id = req.params.id as string;
    const website = await websiteService.getWebsiteAndVerify(id, req.user.id!);
    const sdkScript = websiteService.generateSDKScript(website);

    sendResponse(res, 200, {
        website: {
            ...website,
            sdkScript,
        }
    });
});

/**
 * Update a website
 */
export const updateWebsite = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const id = req.params.id as string;
    const website = await websiteService.updateWebsite(id, req.user.id!, req.body);
    const sdkScript = websiteService.generateSDKScript(website);

    sendResponse(res, 200, {
        website: {
            ...website,
            sdkScript,
        }
    });
});

/**
 * Delete a website
 */
export const deleteWebsite = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const id = req.params.id as string;
    const website = await websiteService.getWebsiteAndVerify(id, req.user.id!);
    await websiteService.deleteWebsite(website.id);
    sendResponse(res, 200, {}, 'Website deleted successfully');
});

/**
 * Get SDK script
 */
export const getSDKScript = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const id = req.params.id as string;
    const website = await websiteService.getWebsiteAndVerify(id, req.user.id!);
    const script = websiteService.generateSDKScript(website);
    sendResponse(res, 200, { script });
});

/**
 * Get all unique page URLs for a website
 */
export const getWebsitePages = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const websiteId = req.params.websiteId as string;
    await websiteService.getWebsiteAndVerify(websiteId, req.user.id!);
    const pages = await websiteService.getWebsitePages(websiteId);
    sendResponse(res, 200, { pages, count: pages.length });
});
