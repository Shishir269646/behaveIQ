const jwt = require('jsonwebtoken');
const { asyncHandler } = require('../utils/helpers');
const { prisma } = require('../config/database'); // Import prisma client
const { JWT_SECRET } = require('../config/env'); // Import JWT_SECRET from env config

/**
 * ------------------------------------
 * JWT Authentication (Dashboard / Admin)
 * ------------------------------------
 */
const handleJwtAuth = async (req, res, next, token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { // Select fields as needed, excluding sensitive ones like password
                id: true,
                email: true,
                fullName: true,
                role: true,
            }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User from JWT not found'
            });
        }

        req.user = user;
        req.website = await prisma.website.findFirst({ where: { userId: user.id } }); // Assuming user has a single primary website

        return next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

/**
 * ------------------------------------
 * API Key Authentication (SDK / Public APIs)
 * ------------------------------------
 */
const handleApiKeyAuth = async (req, res, next, apiKey) => {
    const website = await prisma.website.findUnique({ where: { apiKey } });

    /**
     * Allow anonymous tracking for SDK endpoints
     */
    if (!website) {
        const isAnonymousAllowed =
            req.originalUrl.startsWith('/api/behavior') ||
            req.originalUrl.startsWith('/api/emotion') ||
            req.originalUrl.startsWith('/api/sdk');

        if (isAnonymousAllowed) {
            req.website = null;
            req.user = null;
            return next();
        }

        return res.status(401).json({
            success: false,
            message: 'Invalid API Key'
        });
    }

    /**
     * Demo Website Handling
     */
    if (website.isDemo) {
        if (website.demoExpiresAt && website.demoExpiresAt < new Date()) {
            return res.status(403).json({
                success: false,
                message: 'Demo period has expired'
            });
        }

        req.website = website;
        req.user = await prisma.user.findFirst({ where: { role: 'guest' } }); // Assuming a 'guest' user exists
        return next();
    }

    /**
     * Normal SaaS Customer
     */
    const user = await prisma.user.findUnique({
        where: { id: website.userId },
        select: { // Select fields as needed, excluding sensitive ones like password
            id: true,
            email: true,
            fullName: true,
            role: true,
        }
    });

    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'User associated with this website not found'
        });
    }

    req.website = website;
    req.user = user;
    return next();
};

/**
 * ------------------------------------
 * Anonymous Access (SDK Tracking Only)
 * ------------------------------------
 */
const handleAnonymousAuth = (req, res, next) => {
    const isSdkTrackingPath =
        req.originalUrl.startsWith('/api/behavior') ||
        req.originalUrl.startsWith('/api/emotion') ||
        req.originalUrl.startsWith('/api/sdk');

    if (isSdkTrackingPath) {
        req.website = null;
        req.user = null;
        return next();
    }

    return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
    });
};

/**
 * ------------------------------------
 * Protect Middleware (Main Entry)
 * ------------------------------------
 */
exports.protect = asyncHandler(async (req, res, next) => {
    // 1️⃣ JWT Auth
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        const token = req.headers.authorization.split(' ')[1];
        return handleJwtAuth(req, res, next, token);
    }

    // 2️⃣ API Key Auth
    const apiKey = req.headers['x-api-key'];
    if (apiKey) {
        return handleApiKeyAuth(req, res, next, apiKey);
    }

    // 3️⃣ Anonymous SDK
    return handleAnonymousAuth(req, res, next);
});

/**
 * ------------------------------------
 * Role-based Authorization
 * ------------------------------------
 */
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user ? req.user.role : 'guest'} is not authorized`
            });
        }
        next();
    };
};