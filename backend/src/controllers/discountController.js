const discountService = require('../services/discountService');
const Discount = require('../models/Discount');
const { asyncHandler } = require('../utils/helpers');

//  Get all active discounts

const getDiscounts = asyncHandler(async (req, res) => {
  console.log('--- getDiscounts called ---');
  console.log(`userId: ${req.user._id}`);
  const discounts = await Discount.find({
    userId: req.user._id,
    status: 'active',
    $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }]
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

    const discount = await Discount.create({
        userId: req.user._id, // Assuming userId from protected route
        websiteId,
        code,
        type,
        value,
        reasons,
        applicableTo,
        expiresAt
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

    const discount = await Discount.findOneAndUpdate(
        { _id: id, userId: req.user._id }, // Ensure user owns the discount
        { code, type, value, reasons, applicableTo, expiresAt, status },
        { new: true, runValidators: true }
    );

    if (!discount) {
        return res.status(404).json({ success: false, message: 'Discount not found' });
    }

    res.json({
        success: true,
        data: discount
    });
});

//   Delete discount

const deleteDiscount = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const discount = await Discount.findOneAndDelete({ _id: id, userId: req.user._id }); // Ensure user owns the discount

    if (!discount) {
        return res.status(404).json({ success: false, message: 'Discount not found' });
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

    const discount = await Discount.findOne({
      code,
      userId,
      status: 'active',
      expiresAt: { $gt: new Date() }
    });

    if (!discount) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired discount code'
      });
    }

    res.json({
      success: true,
      data: {
        type: discount.type,
        value: discount.value,
        reasons: discount.reasons
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

    await Discount.findOneAndUpdate(
      { code },
      {
        status: 'used',
        usedAt: new Date(),
        orderId
      }
    );

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