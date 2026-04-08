"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteExperiment = exports.updateExperiment = exports.declareWinner = exports.updateExperimentStatus = exports.getExperiment = exports.createExperiment = exports.getExperiments = void 0;
const helpers_1 = require("../utils/helpers");
const responseHandler_1 = require("../utils/responseHandler");
const AppError_1 = __importDefault(require("../utils/AppError"));
const database_1 = require("../config/database");
const experimentService = __importStar(require("../services/experimentService"));
/**
 * Helper: Check ownership
 */
const checkOwnership = async (websiteId, userId) => {
    const website = await database_1.prisma.website.findUnique({
        where: { id: websiteId, userId },
    });
    if (!website) {
        throw new AppError_1.default('Website not found or not authorized', 403);
    }
    return website;
};
/**
 * Get all experiments
 */
exports.getExperiments = (0, helpers_1.asyncHandler)(async (req, res) => {
    const websiteId = req.query.websiteId || req.params.id;
    const status = req.query.status;
    if (!websiteId) {
        throw new AppError_1.default('Website ID is required.', 400);
    }
    if (!req.user)
        throw new AppError_1.default('Not authorized', 401);
    await checkOwnership(websiteId, req.user.id);
    const experiments = await experimentService.getExperiments(websiteId, status);
    (0, responseHandler_1.sendResponse)(res, 200, { experiments, count: experiments.length });
});
/**
 * Create new experiment
 */
exports.createExperiment = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { websiteId } = req.body;
    if (!req.user)
        throw new AppError_1.default('Not authorized', 401);
    await checkOwnership(websiteId, req.user.id);
    const experiment = await experimentService.createExperiment(websiteId, req.body);
    (0, responseHandler_1.sendResponse)(res, 201, { experiment });
});
/**
 * Get single experiment with results
 */
exports.getExperiment = (0, helpers_1.asyncHandler)(async (req, res) => {
    const experimentId = req.params.id;
    if (!req.user)
        throw new AppError_1.default('Not authorized', 401);
    const experiment = await experimentService.getExperiment(experimentId);
    // Verify ownership
    await checkOwnership(experiment.websiteId, req.user.id);
    (0, responseHandler_1.sendResponse)(res, 200, { experiment });
});
/**
 * Update experiment status
 */
exports.updateExperimentStatus = (0, helpers_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new AppError_1.default('Not authorized', 401);
    const experiment = await experimentService.getExperiment(req.params.id);
    await checkOwnership(experiment.websiteId, req.user.id);
    const updatedExperiment = await experimentService.updateStatus(req.params.id, req.body.status);
    (0, responseHandler_1.sendResponse)(res, 200, { experiment: updatedExperiment });
});
/**
 * Declare winner manually
 */
exports.declareWinner = (0, helpers_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new AppError_1.default('Not authorized', 401);
    const experiment = await experimentService.getExperiment(req.params.id);
    await checkOwnership(experiment.websiteId, req.user.id);
    const updatedExperiment = await experimentService.declareWinner(req.params.id, req.body.winningVariation);
    (0, responseHandler_1.sendResponse)(res, 200, { experiment: updatedExperiment }, 'Winner declared successfully');
});
/**
 * Update experiment
 */
exports.updateExperiment = (0, helpers_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new AppError_1.default('Not authorized', 401);
    const existing = await experimentService.getExperiment(req.params.id);
    await checkOwnership(existing.websiteId, req.user.id);
    const experiment = await experimentService.updateExperiment(req.params.id, req.body);
    (0, responseHandler_1.sendResponse)(res, 200, { experiment });
});
/**
 * Delete experiment
 */
exports.deleteExperiment = (0, helpers_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new AppError_1.default('Not authorized', 401);
    const existing = await experimentService.getExperiment(req.params.id);
    await checkOwnership(existing.websiteId, req.user.id);
    await experimentService.deleteExperiment(req.params.id);
    (0, responseHandler_1.sendResponse)(res, 200, {}, 'Experiment deleted successfully');
});
