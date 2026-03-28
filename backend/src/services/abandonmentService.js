const mlServiceClient = require('./mlServiceClient');
const { prisma } = require('../config/database'); // Import prisma client
const AppError = require('../utils/AppError');

/**
 * Predict abandonment risk
 */
exports.predictAbandonmentRisk = async (sessionId, websiteId, userId) => {
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { behavior: true, intentScore: { select: { current: true } } }
    });

    if (!session) {
        return { riskScore: 0, prediction: 'low_risk', recommendedIntervention: 'none' };
    }

    const features = {
        timeOnPage: session.duration || 0,
        pageViewCount: session.behavior?.pageViews?.length || 0,
        cartActionCount: session.behavior?.cartActions?.length || 0,
        intentScore: session.intentScore?.current || 0,
    };

    try {
        const mlResult = await mlServiceClient.callMLService('/predict/abandonment', {
            websiteId: websiteId, // websiteId is already a string
            sessionId: sessionId, // sessionId is already a string
            features: features
        });

        const riskScore = mlResult.riskScore || 0;
        const prediction = mlResult.prediction || 'low_risk';

        await prisma.session.update({
            where: { id: sessionId },
            data: {
                abandonmentRiskScore: riskScore,
                abandonmentPrediction: prediction,
                // The timestamp for abandonmentRisk was not directly modeled as a separate field,
                // using updatedAt for general update time or a dedicated field if needed.
            }
        });

        return {
            riskScore,
            prediction,
            recommendedIntervention: mlResult.recommendedIntervention || 'none'
        };
    } catch (error) {
        console.error('[AbandonmentService] ML Error:', error.message);
        return { riskScore: 0.1, prediction: 'low_risk', recommendedIntervention: 'none' };
    }
};

/**
 * Track intervention response
 */
exports.trackInterventionResponse = async (interventionId, responseStatus, sessionOutcome = null) => {
    const intervention = await prisma.sessionIntervention.findUnique({
        where: { id: interventionId },
        include: { session: true } // Include session to get sessionId for update
    });
    if (!intervention) {
        throw new AppError('Intervention not found', 404);
    }

    const updateData = {
        response: responseStatus,
        timestamp: new Date(), // This seems to be for intervention's own timestamp
        // The effectiveness and outcome fields need to be handled based on the Prisma schema.
        // Assuming 'outcome' can be set directly on SessionIntervention.
    };

    if (sessionOutcome === 'purchase') {
        updateData.effectiveness = 1;
        // In Mongoose, there were intervention.outcome.prevented and .converted
        // In Prisma, we have response (string) and effectiveness (float) on SessionIntervention directly.
        // Need to decide how 'prevented' and 'converted' map. Assuming 'effectiveness: 1' implies conversion.
    } else if (responseStatus === 'clicked') {
        updateData.effectiveness = updateData.effectiveness || 0.5; // If not already 1 from purchase
    }

    const updatedIntervention = await prisma.sessionIntervention.update({
        where: { id: interventionId },
        data: updateData,
    });

    if (sessionOutcome && intervention.sessionId) {
        await prisma.session.update({
            where: { id: intervention.sessionId },
            data: { outcome: sessionOutcome }
        });
    }

    return updatedIntervention;
};

/**
 * Get statistics for abandonment
 */
exports.getStats = async (websiteId, days) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const nonConvertedSessions = await prisma.session.findMany({
        where: {
            websiteId,
            outcome: { not: 'purchase' }, // Assuming outcome 'purchase' means converted
            createdAt: { gte: startDate }
        },
        select: {
            intentScore: {
                select: { current: true }
            }
        },
    });

    const overallRisk = nonConvertedSessions.length > 0
        ? (nonConvertedSessions.reduce((sum, s) => sum + (s.intentScore?.current || 0), 0) / nonConvertedSessions.length)
        : 0;

    const interventions = await prisma.sessionIntervention.findMany({
        where: {
            session: {
                websiteId: websiteId
            },
            timestamp: { gte: startDate }
        },
        select: {
            type: true,
            response: true,
            effectiveness: true // Assuming effectiveness can imply conversion
        }
    });

    const triggered = interventions.length;
    // Assuming effectiveness of 1 implies a recovered/converted state from intervention
    const recovered = interventions.filter(i => i.effectiveness === 1).length;
    const recoveryRate = triggered > 0 ? (recovered / triggered) * 100 : 0;

    const performanceMap = {};
    interventions.forEach(i => {
        const type = i.type || 'unknown';
        if (!performanceMap[type]) {
            performanceMap[type] = { type, shown: 0, clicked: 0, converted: 0 };
        }
        performanceMap[type].shown++;
        if (i.response === 'clicked') performanceMap[type].clicked++;
        if (i.effectiveness === 1) performanceMap[type].converted++; // Assuming effectiveness 1 implies conversion
    });

    const performance = Object.values(performanceMap).map(stats => ({
        ...stats,
        effectiveness: stats.shown > 0 ? (stats.converted / stats.shown) * 100 : 0
    }));

    // Prisma's aggregation API for trends (similar to what was done in dashboardService)
    const sessionsForTrend = await prisma.session.findMany({
        where: {
            websiteId: websiteId,
            outcome: { not: 'purchase' }, // Non-converted sessions
            createdAt: { gte: startDate }
        },
        select: {
            createdAt: true,
            intentScore: { select: { current: true } }
        },
        orderBy: {
            createdAt: 'asc'
        }
    });

    const trendMap = new Map();
    sessionsForTrend.forEach(session => {
        const dateKey = session.createdAt.toISOString().split('T')[0];
        if (!trendMap.has(dateKey)) {
            trendMap.set(dateKey, { totalIntentScore: 0, sessionsCount: 0 });
        }
        const data = trendMap.get(dateKey);
        data.totalIntentScore += (session.intentScore?.current || 0);
        data.sessionsCount++;
        trendMap.set(dateKey, data);
    });

    const trends = Array.from(trendMap.entries()).map(([date, data]) => ({
        date: date,
        riskScore: data.sessionsCount > 0 ? parseFloat(((data.totalIntentScore / data.sessionsCount)).toFixed(2)) : 0,
        sessions: data.sessionsCount
    }));

    return {
        overallRisk: parseFloat(overallRisk.toFixed(2)),
        interventionsTriggered: triggered,
        recoveryRate: parseFloat(recoveryRate.toFixed(2)),
        interventionPerformance: performance,
        riskTrends: trends
    };
};