const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    websiteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Website',
        required: true,
        index: true
    },
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    fingerprint: {
        type: String,
        index: true
    },
    userAgent: String,
    ipAddress: String,

    // Page Info
    landingPage: String,
    referrer: String,
    exitPage: String,

    // Persona & Intent
    personaType: {
        type: String,
        default: null,
        index: true
    },
    personaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Persona',
        default: null
    },
    intentScore: {
        type: Number,
        min: 0,
        max: 1,
        default: 0,
        index: true
    },

    // Session Metrics
    startTime: {
        type: Date,
        default: Date.now,
        index: true
    },
    endTime: Date,
    lastActivityTime: {
        type: Date,
        default: Date.now
    },
    totalTimeSpent: {
        type: Number,
        default: 0
    },
    pageViews: {
        type: Number,
        default: 1
    },

    // Behavior Tracking
    totalClicks: {
        type: Number,
        default: 0
    },
    avgScrollDepth: {
        type: Number,
        default: 0
    },
    maxScrollDepth: {
        type: Number,
        default: 0
    },
    pagesVisited: [{
        type: String
    }],

    // Conversion
    converted: {
        type: Boolean,
        default: false
    },
    conversionValue: Number,
    conversionGoal: String,

    // Device & Location
    device: {
        type: {
            type: String,
            enum: ['desktop', 'mobile', 'tablet'],
            default: 'desktop'
        },
        browser: String,
        os: String
    },
    location: {
        country: String,
        city: String,
        region: String
    },

    // Experiment
    experimentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Experiment'
    },
    experimentVariation: String,

    // Personalization Applied
    personalizationApplied: {
        type: Boolean,
        default: false
    },
    personalizationRules: [{
        ruleId: String,
        selector: String,
        appliedAt: Date
    }]
}, {
    timestamps: true
});

// Indexes for performance
sessionSchema.index({ websiteId: 1, createdAt: -1 });
sessionSchema.index({ personaType: 1, intentScore: -1 });
sessionSchema.index({ fingerprint: 1, websiteId: 1 });

// Virtual for session duration
sessionSchema.virtual('duration').get(function () {
    if (this.endTime) {
        return Math.floor((this.endTime - this.startTime) / 1000);
    }
    if (this.lastActivityTime) {
        return Math.floor((this.lastActivityTime - this.startTime) / 1000);
    }
    return Math.floor((Date.now() - this.startTime) / 1000);
});

// Mark session as ended if no activity for 30 minutes
sessionSchema.methods.checkTimeout = function () {
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;

    if (!this.endTime && (now - this.lastActivityTime) > thirtyMinutes) {
        this.endTime = this.lastActivityTime;
        return true;
    }
    return false;
};

module.exports = mongoose.model('Session', sessionSchema);