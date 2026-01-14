// src/controllers/fraudController.js
const FraudScore = require('../models/FraudScore');
const User = require('../models/User');
const { asyncHandler } = require('../utils/helpers'); // Assuming asyncHandler is available

// @desc    Get all fraud events for the current website
// @route   GET /api/fraud
const getFraudEvents = asyncHandler(async (req, res) => {

    const websiteapiKey = req.headers['x-api-key'];
    const website = await Website.findOne({ apiKey: websiteapiKey });
    const websiteID = website._id;


    if (!req.website) {
        return res.status(403).json({
            success: false,
            error: 'Forbidden: A valid API key linked to a registered website is required.'
        });
    }

    const { userId, riskLevel } = req.query;
    const filter = { websiteId: websiteID }; // Filter by websiteId
    if (userId) filter.userId = userId;
    if (riskLevel) filter.riskLevel = riskLevel;

    const fraudEvents = await FraudScore.find(filter).sort('-timestamp');

    res.json({
        success: true,
        count: fraudEvents.length,
        data: fraudEvents
    });
});

const checkFraud = async (req, res) => {
    try {
        if (!req.website) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden: A valid API key linked to a registered website is required.'
            });
        }

        const { userId, sessionData } = req.body;
        const fraudSettings = req.website.settings.fraudDetectionSettings;

        let riskScore = 0;
        const flags = [];
        const signals = {};

        // Define base risk values and adjust based on sensitivity
        let baseRisk = {
            tooFastCheckout: 20,
            suspiciousEmail: 15,
            botBehavior: 25,
            multipleFailedPayments: 20
        };

        if (fraudSettings?.sensitivity === 'low') {
            for (const key in baseRisk) baseRisk[key] *= 0.75;
        } else if (fraudSettings?.sensitivity === 'high') {
            for (const key in baseRisk) baseRisk[key] *= 1.25;
        }


        // Check 1: Too fast checkout
        if (sessionData.checkoutTime < 10) { // Assuming 10 seconds is a threshold
            riskScore += baseRisk.tooFastCheckout;
            flags.push({ type: 'too_fast_checkout', severity: 3, description: 'User completed checkout unusually fast.' });
            signals.tooFastCheckout = true;
        }

        // Check 2: Suspicious email pattern
        if (sessionData.email && /\d{8,}@/.test(sessionData.email)) {
            riskScore += baseRisk.suspiciousEmail;
            flags.push({ type: 'suspicious_email', severity: 2, description: 'Email address contains a long sequence of digits, often used by spammers.' });
            signals.suspiciousEmail = true;
        }

        // Check 3: No mouse movements (bot)
        if (sessionData.mouseMovements === 0) {
            riskScore += baseRisk.botBehavior;
            flags.push({ type: 'bot_behavior', severity: 4, description: 'No mouse movements detected during session, indicating potential bot activity.' });
            signals.botBehavior = true;
        }

        // Check 4: Multiple failed payments
        const user = await User.findById(userId);
        // Assuming user.behavior.failedPayments exists and is tracked
        if (user && user.behavior && user.behavior.failedPayments > 2) {
            riskScore += baseRisk.multipleFailedPayments;
            flags.push({ type: 'multiple_failed_payments', severity: 3, description: 'User has a history of multiple failed payment attempts.' });
            signals.multipleFailedPayments = true;
        }

        // Determine risk level based on adjusted score
        let riskLevel;
        if (riskScore > 80) {
            riskLevel = 'critical';
        } else if (riskScore > 60) {
            riskLevel = 'high';
        } else if (riskScore > 40) {
            riskLevel = 'medium';
        } else {
            riskLevel = 'low';
        }

        // Create experience adjustment based on website settings and determined risk level
        const experienceAdjustment = {
            requirePhoneVerification: fraudSettings?.riskBasedActions?.requirePhoneVerification && (riskLevel === 'high' || riskLevel === 'critical'),
            requireEmailVerification: fraudSettings?.riskBasedActions?.requireEmailVerification && (riskLevel === 'medium' || riskLevel === 'high' || riskLevel === 'critical'),
            disableCOD: fraudSettings?.riskBasedActions?.disableCOD && (riskLevel === 'high' || riskLevel === 'critical'),
            showCaptcha: fraudSettings?.riskBasedActions?.showCaptcha && (riskLevel === 'medium' || riskLevel === 'high' || riskLevel === 'critical'),
            manualReview: fraudSettings?.riskBasedActions?.manualReview && (riskLevel === 'critical'),
            limitOrderValue: (fraudSettings?.riskBasedActions?.limitOrderValue && (riskLevel === 'high' || riskLevel === 'critical')) ? fraudSettings.riskBasedActions.limitOrderValue : null
        };

        // Save fraud score
        await FraudScore.create({
            userId,
            websiteId: websiteID,
            sessionId: sessionData.sessionId,
            score: riskScore,
            riskLevel,
            flags,
            signals,
            experienceAdjustment,
            timestamp: new Date()
        });

        // Update user fraud score
        if (user) {
            await User.findByIdAndUpdate(userId, {
                $set: {
                    'fraudScore.current': riskScore,
                    'fraudScore.flags': flags.map(f => f.type),
                    'fraudScore.lastChecked': new Date()
                }
            });
        }


        res.json({
            success: true,
            data: {
                riskScore,
                riskLevel,
                flags,
                experienceAdjustment
            }
        });
    } catch (error) {
        console.error('Fraud check error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};


module.exports = {
    getFraudEvents,
    checkFraud
};