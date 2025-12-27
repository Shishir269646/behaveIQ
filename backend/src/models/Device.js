// src/models/Device.js
const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  fingerprint: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  deviceInfo: {
    type: {
      type: String,
      enum: ['mobile', 'desktop', 'tablet'],
      required: true
    },
    os: String,
    browser: String,
    screenResolution: String,
    userAgent: String
  },
  fpComponents: {
    canvas: String,
    webgl: String,
    audio: String,
    fonts: [String]
  },
  sessions: [{
    sessionId: String,
    timestamp: Date,
    location: {
      ip: String,
      city: String
    }
  }],
  stitchedWith: [{
    fingerprint: String,
    confidence: Number,
    stitchedAt: Date
  }],
  firstSeen: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now }
});

deviceSchema.index({ userId: 1, lastSeen: -1 });

module.exports = mongoose.model('Device', deviceSchema);