import { Response, Request } from 'express';
import { asyncHandler } from '../utils/helpers';
import { sendResponse } from '../utils/responseHandler';
import AppError from '../utils/AppError';
import * as experimentService from '../services/experimentService';
import { AuthenticatedRequest } from '../types';
import { ExperimentStatus } from '@prisma/client';

/**
 * Get all experiments
 */
export const getExperiments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const websiteId = (req.query.websiteId || req.params.id) as string; // Consistent websiteId extraction
    const status = req.query.status as ExperimentStatus;

    const experiments = await experimentService.getExperiments(websiteId, req.user.id, status);
    sendResponse(res, 200, { experiments, count: experiments.length });
});

/**
 * Create new experiment
 */
export const createExperiment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const { websiteId } = req.body;

    const experiment = await experimentService.createExperiment(websiteId, req.user.id, req.body);
    sendResponse(res, 201, { experiment });
});

/**
 * Get single experiment with results
 */
export const getExperiment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const experimentId = req.params.id as string;

    const experiment = await experimentService.getExperimentById(experimentId, req.user.id);
    sendResponse(res, 200, { experiment });
});

/**
 * Update experiment status
 */
export const updateExperimentStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const experimentId = req.params.id as string;
    const status = req.body.status as ExperimentStatus;

    const updatedExperiment = await experimentService.updateStatus(experimentId, req.user.id, status);
    sendResponse(res, 200, { experiment: updatedExperiment });
});

/**
 * Declare winner manually
 */
export const declareWinner = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const experimentId = req.params.id as string;
    const { winningVariation } = req.body;

    const updatedExperiment = await experimentService.declareWinner(experimentId, req.user.id, winningVariation);
    sendResponse(res, 200, { experiment: updatedExperiment }, 'Winner declared successfully');
});

/**
 * Update experiment
 */
export const updateExperiment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const experimentId = req.params.id as string;

    const experiment = await experimentService.updateExperiment(experimentId, req.user.id, req.body);
    sendResponse(res, 200, { experiment });
});

/**
 * Delete experiment
 */
export const deleteExperiment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authorized', 401);
    const experimentId = req.params.id as string;

    const result = await experimentService.deleteExperiment(experimentId, req.user.id);
    sendResponse(res, 200, result, result.message);
});
