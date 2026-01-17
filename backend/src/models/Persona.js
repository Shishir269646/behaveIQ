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

    // ===============================
    // ML Clustering Data
    // ===============================
    clusterData: {
        clusterId: Number,

        avgTimeSpent: {
            type: Number,
            default: 0
        },
        avgScrollDepth: {
            type: Number,
            default: 0
        },
        avgClickRate: {
            type: Number,
            default: 0
        },
        avgPageViews: {
            type: Number,
            default: 0
        },

        commonPages: {
            type: [String],
            default: []
        },

        commonDevices: {
            type: [String],
            default: []
        },

        behaviorPattern: {
            exploreMore: { type: Boolean, default: false },
            quickDecision: { type: Boolean, default: false },
            priceConscious: { type: Boolean, default: false },
            featureFocused: { type: Boolean, default: false }
        },

        characteristics: {
            type: [String],
            default: []
        }
    },

    // ===============================
    // Statistics (Derived Data)
    // ===============================
    stats: {
        sessionCount: {
            type: Number,
            default: 0,
            min: 0
        },
        totalConversions: {
            type: Number,
            default: 0,
            min: 0
        },
        conversionRate: {
            type: Number,
            default: 0,
            min: 0
        },
        avgIntentScore: {
            type: Number,
            default: 0,
            min: 0
        },
        lastUpdated: {
            type: Date
        }
    },

    // ===============================
    // Personalization Rules
    // ===============================
    personalizationRules: [{
        selector: {
            type: String,
            required: true
        },
        content: {
            type: String,
            default: ''
        },
        contentType: {
            type: String,
            enum: ['text', 'html', 'image'],
            default: 'text'
        },
        variation: {
            type: String,
            default: ''
        },
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

    // ===============================
    // Status
    // ===============================
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

// ===============================
// Indexes
// ===============================
personaSchema.index({ websiteId: 1, isActive: 1 });

// ===============================
// Methods
// ===============================
personaSchema.methods.updateStats = async function () {
    const Session = mongoose.model('Session');

    const sessions = await Session.find({
        websiteId: this.websiteId,
        personaId: this._id
    }).lean();

    const totalSessions = sessions.length;

    // --- No sessions case (CRITICAL FIX) ---
    if (totalSessions === 0) {
        this.stats.sessionCount = 0;
        this.stats.totalConversions = 0;
        this.stats.conversionRate = 0;
        this.stats.avgIntentScore = 0;
        this.stats.lastUpdated = new Date();
        return this.save();
    }

    const conversions = sessions.filter(s => Boolean(s.converted)).length;

    const totalIntentScore = sessions.reduce((sum, s) => {
        const score = Number(s.intentScore);
        return Number.isFinite(score) ? sum + score : sum;
    }, 0);

    const avgIntentScore = totalIntentScore / totalSessions;

    this.stats.sessionCount = totalSessions;
    this.stats.totalConversions = conversions;
    this.stats.conversionRate = (conversions / totalSessions) * 100;
    this.stats.avgIntentScore = Number.isFinite(avgIntentScore) ? avgIntentScore : 0;
    this.stats.lastUpdated = new Date();

    await this.save();
};

module.exports = mongoose.model('Persona', personaSchema);
