import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../utils/helpers';
import AppError from '../utils/AppError';
import { AuthenticatedRequest } from '../types';

/**
 * Get all fraud events for the current website
 */
export const getFraudEvents = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.website?.id) {
        throw new AppError('Forbidden: Website context not provided by authentication.', 403);
    }

    const websiteId = req.website.id;
    const { userId, riskLevel } = req.query;
    
    const filter: any = { websiteId: websiteId };
    if (userId) filter.userId = userId;
    if (riskLevel) filter.riskLevel = riskLevel;

    const fraudEvents = await prisma.userFraudScore.findMany({
        where: filter,
        orderBy: { lastChecked: 'desc' }
    });

    res.json({
        success: true,
        count: fraudEvents.length,
        data: fraudEvents
    });
});

/**
 * Check fraud
 */
export const checkFraud = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.website?.id) {
        throw new AppError('Forbidden: A valid API key linked to a registered website is required.', 403);
    }

    const { userId, sessionData } = req.body;
    const websiteId = req.website.id;

    // Fetch full website with settings if not already fully populated
    const websiteWithSettings = await prisma.website.findUnique({
        where: { id: websiteId },
        include: {
            settings: {
                include: {
                    fraudDetectionSettings: {
                        include: { riskBasedActions: true }
                    }
                }
            }
        }
    });

    const fraudSettings = websiteWithSettings?.settings?.fraudDetectionSettings;

    let riskScore = 0;
    const flags: any[] = [];
    const signals: any = {};

    const baseRisk = {
        tooFastCheckout: 20,
        suspiciousEmail: 15,
        botBehavior: 25,
        multipleFailedPayments: 20
    };

    if (fraudSettings?.sensitivity === 'low') {
        baseRisk.tooFastCheckout *= 0.75;
        baseRisk.suspiciousEmail *= 0.75;
        baseRisk.botBehavior *= 0.75;
        baseRisk.multipleFailedPayments *= 0.75;
    } else if (fraudSettings?.sensitivity === 'high') {
        baseRisk.tooFastCheckout *= 1.25;
        baseRisk.suspiciousEmail *= 1.25;
        baseRisk.botBehavior *= 1.25;
        baseRisk.multipleFailedPayments *= 1.25;
    }

    // Check 1: Too fast checkout
    if (sessionData?.checkoutTime < 10) {
        riskScore += baseRisk.tooFastCheckout;
        flags.push({ type: 'too_fast_checkout', severity: 3, description: 'User completed checkout unusually fast.' });
        signals.tooFastCheckout = true;
    }

    // Check 2: Suspicious email pattern
    if (sessionData?.email && /\d{8,}@/.test(sessionData.email)) {
        riskScore += baseRisk.suspiciousEmail;
        flags.push({ type: 'suspicious_email', severity: 2, description: 'Email address contains a long sequence of digits, often used by spammers.' });
        signals.suspiciousEmail = true;
    }

    // Check 3: No mouse movements (bot)
    if (sessionData?.mouseMovements === 0) {
        riskScore += baseRisk.botBehavior;
        flags.push({ type: 'bot_behavior', severity: 4, description: 'No mouse movements detected during session, indicating potential bot activity.' });
        signals.botBehavior = true;
    }

    // Check 4: Multiple failed payments
    if (userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { behavior: true }
        });
        
        if (user?.behavior && user.behavior.failedPayments > 2) {
            riskScore += baseRisk.multipleFailedPayments;
            flags.push({ type: 'multiple_failed_payments', severity: 3, description: 'User has a history of multiple failed payment attempts.' });
            signals.multipleFailedPayments = true;
        }
    }

    // Determine risk level
    let riskLevel: string;
    if (riskScore > 80) riskLevel = 'critical';
    else if (riskScore > 60) riskLevel = 'high';
    else if (riskScore > 40) riskLevel = 'medium';
    else riskLevel = 'low';

    // Create experience adjustment
    const riskBasedActions = fraudSettings?.riskBasedActions;
    const experienceAdjustment = {
        requirePhoneVerification: riskBasedActions?.requirePhoneVerification && (riskLevel === 'high' || riskLevel === 'critical'),
        requireEmailVerification: riskBasedActions?.requireEmailVerification && (riskLevel === 'medium' || riskLevel === 'high' || riskLevel === 'critical'),
        disableCOD: riskBasedActions?.disableCOD && (riskLevel === 'high' || riskLevel === 'critical'),
        showCaptcha: riskBasedActions?.showCaptcha && (riskLevel === 'medium' || riskLevel === 'high' || riskLevel === 'critical'),
        manualReview: riskBasedActions?.manualReview && (riskLevel === 'critical'),
        limitOrderValue: (riskBasedActions?.limitOrderValue && (riskLevel === 'high' || riskLevel === 'critical')) ? riskBasedActions.limitOrderValue : null
    };

    // Save fraud score
    if (userId) {
        await prisma.userFraudScore.upsert({
            where: { userId: userId },
            update: {
                current: Math.round(riskScore),
                flags: flags.map(f => f.type),
                lastChecked: new Date()
            },
            create: {
                userId: userId,
                current: Math.round(riskScore),
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
});
