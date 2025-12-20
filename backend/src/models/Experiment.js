const mongoose = require('mongoose');

const experimentSchema = new mongoose.Schema({
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
    description: String,

    status: {
        type: String,
        enum: ['draft', 'active', 'paused', 'completed'],
        default: 'draft',
        index: true
    },

    // Variations
    variations: [{
        name: {
            type: String,
            required: true
        },
        isControl: {
            type: Boolean,
            default: false
        },
        selector: String,
        content: String,
        contentType: {
            type: String,
            enum: ['text', 'html', 'css'],
            default: 'text'
        },
        trafficPercentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 50
        },
        visitors: {
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
    }],

    // Results
    results: {
        winner: String,
        confidence: Number,
        improvement: Number,
        declaredAt: Date
    },

    // Settings
    settings: {
        targetUrl: String,
        conversionGoal: String,
        minSampleSize: {
            type: Number,
            default: 100
        },
        minConfidence: {
            type: Number,
            default: 95
        },
        maxDuration: {
            type: Number,
            default: 30
        }
    },

    startDate: Date,
    endDate: Date
}, {
    timestamps: true
});

// Index
experimentSchema.index({ websiteId: 1, status: 1 });

// Calculate winner
experimentSchema.methods.calculateWinner = function () {
    if (this.variations.length < 2) return null;

    const sorted = [...this.variations].sort((a, b) =>
        b.conversionRate - a.conversionRate
    );

    const winner = sorted[0];
    const control = this.variations.find(v => v.isControl) || sorted[1];

    // Simple confidence calculation (in production, use proper statistical test)
    const improvement = ((winner.conversionRate - control.conversionRate) / control.conversionRate) * 100;

    // Simplified confidence (needs proper Chi-square or Z-test)
    const confidence = winner.visitors > this.settings.minSampleSize ? 95 : 80;

    return {
        winner: winner.name,
        confidence,
        improvement: parseFloat(improvement.toFixed(2))
    };
};

module.exports = mongoose.model('Experiment', experimentSchema);