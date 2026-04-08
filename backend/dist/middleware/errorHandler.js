"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const AppError_1 = __importDefault(require("../utils/AppError"));
const env_1 = require("../config/env");
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    // Log to console for dev
    console.error('Error:', err);
    // Handle Prisma errors
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') { // Unique constraint violation
            const field = err.meta?.target?.join(', ') || 'field';
            const message = `Duplicate value for ${field}. Please use another value.`;
            error = new AppError_1.default(message, 400);
        }
        else if (err.code === 'P2025') { // Record not found
            const message = err.meta?.cause || 'Resource not found.';
            error = new AppError_1.default(message, 404);
        }
    }
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token. Please log in again!';
        error = new AppError_1.default(message, 401);
    }
    if (err.name === 'TokenExpiredError') {
        const message = 'Your token has expired! Please log in again.';
        error = new AppError_1.default(message, 401);
    }
    // Handle express-validator errors (array format)
    if (err.array && typeof err.array === 'function') {
        const message = err.array().map((e) => e.msg).join(', ');
        error = new AppError_1.default(message, 400);
    }
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        error: error.message || 'Server Error',
        stack: env_1.NODE_ENV === 'development' ? err.stack : undefined
    });
};
exports.default = errorHandler;
