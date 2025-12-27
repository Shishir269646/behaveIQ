const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fingerprint: { type: String, required: true },
  sessionId: { type: String, required: true, unique: true },
  device: {
    type: String,
    fingerprint: String,
    userAgent: String,
    screenResolution: String,
    language: String,
    timezone: String
  },
  location: {
    ip: String,
    country: String,
    city: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  behavior: {
    pageViews: [{ 
      url: String, 
      timestamp: Date, 
      timeSpent: Number,
      scrollDepth: Number 
    }],
    clicks: [{ 
      element: String, 
      timestamp: Date,
      x: Number,
      y: Number
    }],
    mouseMovements: [{
      timestamp: Date,
      speed: Number,
      variance: Number
    }],
    cartActions: [{
      action: String, // add, remove, view
      productId: String,
      timestamp: Date
    }]
  },
  emotion: {
    current: String,
    changes: [{
      from: String,
      to: String,
      timestamp: Date,
      trigger: String
    }]
  },
  intentScore: {
    initial: Number,
    final: Number,
    peak: Number,
    changes: [{ score: Number, timestamp: Date }]
  },
  interventions: [{
    type: String,
    timestamp: Date,
    response: String, // clicked, ignored, dismissed
    effectiveness: Number
  }],
  outcome: {
    type: String,
    enum: ['purchase', 'cart_abandon', 'bounce', 'ongoing'],
    default: 'ongoing'
  },
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  duration: Number
}, {
  timestamps: true
});

sessionSchema.index({ sessionId: 1 });
sessionSchema.index({ userId: 1, startTime: -1 });

module.exports = mongoose.model('Session', sessionSchema);