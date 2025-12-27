// src/controllers/discountController.js
const discountService = require('../services/discountService');
const Discount = require('../models/Discount');

exports.calculateDiscount = async (req, res) => {
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

exports.applyDiscount = async (req, res) => {
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

exports.markAsUsed = async (req, res) => {
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