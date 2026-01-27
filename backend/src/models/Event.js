const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    websiteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Website',
        required: true,
        index: true
    }, 
    eventType: {
        type: String,
        required: true,
        enum: ['pageview', 'click', 'scroll', 'mouse_move', 'hover', 'form_submit', 'exit', 'custom', 'content_generated', 'cart_action'],
        index: true
    },
    eventData: {
        // Page info
        pageUrl: String,
        pageTitle: String,

        // Click/Hover data
        element: String,
        elementText: String,
        elementId: String,
        elementClass: String,
        x: Number,
        y: Number,

        // Scroll data
        scrollDepth: Number,
        scrollDirection: String,

        // Time data
        timeSpent: Number,

        // Form data
        formId: String,
        formFields: mongoose.Schema.Types.Mixed,

        // Custom event data
        customData: mongoose.Schema.Types.Mixed
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: false
});

// Indexes
eventSchema.index({ websiteId: 1, eventType: 1, timestamp: -1 });
eventSchema.index({ sessionId: 1, timestamp: 1 });

// TTL index - auto-delete events older than 90 days
eventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('Event', eventSchema);
