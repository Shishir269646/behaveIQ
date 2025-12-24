const mongoose = require('mongoose');
const { jStat } = require('jstat');

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

// ... (rest of the schema definition)

// Calculate winner using statistical tests
experimentSchema.methods.calculateWinner = function () {
    if (this.variations.length < 2) return null;

    const control = this.variations.find(v => v.isControl);
    if (!control) return null; // Cannot calculate without a control

    // Don't bother if control has no data
    if (control.visitors === 0) return null;

    let potentialWinner = null;

    for (const variation of this.variations) {
        if (variation.isControl) continue;

        // Ensure minimum sample size is met for both variations being compared
        if (variation.visitors < this.settings.minSampleSize || control.visitors < this.settings.minSampleSize) {
            continue;
        }

        // Z-test for two population proportions
        // H0: p1 = p2 (conversion rates are equal)
        // H1: p1 != p2 (conversion rates are different)
        const p1 = variation.conversionRate / 100;
        const p2 = control.conversionRate / 100;
        const n1 = variation.visitors;
        const n2 = control.visitors;

        // If conversion rates are identical, skip
        if (p1 <= p2) continue;

        const p_pool = (variation.conversions + control.conversions) / (n1 + n2);
        const se = Math.sqrt(p_pool * (1 - p_pool) * (1/n1 + 1/n2));
        
        if (se === 0) continue;

        const z_score = (p1 - p2) / se;

        // One-tailed p-value, since we only care if the variation is BETTER
        const p_value = 1 - jStat.normal.cdf(z_score, 0, 1);

        // Confidence is the probability we are correct in rejecting the null hypothesis
        const confidence = (1 - p_value) * 100;

        if (confidence >= this.settings.minConfidence) {
            const improvement = control.conversionRate > 0
                ? ((p1 - p2) / p2) * 100
                : 100;

            // This variation is a statistically significant winner
            potentialWinner = {
                winner: variation.name,
                confidence: parseFloat(confidence.toFixed(2)),
                improvement: parseFloat(improvement.toFixed(2))
            };

            // Break after finding the first significant winner (or could be extended to find the best one)
            break;
        }
    }

    return potentialWinner;
};


module.exports = mongoose.model('Experiment', experimentSchema);