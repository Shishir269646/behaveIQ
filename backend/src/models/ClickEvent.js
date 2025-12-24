const mongoose = require('mongoose');

const clickEventSchema = new mongoose.Schema({
    websiteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Website',
        required: true,
        index: true
    },
    pageUrl: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    x: {
        type: Number,
        required: true
    },
    y: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        expires: '30d' // Automatically delete documents after 30 days
    }
});

// Compound index for efficient querying
clickEventSchema.index({ websiteId: 1, pageUrl: 1 });

module.exports = mongoose.model('ClickEvent', clickEventSchema);
