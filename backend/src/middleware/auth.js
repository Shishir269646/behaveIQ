const jwt = require('jsonwebtoken');
const { asyncHandler } = require('../utils/helpers');
const User = require('../models/User');
const Website = require('../models/Website');

const handleJwtAuth = async (req, res, next, token) => {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
        return res.status(401).json({ success: false, message: 'User from JWT not found' });
    }

    req.user = user;
    req.website = await Website.findOne({ userId: user._id });
    next();
};

const handleApiKeyAuth = async (req, res, next, apiKey) => {
    if (apiKey === process.env.DEMO_API_KEY) {
        req.website = await Website.findOne({ apiKey: process.env.DEMO_API_KEY });
        req.user = await User.findOne({ email: 'guest@behaveiq.com' });

        if (!req.website || !req.user) {
            return res.status(500).json({ success: false, message: 'Internal server error: Demo or Guest user not set up correctly.' });
        }
        return next();
    }

    const website = await Website.findOne({ apiKey });
    if (!website) {
         // Allow certain SDK endpoints to proceed anonymously if the API key is invalid
        const isAnonymousAllowed = req.originalUrl.startsWith('/api/behavior') || req.originalUrl.startsWith('/api/sdk');
        if (isAnonymousAllowed) {
            req.website = null;
            req.user = null;
            return next();
        }
        return res.status(401).json({ success: false, message: 'Forbidden: Invalid API Key.' });
    }

    req.website = website;
    req.user = await User.findById(website.userId);
    next();
};

const handleAnonymousAuth = (req, res, next) => {
    const isSdkTrackingPath = req.originalUrl.startsWith('/api/behavior') ||
                              req.originalUrl.startsWith('/api/emotion') ||
                              req.originalUrl.startsWith('/api/sdk');

    if (isSdkTrackingPath) {
        req.website = null;
        req.user = null;
        return next();
    }
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
};


exports.protect = asyncHandler(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        return handleJwtAuth(req, res, next, token);
    }

    const apiKey = req.headers['x-api-key'];
    if (apiKey) {
        return handleApiKeyAuth(req, res, next, apiKey);
    }

    return handleAnonymousAuth(req, res, next);
});

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user ? req.user.role : 'guest'} is not authorized to access this route`
            });
        }
        next();
    };
};
