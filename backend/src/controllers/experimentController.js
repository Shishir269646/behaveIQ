const { asyncHandler } = require('../utils/helpers');
const { sendResponse } = require('../utils/responseHandler');
const AppError = require('../utils/AppError');
const Website = require('../models/Website');
const experimentService = require('../services/experimentService');

// Helper: Check ownership
const checkOwnership = async (websiteId, userId) => {
    const website = await Website.findOne({ _id: websiteId, userId });
    if (!website) {
        throw new AppError('Website not found or not authorized', 403);
    }
    return website;
};

//  Get all experiments
const getExperiments = asyncHandler(async (req, res) => {
    const websiteId = req.query.websiteId || req.params.id;
    const { status } = req.query;

    if (!websiteId) {
        throw new AppError('Website ID is required.', 400);
    }

    await checkOwnership(websiteId, req.user._id);

    const experiments = await experimentService.getExperiments(websiteId, status);
    sendResponse(res, 200, { experiments, count: experiments.length });
});

//   Create new experiment
const createExperiment = asyncHandler(async (req, res) => {
    const { websiteId } = req.body;
    await checkOwnership(websiteId, req.user._id);

    const experiment = await experimentService.createExperiment(websiteId, req.body);
    sendResponse(res, 201, { experiment });
});

//  Get single experiment with results
const getExperiment = asyncHandler(async (req, res) => {
    const experimentId = req.params.id;
    // Ownership check happens inside service get logic typically, but since service doesn't know about user:
    // We fetch experiment first or pass user down. 
    // Optimization: fetch experiment, check websiteId against user's websites.
    
    // However, to keep it clean, we'll let service fetch it, then check ownership here.
    const experiment = await experimentService.getExperiment(experimentId);
    
    // Verify ownership
    await checkOwnership(experiment.websiteId, req.user._id);

    sendResponse(res, 200, { experiment });
});

//  Update experiment status
const updateExperimentStatus = asyncHandler(async (req, res) => {
    const experiment = await experimentService.getExperiment(req.params.id);
    await checkOwnership(experiment.websiteId, req.user._id);

    const updatedExperiment = await experimentService.updateStatus(req.params.id, req.body.status);
    sendResponse(res, 200, { experiment: updatedExperiment });
});

//  Declare winner manually
const declareWinner = asyncHandler(async (req, res) => {
    const experiment = await experimentService.getExperiment(req.params.id);
    await checkOwnership(experiment.websiteId, req.user._id);

    const updatedExperiment = await experimentService.declareWinner(req.params.id, req.body.winningVariation);
    sendResponse(res, 200, { experiment: updatedExperiment }, 'Winner declared successfully');
});

//    Update experiment
const updateExperiment = asyncHandler(async (req, res) => {
    // Check ownership first (need to fetch to know websiteId)
    const existing = await experimentService.getExperiment(req.params.id);
    await checkOwnership(existing.websiteId, req.user._id);

    const experiment = await experimentService.updateExperiment(req.params.id, req.body);
    sendResponse(res, 200, { experiment });
});

//  Delete experiment
const deleteExperiment = asyncHandler(async (req, res) => {
    const existing = await experimentService.getExperiment(req.params.id);
    await checkOwnership(existing.websiteId, req.user._id);

    await experimentService.deleteExperiment(req.params.id);
    sendResponse(res, 200, {}, 'Experiment deleted successfully');
});

module.exports = {
    getExperiments,
    createExperiment,
    getExperiment,
    updateExperiment,
    deleteExperiment,
    updateExperimentStatus,
    declareWinner
};