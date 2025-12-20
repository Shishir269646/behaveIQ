const mongoose = require('mongoose');
const { generateApiKey } = require('../utils/helpers');

const websiteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Website name is required'],
        trim: true
    },
    domain: {
        type: String,
        required: [true, 'Domain is required'],
        trim: true
    },
    apiKey: {
        type: String,
        unique: true,
        default: generateApiKey,
        index: true
    },
    industry: {
        type: String,
        default: 'general'
    },
    status: {
        type: String,
        enum: ['learning', 'active', 'paused'],
        default: 'learning'
    },
    settings: {
        learningPeriodHours: {
            type: Number,
            default: 48
        },
        autoPersonalization: {
            type: Boolean,
            default: false
        },
        experimentMode: {
            type: Boolean,
            default: false
        },
        notificationEmail: String
    },
    learningStartedAt: {
        type: Date,
        default: Date.now
    },
    activatedAt: Date,

    // Stats
    stats: {
        totalSessions: {
            type: Number,
            default: 0
        },
        totalEvents: {
            type: Number,
            default: 0
        },
        totalPersonas: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Index for performance
websiteSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Website', websiteSchema);
