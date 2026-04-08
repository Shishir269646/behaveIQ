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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAbandonmentStats = exports.trackInterventionResponse = exports.predictRisk = void 0;
const helpers_1 = require("../utils/helpers");
const responseHandler_1 = require("../utils/responseHandler");
const abandonmentService = __importStar(require("../services/abandonmentService"));
const websiteService = __importStar(require("../services/websiteService"));
/**
 * Predict abandonment risk
 */
exports.predictRisk = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { userId, sessionId, websiteId } = req.body;
    const result = await abandonmentService.predictAbandonmentRisk(sessionId, websiteId, userId);
    (0, responseHandler_1.sendResponse)(res, 200, result);
});
/**
 * Track intervention response
 */
exports.trackInterventionResponse = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { interventionId, response, outcome } = req.body;
    const result = await abandonmentService.trackInterventionResponse(interventionId, response, outcome);
    (0, responseHandler_1.sendResponse)(res, 200, result);
});
/**
 * Get abandonment statistics
 */
exports.getAbandonmentStats = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { websiteId, timeRange = '7d' } = req.query;
    if (!req.user?.id)
        return res.status(401).json({ success: false, message: 'Not authorized' });
    await websiteService.getWebsiteAndVerify(websiteId, req.user.id);
    const days = parseInt(timeRange) || 7;
    const stats = await abandonmentService.getStats(websiteId, days);
    (0, responseHandler_1.sendResponse)(res, 200, stats);
});
