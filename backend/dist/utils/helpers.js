"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.hoursDifference = exports.generateSessionId = exports.generateApiKey = void 0;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generate unique API key
 */
const generateApiKey = () => {
    return 'biq_' + crypto_1.default.randomBytes(32).toString('hex');
};
exports.generateApiKey = generateApiKey;
/**
 * Generate unique session ID
 */
const generateSessionId = () => {
    return crypto_1.default.randomBytes(16).toString('hex');
};
exports.generateSessionId = generateSessionId;
/**
 * Calculate time difference in hours
 */
const hoursDifference = (date1, date2) => {
    const diff = Math.abs(date2.getTime() - date1.getTime());
    return Math.floor(diff / (1000 * 60 * 60));
};
exports.hoursDifference = hoursDifference;
/**
 * Async handler wrapper to eliminate try-catch blocks in controllers
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.asyncHandler = asyncHandler;
