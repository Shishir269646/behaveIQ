"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.getMe = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const helpers_1 = require("../utils/helpers");
const responseHandler_1 = require("../utils/responseHandler");
const AppError_1 = __importDefault(require("../utils/AppError"));
const env_1 = require("../config/env");
/**
 * Helper to generate JWT token
 */
const getSignedJwtToken = (id, role) => {
    return jsonwebtoken_1.default.sign({ id, role }, env_1.JWT_SECRET, {
        expiresIn: env_1.JWT_EXPIRE
    });
};
/**
 * Register user
 */
exports.register = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { email, password, fullName, companyName } = req.body;
    // Check if user exists
    const userExists = await database_1.prisma.user.findUnique({ where: { email } });
    if (userExists) {
        throw new AppError_1.default('User already exists with this email', 400);
    }
    // Hash password
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    // Create user
    const user = await database_1.prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            fullName,
            companyName
        },
        select: {
            id: true,
            email: true,
            fullName: true,
            companyName: true,
            plan: true,
            role: true,
            settings: true,
        }
    });
    // Generate token
    const token = getSignedJwtToken(user.id, user.role);
    (0, responseHandler_1.sendResponse)(res, 201, {
        user,
        token
    });
});
/**
 * Login user
 */
exports.login = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    // Find user
    const user = await database_1.prisma.user.findUnique({
        where: { email },
        include: { settings: true }
    });
    if (!user) {
        throw new AppError_1.default('Invalid credentials', 401);
    }
    // Check password
    const isMatch = await bcryptjs_1.default.compare(password, user.password);
    if (!isMatch) {
        throw new AppError_1.default('Invalid credentials', 401);
    }
    // Update last login
    await database_1.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
    });
    // Generate token
    const token = getSignedJwtToken(user.id, user.role);
    (0, responseHandler_1.sendResponse)(res, 200, {
        user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            companyName: user.companyName,
            plan: user.plan,
            role: user.role,
            settings: user.settings
        },
        token
    });
});
/**
 * Get current user
 */
exports.getMe = (0, helpers_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new AppError_1.default('Not authorized', 401);
    }
    const user = await database_1.prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true,
            email: true,
            fullName: true,
            companyName: true,
            plan: true,
            role: true,
            settings: true,
        }
    });
    if (!user) {
        throw new AppError_1.default('User not found', 404);
    }
    (0, responseHandler_1.sendResponse)(res, 200, { user });
});
/**
 * Logout
 */
exports.logout = (0, helpers_1.asyncHandler)(async (req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    (0, responseHandler_1.sendResponse)(res, 200, {}, 'Logged out successfully');
});
