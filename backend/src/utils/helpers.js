const crypto = require('crypto');

// Generate unique API key
exports.generateApiKey = () => {
    return 'biq_' + crypto.randomBytes(32).toString('hex');
};

// Generate unique session ID
exports.generateSessionId = () => {
    return crypto.randomBytes(16).toString('hex');
};

// Calculate time difference in hours
exports.hoursDifference = (date1, date2) => {
    const diff = Math.abs(date2 - date1);
    return Math.floor(diff / (1000 * 60 * 60));
};

// Format response
exports.sendResponse = (res, statusCode, data, message = '') => {
    res.status(statusCode).json({
        success: statusCode < 400,
        message,
        data
    });
};

// Async handler wrapper
exports.asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};