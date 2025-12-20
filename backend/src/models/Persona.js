const mongoose = require('mongoose');

const personaSchema = new mongoose.Schema({
    websiteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Website',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },

    // Clustering data from ML
    clusterData: {
        clusterId: Number,
        avgTimeSpent: Number,
        avgScrollDepth: Number,
        avgClickRate: Number,
        avgPageViews: Number,
        commonPages: [String],
        commonDevices: [String],
        behaviorPattern: {
            exploreMore: Boolean,
            quickDecision: Boolean,
            priceConscious: Boolean,
            featureFocused: Boolean
        },
        characteristics: [String]
    },

    // Statistics
    stats: {
        sessionCount: {
            type: Number,
            default: 0
        },
        totalConversions: {
            type: Number,
            default: 0
        },
        conversionRate: {
            type: Number,
            default: 0
        },
        avgIntentScore: {
            type: Number,
            default: 0
        },
        lastUpdated: Date
    },

    // Personalization Rules
    personalizationRules: [{
        selector: {
            type: String,
            required: true
        },
        content: String,
        contentType: {
            type: String,
            enum: ['text', 'html', 'image'],
            default: 'text'
        },
        variation: String,
        priority: {
            type: Number,
            default: 1
        },
        isActive: {
            type: Boolean,
            default: true
        },
        performance: {
            impressions: {
                type: Number,
                default: 0
            },
            conversions: {
                type: Number,
                default: 0
            },
            conversionRate: {
                type: Number,
                default: 0
            }
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Status
    isActive: {
        type: Boolean,
        default: true
    },
    isAutoDiscovered: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index
personaSchema.index({ websiteId: 1, isActive: 1 });

// Update stats method
personaSchema.methods.updateStats = async function () {
    const Session = mongoose.model('Session');

    const sessions = await Session.find({
        websiteId: this.websiteId,
        personaId: this._id
    });

    if (sessions.length > 0) {
        const totalSessions = sessions.length;
        const conversions = sessions.filter(s => s.converted).length;
        const totalIntentScore = sessions.reduce((sum, s) => sum + s.intentScore, 0);

        this.stats.sessionCount = totalSessions;
        this.stats.totalConversions = conversions;
        this.stats.conversionRate = (conversions / totalSessions) * 100;
        this.stats.avgIntentScore = totalIntentScore / totalSessions;
        this.stats.lastUpdated = new Date();
    }

    await this.save();
};

module.exports = mongoose.model('Persona', personaSchema);
