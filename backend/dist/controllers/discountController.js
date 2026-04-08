"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAsUsed = exports.applyDiscount = exports.calculateDiscount = exports.deleteDiscount = exports.updateDiscount = exports.createDiscount = exports.getDiscounts = void 0;
const database_1 = require("../config/database");
const helpers_1 = require("../utils/helpers");
const AppError_1 = __importDefault(require("../utils/AppError"));
const discountService_1 = __importDefault(require("../services/discountService"));
/**
 * Get all active discounts for the current user
 */
exports.getDiscounts = (0, helpers_1.asyncHandler)(async (req, res) => {
    if (!req.user?.id) {
        throw new AppError_1.default('Not authorized', 401);
    }
    const discounts = await database_1.prisma.userDiscount.findMany({
        where: {
            userId: req.user.id,
            status: 'active',
            OR: [
                { expires: { gt: new Date() } },
                { expires: null }
            ]
        }
    });
    res.json({
        success: true,
        count: discounts.length,
        data: discounts
    });
});
/**
 * Create new discount
 */
exports.createDiscount = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { code, type, value, reasons, expiresAt } = req.body;
    if (!req.user?.id) {
        throw new AppError_1.default('Not authorized', 401);
    }
    const discount = await database_1.prisma.userDiscount.create({
        data: {
            userId: req.user.id,
            code,
            amount: value,
            reason: reasons ? (Array.isArray(reasons) ? reasons.join(',') : reasons) : null,
            expires: expiresAt ? new Date(expiresAt) : null,
            status: 'active',
            used: false,
        }
    });
    res.status(201).json({
        success: true,
        data: discount
    });
});
/**
 * Update discount
 */
exports.updateDiscount = (0, helpers_1.asyncHandler)(async (req, res) => {
    const id = req.params.id;
    const { code, value, reasons, expiresAt, status } = req.body;
    if (!req.user?.id) {
        throw new AppError_1.default('Not authorized', 401);
    }
    const updatedData = {};
    if (code !== undefined)
        updatedData.code = code;
    if (value !== undefined)
        updatedData.amount = value;
    if (reasons !== undefined)
        updatedData.reason = Array.isArray(reasons) ? reasons.join(',') : reasons;
    if (expiresAt !== undefined)
        updatedData.expires = expiresAt ? new Date(expiresAt) : null;
    if (status !== undefined)
        updatedData.status = status;
    const discount = await database_1.prisma.userDiscount.update({
        where: { id: id, userId: req.user.id },
        data: updatedData
    });
    res.json({
        success: true,
        data: discount
    });
});
/**
 * Delete discount
 */
exports.deleteDiscount = (0, helpers_1.asyncHandler)(async (req, res) => {
    const id = req.params.id;
    if (!req.user?.id) {
        throw new AppError_1.default('Not authorized', 401);
    }
    await database_1.prisma.userDiscount.delete({
        where: { id: id, userId: req.user.id },
    });
    res.json({
        success: true,
        message: 'Discount deleted successfully'
    });
});
/**
 * Calculate discount based on behavior
 */
exports.calculateDiscount = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { userId, productInfo } = req.body;
    const discount = await discountService_1.default.calculateDiscount(userId, productInfo);
    if (!discount) {
        return res.json({
            success: true,
            data: { hasDiscount: false }
        });
    }
    res.json({
        success: true,
        data: {
            hasDiscount: true,
            ...discount
        }
    });
});
/**
 * Apply discount code
 */
exports.applyDiscount = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { code, userId } = req.body;
    const discount = await database_1.prisma.userDiscount.findFirst({
        where: {
            code,
            userId,
            status: 'active',
            OR: [
                { expires: { gt: new Date() } },
                { expires: null }
            ]
        }
    });
    if (!discount) {
        throw new AppError_1.default('Invalid or expired discount code', 404);
    }
    res.json({
        success: true,
        data: {
            type: discount.type || 'percentage',
            value: discount.amount,
            reasons: discount.reason ? discount.reason.split(',') : []
        }
    });
});
/**
 * Mark discount as used
 */
exports.markAsUsed = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { code, orderId, userId } = req.body;
    const updatedDiscount = await database_1.prisma.userDiscount.updateMany({
        where: {
            code: code,
            userId: userId,
            status: 'active'
        },
        data: {
            status: 'used',
            usedAt: new Date(),
            orderId: orderId,
            used: true
        }
    });
    if (updatedDiscount.count === 0) {
        throw new AppError_1.default('Discount not found or already used', 404);
    }
    res.json({ success: true });
});
