// src/models/Intervention.js
const mongoose = require('mongoose');

const interventionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['cart_abandon_prevention', 'emotion_based', 'discount_offer', 'help_chat', 'social_proof']
  },
  trigger: {
    reason: String,
    score: Number, // risk score or intent score
    emotion: String
  },
  content: {
    message: String,
    action: String,
    data: mongoose.Schema.Types.Mixed
  },
  response: {
    status: {
      type: String,
      enum: ['shown', 'clicked', 'ignored', 'dismissed'],
      default: 'shown'
    },
    timestamp: Date,
    effectiveness: Number // 0-1 score
  },
  outcome: {
    prevented: Boolean,
    converted: Boolean,
    revenue: Number
  },
  timestamp: { type: Date, default: Date.now }
});

interventionSchema.index({ userId: 1, timestamp: -1 });
interventionSchema.index({ type: 1, 'response.status': 1 });

module.exports = mongoose.model('Intervention', interventionSchema);