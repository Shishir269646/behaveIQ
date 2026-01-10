// src/models/FraudScore.js
const mongoose = require('mongoose');

const fraudScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  websiteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Website',
    required: true,
    index: true
  },
  sessionId: String,
  score: { type: Number, required: true, min: 0, max: 100 },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  flags: [{
    type: String,
    severity: Number,
    description: String
  }],
  signals: {
    tooFastCheckout: Boolean,
    suspiciousEmail: Boolean,
    vpnDetected: Boolean,
    unusualLocation: Boolean,
    botBehavior: Boolean,
    multipleFailedPayments: Boolean
  },
  experienceAdjustment: {
    requirePhoneVerification: Boolean,
    requireEmailVerification: Boolean,
    disableCOD: Boolean,
    showCaptcha: Boolean,
    manualReview: Boolean,
    limitOrderValue: Number
  },
  timestamp: { type: Date, default: Date.now }
});

fraudScoreSchema.index({ userId: 1, timestamp: -1 });
fraudScoreSchema.index({ riskLevel: 1, timestamp: -1 });

module.exports = mongoose.model('FraudScore', fraudScoreSchema);