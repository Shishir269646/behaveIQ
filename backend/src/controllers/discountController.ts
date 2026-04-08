import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../utils/helpers';
import AppError from '../utils/AppError';
import { AuthenticatedRequest } from '../types';
import discountService from '../services/discountService';

/**
 * Get all active discounts for the current user
 */
export const getDiscounts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('Not authorized', 401);
  }
  
  const discounts = await prisma.userDiscount.findMany({
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
export const createDiscount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { code, type, value, reasons, expiresAt } = req.body;

    if (!req.user?.id) {
      throw new AppError('Not authorized', 401);
    }

    const discount = await prisma.userDiscount.create({
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
export const updateDiscount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const id = req.params.id as string;
    const { code, value, reasons, expiresAt, status } = req.body;

    if (!req.user?.id) {
      throw new AppError('Not authorized', 401);
    }

    const updatedData: any = {};
    if (code !== undefined) updatedData.code = code;
    if (value !== undefined) updatedData.amount = value;
    if (reasons !== undefined) updatedData.reason = Array.isArray(reasons) ? reasons.join(',') : reasons;
    if (expiresAt !== undefined) updatedData.expires = expiresAt ? new Date(expiresAt) : null;
    if (status !== undefined) updatedData.status = status;

    const discount = await prisma.userDiscount.update({
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
export const deleteDiscount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const id = req.params.id as string;

    if (!req.user?.id) {
      throw new AppError('Not authorized', 401);
    }

    await prisma.userDiscount.delete({
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
export const calculateDiscount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId, productInfo } = req.body;

    const discount = await discountService.calculateDiscount(userId, productInfo);

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
export const applyDiscount = asyncHandler(async (req: Request, res: Response) => {
    const { code, userId } = req.body;

    const discount = await prisma.userDiscount.findFirst({
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
      throw new AppError('Invalid or expired discount code', 404);
    }

    res.json({
      success: true,
      data: {
        type: (discount as any).type || 'percentage',
        value: discount.amount,
        reasons: discount.reason ? discount.reason.split(',') : []
      }
    });
});

/**
 * Mark discount as used
 */
export const markAsUsed = asyncHandler(async (req: Request, res: Response) => {
    const { code, orderId, userId } = req.body;

    const updatedDiscount = await prisma.userDiscount.updateMany({
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
        throw new AppError('Discount not found or already used', 404);
    }

    res.json({ success: true });
});
