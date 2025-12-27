// src/models/User.js
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

// ================================================================

// src/models/Session.js
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

// ================================================================

// src/models/Behavior.js
const mongoose = require('mongoose');

const behaviorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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

// ================================================================

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

// ================================================================

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

// ================================================================

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

// ================================================================

// src/models/FraudScore.js
const mongoose = require('mongoose');

const fraudScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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