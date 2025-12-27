const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fingerprint: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  devices: [{
    fingerprint: String,
    type: String, // mobile, desktop, tablet
    firstSeen: Date,
    lastSeen: Date
  }],
  persona: {
    primary: {
      type: String,
      enum: ['budget_buyer', 'feature_explorer', 'careful_researcher', 'impulse_buyer', 'casual_visitor'],
      default: 'casual_visitor'
    },
    secondary: [String],
    confidence: { type: Number, default: 0 },
    lastUpdated: Date
  },
  emotionalProfile: {
    dominantEmotion: {
      type: String,
      enum: ['frustrated', 'confused', 'excited', 'neutral', 'considering']
    },
    history: [{
      emotion: String,
      timestamp: Date,
      page: String
    }]
  },
  intentScore: {
    current: { type: Number, default: 0, min: 0, max: 100 },
    history: [{
      score: Number,
      timestamp: Date,
      factors: mongoose.Schema.Types.Mixed
    }]
  },
  fraudScore: {
    current: { type: Number, default: 0, min: 0, max: 100 },
    flags: [String],
    lastChecked: Date
  },
  discounts: [{
    amount: Number,
    reason: String,
    code: String,
    expires: Date,
    used: { type: Boolean, default: false }
  }],
  behavior: {
    totalSessions: { type: Number, default: 0 },
    totalPageViews: { type: Number, default: 0 },
    totalTimeSpent: { type: Number, default: 0 },
    cartAbandons: { type: Number, default: 0 },
    purchases: { type: Number, default: 0 },
    avgSessionDuration: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for performance
userSchema.index({ 'persona.primary': 1 });
userSchema.index({ 'intentScore.current': -1 });
userSchema.index({ lastActive: -1 });

module.exports = mongoose.model('User', userSchema);