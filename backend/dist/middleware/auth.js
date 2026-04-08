"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const helpers_1 = require("../utils/helpers");
const database_1 = require("../config/database");
const env_1 = require("../config/env");
/**
 * ------------------------------------
 * JWT Authentication (Dashboard / Admin)
 * ------------------------------------
 */
const handleJwtAuth = async (req, res, next, token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.JWT_SECRET);
        const user = await database_1.prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                companyName: true,
                plan: true,
                settings: true,
                lastLogin: true,
                createdAt: true,
                updatedAt: true
            }
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User from JWT not found'
            });
        }
        req.user = user;
        req.website = await database_1.prisma.website.findFirst({ where: { userId: user.id } });
        return next();
    }
    catch (error) {
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
    const website = await database_1.prisma.website.findUnique({ where: { apiKey } });
    /**
     * Allow anonymous tracking for SDK endpoints
     */
    if (!website) {
        const isAnonymousAllowed = req.originalUrl.startsWith('/api/behavior') ||
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
        req.user = await database_1.prisma.user.findFirst({ where: { email: 'guest@behaveiq.com' } });
        return next();
    }
    /**
     * Normal SaaS Customer
     */
    const user = await database_1.prisma.user.findUnique({
        where: { id: website.userId },
        select: {
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
    const isSdkTrackingPath = req.originalUrl.startsWith('/api/behavior') ||
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
exports.protect = (0, helpers_1.asyncHandler)(async (req, res, next) => {
    // 1️⃣ JWT Auth
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
        const token = req.headers.authorization.split(' ')[1];
        if (token) {
            return handleJwtAuth(req, res, next, token);
        }
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
const authorize = (...roles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user || !roles.includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${user ? user.role : 'guest'} is not authorized`
            });
        }
        next();
    };
};
exports.authorize = authorize;
