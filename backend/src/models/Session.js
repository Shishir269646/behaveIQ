const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Changed from true to false
    index: true
  },
  websiteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Website',
    required: true,
    index: true
  },
  personaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Persona',
    index: true
  },
  fingerprint: { type: String, required: true },
  sessionId: { type: String, required: true, unique: true },
  device: { // Now correctly defined as an object
    type: { // This is the device type (e.g., 'desktop', 'mobile', 'tablet')
      type: String,
      enum: ['mobile', 'desktop', 'tablet', 'unknown'],
      default: 'unknown'
    },
    os: String,
    browser: String,
    userAgent: String
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
    clicks: [{ // Now explicitly define the structure for clicks
      _id: false, // Prevent Mongoose from adding a default _id for click subdocuments
      element: String,
      elementId: String, // Changed from 'id' to 'elementId' to match SDK
      class: String, // Also capture 'class' from eventData
      x: Number,
      y: Number,
      timestamp: Date
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