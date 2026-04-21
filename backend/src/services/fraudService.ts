import { prisma } from '../config/database';
import AppError from '../utils/AppError';
import { WebsiteFraudDetectionSettings, WebsiteRiskBasedActions } from '@prisma/client'; // Assuming these types exist from prisma

/**
 * Helper to fetch website fraud settings
 */
const getWebsiteFraudSettings = async (websiteId: string) => {
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

    if (!websiteWithSettings) {
        throw new AppError('Website not found', 404);
    }
    return websiteWithSettings.settings?.fraudDetectionSettings;
};

/**
 * Calculates base risk scores adjusted by sensitivity.
 */
const calculateAdjustedBaseRisk = (sensitivity: string | undefined) => {
    const baseRisk = {
        tooFastCheckout: 20,
        suspiciousEmail: 15,
        botBehavior: 25,
        multipleFailedPayments: 20
    };

    if (sensitivity === 'low') {
        Object.keys(baseRisk).forEach(key => (baseRisk as any)[key] *= 0.75);
    } else if (sensitivity === 'high') {
        Object.keys(baseRisk).forEach(key => (baseRisk as any)[key] *= 1.25);
    }
    return baseRisk;
};

/**
 * Determines the risk level based on the calculated risk score.
 */
const determineRiskLevel = (riskScore: number): string => {
    if (riskScore > 80) return 'critical';
    if (riskScore > 60) return 'high';
    if (riskScore > 40) return 'medium';
    return 'low';
};

/**
 * Applies risk-based actions based on risk level and website settings.
 */
const applyRiskBasedActions = (
    riskLevel: string,
    riskBasedActions: WebsiteRiskBasedActions | undefined | null
) => {
    return {
        requirePhoneVerification: riskBasedActions?.requirePhoneVerification && (riskLevel === 'high' || riskLevel === 'critical'),
        requireEmailVerification: riskBasedActions?.requireEmailVerification && (riskLevel === 'medium' || riskLevel === 'high' || riskLevel === 'critical'),
        disableCOD: riskBasedActions?.disableCOD && (riskLevel === 'high' || riskLevel === 'critical'),
        showCaptcha: riskBasedActions?.showCaptcha && (riskLevel === 'medium' || riskLevel === 'high' || riskLevel === 'critical'),
        manualReview: riskBasedActions?.manualReview && (riskLevel === 'critical'),
        limitOrderValue: (riskBasedActions?.limitOrderValue && (riskLevel === 'high' || riskLevel === 'critical')) ? riskBasedActions.limitOrderValue : null
    };
};

/**
 * Get all fraud events for a specific website, with optional filtering.
 */
export const getFraudEvents = async (websiteId: string, userId?: string, riskLevel?: string) => {
    const filter: any = { websiteId: websiteId };
    if (userId) filter.userId = userId;
    if (riskLevel) filter.current = { gte: parseRiskLevelToScore(riskLevel) }; // Assuming 'current' stores the score

    const fraudEvents = await prisma.userFraudScore.findMany({
        where: filter,
        orderBy: { lastChecked: 'desc' }
    });
    return fraudEvents;
};

// Helper to convert risk level string to a score threshold for filtering
const parseRiskLevelToScore = (riskLevel: string): number => {
    switch (riskLevel.toLowerCase()) {
        case 'low': return 0;
        case 'medium': return 41;
        case 'high': return 61;
        case 'critical': return 81;
        default: return 0;
    }
};

/**
 * Checks for fraud based on session data and user history.
 */
export const checkFraudDetection = async (websiteId: string, userId: string | undefined, sessionData: any) => {
    const fraudSettings = await getWebsiteFraudSettings(websiteId);
    const adjustedBaseRisk = calculateAdjustedBaseRisk(fraudSettings?.sensitivity);

    let riskScore = 0;
    const flags: { type: string; severity: number; description: string }[] = [];
    const signals: any = {};

    // Check 1: Too fast checkout
    if (sessionData?.checkoutTime < 10) {
        riskScore += adjustedBaseRisk.tooFastCheckout;
        flags.push({ type: 'too_fast_checkout', severity: 3, description: 'User completed checkout unusually fast.' });
        signals.tooFastCheckout = true;
    }

    // Check 2: Suspicious email pattern
    if (sessionData?.email && /\d{8,}@/.test(sessionData.email)) {
        riskScore += adjustedBaseRisk.suspiciousEmail;
        flags.push({ type: 'suspicious_email', severity: 2, description: 'Email address contains a long sequence of digits, often used by spammers.' });
        signals.suspiciousEmail = true;
    }

    // Check 3: No mouse movements (bot)
    if (sessionData?.mouseMovements === 0) {
        riskScore += adjustedBaseRisk.botBehavior;
        flags.push({ type: 'bot_behavior', severity: 4, description: 'No mouse movements detected during session, indicating potential bot activity.' });
        signals.botBehavior = true;
    }

    // Check 4: Multiple failed payments (if userId provided)
    if (userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { behavior: true }
        });
        
        if (user?.behavior && user.behavior.failedPayments > 2) {
            riskScore += adjustedBaseRisk.multipleFailedPayments;
            flags.push({ type: 'multiple_failed_payments', severity: 3, description: 'User has a history of multiple failed payment attempts.' });
            signals.multipleFailedPayments = true;
        }
    }

    const riskLevel = determineRiskLevel(riskScore);
    const experienceAdjustment = applyRiskBasedActions(riskLevel, fraudSettings?.riskBasedActions);

    // Save fraud score if userId provided
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

    return { riskScore, riskLevel, flags, experienceAdjustment };
};
