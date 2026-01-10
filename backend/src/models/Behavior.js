// src/models/Behavior.js
const mongoose = require('mongoose');

const behaviorSchema = new mongoose.Schema({
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
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  eventType: {
    type: String,
    required: true,
    enum: ['pageview', 'click', 'scroll', 'mouse_move', 'cart_action', 'form_interaction', 'exit_intent']
  },
  eventData: mongoose.Schema.Types.Mixed,
  emotion: String,
  intentScore: Number,
  timestamp: { type: Date, default: Date.now, index: true }
});

// TTL index - auto-delete after 90 days
behaviorSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('Behavior', behaviorSchema);