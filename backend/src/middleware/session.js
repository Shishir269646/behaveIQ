const Session = require('../models/Session');
const Website = require('../models/Website'); // Import Website model
const { v4: uuidv4 } = require('uuid');
const { asyncHandler } = require('../utils/helpers');

const createSession = asyncHandler(async (req, res, next) => {
    const { fingerprint, deviceInfo, fpComponents, location } = req.body;
    const apiKey = req.headers['x-api-key']; // Get API key from header

    if (!apiKey) {
        return res.status(400).json({
            success: false,
            error: 'API Key is missing.'
        });
    }

    const website = await Website.findOne({ apiKey });
    if (!website) {
        return res.status(401).json({
            success: false,
            error: 'Invalid API Key.'
        });
    }

    // Now req.website is available for subsequent middleware/controllers
    req.website = website;

    let session = await Session.findOne({ fingerprint: fingerprint, websiteId: website._id }).sort({ createdAt: -1 });

    if (!session) {
        const sessionId = uuidv4();

        session = await Session.create({
            userId: null,
            websiteId: website._id,
            fingerprint,
            sessionId,
            device: deviceInfo,
            location,
            startTime: new Date()
        });

        res.cookie('biq_fp', fingerprint, {
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            httpOnly: true
        });
    }

    req.session = session;
    next();
});

module.exports = {
    createSession
};