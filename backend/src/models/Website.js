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
        notificationEmail: String,
        emotionInterventions: [{ // New field for emotion-based interventions
            emotion: {
                type: String,
                enum: ['frustrated', 'confused', 'excited', 'neutral', 'considering'],
                required: true
            },
            action: {
                type: String,
                enum: ['show_help_chat', 'show_guide', 'show_social_proof', 'show_comparison', 'none'],
                required: true
            },
            message: String,
            data: mongoose.Schema.Types.Mixed,
            status: {
                type: String,
                enum: ['active', 'inactive'],
                default: 'active'
            },
            effectiveness: { // Track how well this intervention performs
                type: Number,
                default: 0
            },
            lastModified: {
                type: Date,
                default: Date.now
            }
        }],
        fraudDetectionSettings: { // New field for fraud detection settings
            sensitivity: {
                type: String,
                enum: ['low', 'medium', 'high'],
                default: 'medium'
            },
            riskBasedActions: {
                requirePhoneVerification: { type: Boolean, default: false },
                requireEmailVerification: { type: Boolean, default: false },
                disableCOD: { type: Boolean, default: false },
                showCaptcha: { type: Boolean, default: false },
                manualReview: { type: Boolean, default: false },
                limitOrderValue: { type: Number, default: null } // Max order value allowed if risk is high
            }
        }
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
