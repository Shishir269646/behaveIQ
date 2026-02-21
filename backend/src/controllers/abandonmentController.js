const { asyncHandler } = require('../utils/helpers');
const { sendResponse } = require('../utils/responseHandler');
const abandonmentService = require('../services/abandonmentService');
const websiteService = require('../services/websiteService');

const predictRisk = asyncHandler(async (req, res) => {
    const { userId, sessionId, websiteId } = req.body;
    const result = await abandonmentService.predictAbandonmentRisk(sessionId, websiteId, userId);
    sendResponse(res, 200, result);
});

const trackInterventionResponse = asyncHandler(async (req, res) => {
    const { interventionId, response, outcome } = req.body;
    const result = await abandonmentService.trackInterventionResponse(interventionId, response, outcome);
    sendResponse(res, 200, result);
});

const getAbandonmentStats = asyncHandler(async (req, res) => {
    const { websiteId, timeRange = '7d' } = req.query;
    await websiteService.getWebsiteAndVerify(websiteId, req.user._id);

    const days = parseInt(timeRange) || 7;
    const stats = await abandonmentService.getStats(websiteId, days);

    sendResponse(res, 200, stats);
});

module.exports = {
  predictRisk,
  trackInterventionResponse,
  getAbandonmentStats
};