// src/controllers/fraudController.js
const { prisma } = require('../config/database'); // Import prisma client
const { asyncHandler } = require('../utils/helpers'); // Assuming asyncHandler is available
const AppError = require('../utils/AppError');

// Get all fraud events for the current website
const getFraudEvents = asyncHandler(async (req, res) => {

    if (!req.website || !req.website.id) { // Use req.website.id
        throw new AppError('Forbidden: Website context not provided by authentication.', 403);
    }

    const websiteId = req.website.id; // Use req.website.id

    const { userId, riskLevel } = req.query;
    const filter = { websiteId: websiteId };
    if (userId) filter.userId = userId;
    if (riskLevel) filter.riskLevel = riskLevel;

    const fraudEvents = await prisma.userFraudScore.findMany({
        where: filter,
        orderBy: { lastChecked: 'desc' } // Assuming timestamp in Mongoose maps to lastChecked in Prisma
    });

    res.json({
        success: true,
        count: fraudEvents.length,
        data: fraudEvents
    });
});

const checkFraud = async (req, res) => {
    try {
        if (!req.website) {
            throw new AppError('Forbidden: A valid API key linked to a registered website is required.', 403);
        }

        const { userId, sessionData } = req.body;

        const fraudSettings = req.website.settings?.fraudDetectionSettings; // Access settings safely

        let riskScore = 0;
        const flags = [];
        const signals = {};

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
        if (sessionData.checkoutTime < 10) { // Assuming checkoutTime is part of sessionData
            riskScore += baseRisk.tooFastCheckout;
            flags.push({ type: 'too_fast_checkout', severity: 3, description: 'User completed checkout unusually fast.' });
            signals.tooFastCheckout = true;
        }

        // Check 2: Suspicious email pattern
        if (sessionData.email && /\d{8,}@/.test(sessionData.email)) { // Assuming email is part of sessionData
            riskScore += baseRisk.suspiciousEmail;
            flags.push({ type: 'suspicious_email', severity: 2, description: 'Email address contains a long sequence of digits, often used by spammers.' });
            signals.suspiciousEmail = true;
        }

        // Check 3: No mouse movements (bot)
        if (sessionData.mouseMovements === 0) { // Assuming mouseMovements count is part of sessionData
            riskScore += baseRisk.botBehavior;
            flags.push({ type: 'bot_behavior', severity: 4, description: 'No mouse movements detected during session, indicating potential bot activity.' });
            signals.botBehavior = true;
        }

        // Check 4: Multiple failed payments
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { behavior: true } // Include behavior to check failedPayments
        });
        
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
        await prisma.userFraudScore.create({
            data: {
                userId: userId,
                websiteId: req.website.id, // Use req.website.id
                // Assuming sessionId is string
                score: riskScore,
                riskLevel: riskLevel,
                flags: flags.map(f => f.type), // Store flags as string array
                signals: signals, // Store signals as Json
                experienceAdjustment: experienceAdjustment, // Store as Json
                lastChecked: new Date() // Using lastChecked as the timestamp
            }
        });

        // Update user fraud score
        if (user) {
            await prisma.userFraudScore.update({
                where: { userId: userId }, // Assuming userId is unique for UserFraudScore
                data: {
                    current: riskScore,
                    flags: flags.map(f => f.type),
                    lastChecked: new Date()
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