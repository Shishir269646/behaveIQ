// src/models/Discount.js
const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed_amount'],
    required: true
  },
  value: { type: Number, required: true },
  reasons: [{
    factor: String, // loyalty, first_time, cart_abandon, etc.
    value: Number
  }],
  applicableTo: {
    products: [String],
    categories: [String],
    minAmount: Number
  },
  status: {
    type: String,
    enum: ['active', 'used', 'expired'],
    default: 'active'
  },
  usedAt: Date,
  orderId: String,
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
});

discountSchema.index({ code: 1 });
discountSchema.index({ userId: 1, status: 1 });
discountSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Discount', discountSchema);