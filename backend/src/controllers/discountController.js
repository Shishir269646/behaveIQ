const discountService = require('../services/discountService');
const { prisma } = require('../config/database'); // Import prisma client
const { asyncHandler } = require('../utils/helpers');
const AppError = require('../utils/AppError');

//  Get all active discounts
const getDiscounts = asyncHandler(async (req, res) => {
  console.log('--- getDiscounts called ---');
  console.log(`userId: ${req.user.id}`); // Use req.user.id
  
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

//   Create new discount
const createDiscount = asyncHandler(async (req, res) => {
    const { websiteId, code, type, value, reasons, applicableTo, expiresAt } = req.body;

    // Ensure that websiteId is provided if it's required for a discount
    // This part of the schema is not directly linked in UserDiscount.
    // Assuming websiteId is purely informational or needs a separate model/relation if it refers to the Website model.
    // For now, it's not a direct field in UserDiscount, so will omit or adjust if schema needs it.
    // The Mongoose model only included it in the `Discount` model directly.
    // For now, I'll pass userId to the service and let it handle relations to website if any.

    const discount = await prisma.userDiscount.create({
        data: {
            userId: req.user.id, // Assuming userId from protected route
            // websiteId is not directly on UserDiscount. If needed, a separate relation/field on UserDiscount.
            // For now, removed websiteId from `data` here based on Prisma schema.
            code,
            type,
            amount: value, // In Prisma, field is 'amount' not 'value'
            reason: reasons ? reasons.join(',') : null, // Mongoose had [String], Prisma has String or String[]
            // applicableTo: applicableTo, // If this needs to be stored, it needs a field in Prisma
            expires: expiresAt ? new Date(expiresAt) : null,
            status: 'active', // Default status
            used: false,
        }
    });

    res.status(201).json({
        success: true,
        data: discount
    });
});

//   Update discount
const updateDiscount = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { code, type, value, reasons, applicableTo, expiresAt, status } = req.body;

    const updatedData = {
        code,
        type,
        amount: value,
        reason: reasons ? reasons.join(',') : null,
        expires: expiresAt ? new Date(expiresAt) : null,
        status,
        // applicableTo: applicableTo // If needs to be updated, needs field
    };

    const discount = await prisma.userDiscount.update({
        where: { id: id, userId: req.user.id }, // Ensure user owns the discount
        data: updatedData
    });

    if (!discount) {
        throw new AppError('Discount not found', 404); // Prisma update throws if not found by unique where
    }

    res.json({
        success: true,
        data: discount
    });
});

//   Delete discount
const deleteDiscount = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const discount = await prisma.userDiscount.delete({
        where: { id: id, userId: req.user.id }, // Ensure user owns the discount
    });

    if (!discount) {
        throw new AppError('Discount not found', 404); // Prisma delete throws if not found
    }

    res.json({
        success: true,
        message: 'Discount deleted successfully'
    });
});

const calculateDiscount = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Discount calculation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const applyDiscount = async (req, res) => {
  try {
    const { code, userId } = req.body;

    const discount = await prisma.userDiscount.findFirst({
      where: {
        code,
        userId,
        status: 'active',
        expires: { gt: new Date() }
      }
    });

    if (!discount) {
      throw new AppError('Invalid or expired discount code', 404);
    }

    res.json({
      success: true,
      data: {
        type: discount.type,
        value: discount.amount, // Prisma field is 'amount'
        reasons: discount.reason ? discount.reason.split(',') : [] // Convert back to array if stored as string
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const markAsUsed = async (req, res) => {
  try {
    const { code, orderId } = req.body;

    const updatedDiscount = await prisma.userDiscount.updateMany({
        where: { code: code }, // Find by code, assuming code is unique for active discounts or we target a specific user's discount
        data: {
            status: 'used',
            usedAt: new Date(),
            orderId: orderId
        }
    });

    if (updatedDiscount.count === 0) {
        throw new AppError('Discount not found or already used', 404);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};


module.exports = {
  getDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  calculateDiscount,
  applyDiscount,
  markAsUsed
};