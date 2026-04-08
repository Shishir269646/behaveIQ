"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResponse = void 0;
/**
 * Sends a standard API response.
 */
const sendResponse = (res, statusCode, data = null, message = null) => {
    const response = {
        success: statusCode >= 200 && statusCode < 300,
    };
    if (message) {
        response.message = message;
    }
    if (data !== undefined && data !== null) {
        response.data = data;
    }
    res.status(statusCode).json(response);
};
exports.sendResponse = sendResponse;
