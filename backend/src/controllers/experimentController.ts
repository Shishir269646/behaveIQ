import { Response, Request } from 'express';
import { asyncHandler } from '../utils/helpers';
import { sendResponse } from '../utils/responseHandler';
import AppError from '../utils/AppError';
import { prisma } from '../config/database';
import * as experimentService from '../services/experimentService';
import { AuthenticatedRequest } from '../types';

/**
 * Helper: Check ownership
 */
const checkOwnership = async (websiteId: string, userId: string) => {
    const website = await prisma.website.findUnique({
        where: { id: websiteId, userId },
    });
    if (!website) {
        throw new AppError('Website not found or not authorized', 403);
    }
    return website;
};

/**
 * Get all experiments
 */
export const getExperiments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const websiteId = (req.query.websiteId as string) || (req.params.id as string);
    const status = req.query.status as string;

    if (!websiteId) {
        throw new AppError('Website ID is required.', 400);
    }

    if (!req.user) throw new AppError('Not authorized', 401);
    await checkOwnership(websiteId as string, req.user.id!);

    const experiments = await experimentService.getExperiments(websiteId as string, status);
    sendResponse(res, 200, { experiments, count: experiments.length });
});

/**
 * Create new experiment
 */
export const createExperiment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { websiteId } = req.body;
    if (!req.user) throw new AppError('Not authorized', 401);
    await checkOwnership(websiteId as string, req.user.id!);

    const experiment = await experimentService.createExperiment(websiteId, req.body);
    sendResponse(res, 201, { experiment });
});

/**
 * Get single experiment with results
 */
export const getExperiment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const experimentId = req.params.id as string;
    if (!req.user) throw new AppError('Not authorized', 401);

    const experiment = await experimentService.getExperiment(experimentId);
    
    // Verify ownership
    await checkOwnership(experiment.websiteId, req.user.id!);

    sendResponse(res, 200, { experiment });
});

/**
 * Update experiment status
 */
export const updateExperimentStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const experiment = await experimentService.getExperiment(req.params.id as string);
    await checkOwnership(experiment.websiteId, req.user.id!);

    const updatedExperiment = await experimentService.updateStatus(req.params.id as string, req.body.status);
    sendResponse(res, 200, { experiment: updatedExperiment });
});

/**
 * Declare winner manually
 */
export const declareWinner = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const experiment = await experimentService.getExperiment(req.params.id as string);
    await checkOwnership(experiment.websiteId, req.user.id!);

    const updatedExperiment = await experimentService.declareWinner(req.params.id as string, req.body.winningVariation);
    sendResponse(res, 200, { experiment: updatedExperiment }, 'Winner declared successfully');
});

/**
 * Update experiment
 */
export const updateExperiment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const existing = await experimentService.getExperiment(req.params.id as string);
    await checkOwnership(existing.websiteId, req.user.id!);

    const experiment = await experimentService.updateExperiment(req.params.id as string, req.body);
    sendResponse(res, 200, { experiment });
});

/**
 * Delete experiment
 */
export const deleteExperiment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const existing = await experimentService.getExperiment(req.params.id as string);
    await checkOwnership(existing.websiteId, req.user.id!);

    await experimentService.deleteExperiment(req.params.id as string);
    sendResponse(res, 200, {}, 'Experiment deleted successfully');
});
