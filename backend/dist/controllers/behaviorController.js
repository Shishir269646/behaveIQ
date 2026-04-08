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
exports.getBehaviorSummary = exports.trackEvent = void 0;
const helpers_1 = require("../utils/helpers");
const responseHandler_1 = require("../utils/responseHandler");
const AppError_1 = __importDefault(require("../utils/AppError"));
const behaviorService = __importStar(require("../services/behaviorService"));
const database_1 = require("../config/database");
/**
 * Track behavior event
 */
exports.trackEvent = (0, helpers_1.asyncHandler)(async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    const website = await database_1.prisma.website.findUnique({ where: { apiKey } });
    if (!website) {
        throw new AppError_1.default('A valid API key is required.', 403);
    }
    const result = await behaviorService.trackEvent(website, req.body);
    if (result) {
        return (0, responseHandler_1.sendResponse)(res, 200, result);
    }
    (0, responseHandler_1.sendResponse)(res, 200, { success: true });
});
/**
 * Get behavior summary
 */
exports.getBehaviorSummary = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    const summary = await behaviorService.getSummary(sessionId);
    if (!summary) {
        throw new AppError_1.default('Session not found', 404);
    }
    (0, responseHandler_1.sendResponse)(res, 200, summary);
});
