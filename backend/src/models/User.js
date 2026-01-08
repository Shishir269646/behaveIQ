const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const deviceSubSchema = new mongoose.Schema({
  fingerprint: String,
  type: String, // mobile, desktop, tablet
  firstSeen: Date,
  lastSeen: Date
}, { _id: false }); // No _id for subdocuments if not needed

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  fullName: {
    type: String,
    required: [true, 'Please add a name']
  },
  companyName: {
    type: String
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'premium', 'enterprise'],
    default: 'free'
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  lastLogin: {
    type: Date
  },
  fingerprint: {
    type: String,
    index: true,
    sparse: true
  },
  devices: [deviceSubSchema], // Use the explicitly defined subschema
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

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Match user entered password to hashed password in database
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Indexes for performance
userSchema.index({ 'persona.primary': 1 });
userSchema.index({ 'intentScore.current': -1 });
userSchema.index({ lastActive: -1 });

module.exports = mongoose.model('User', userSchema);