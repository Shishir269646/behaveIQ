const { asyncHandler } = require('../utils/helpers');
const { sendResponse } = require('../utils/responseHandler');
const AppError = require('../utils/AppError');
const behaviorService = require('../services/behaviorService');
const { prisma } = require('../config/database');

const trackEvent = asyncHandler(async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    const website = await prisma.website.findUnique({ where: { apiKey } });

    if (!website) {
        throw new AppError('A valid API key is required.', 403);
    }

    const result = await behaviorService.trackEvent(website, req.body);

    if (result) {
        return sendResponse(res, 200, result);
    }

    sendResponse(res, 200, { success: true });
});

const getBehaviorSummary = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const summary = await behaviorService.getSummary(sessionId);

    if (!summary) {
        throw new AppError('Session not found', 404);
    }

    sendResponse(res, 200, summary);
});

module.exports = {
    trackEvent,
    getBehaviorSummary
};