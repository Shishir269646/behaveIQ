const mlServiceClient = require('./mlServiceClient');
const Session = require('../models/Session');
const Intervention = require('../models/Intervention');

/**
 * Predict abandonment risk
 */
exports.predictAbandonmentRisk = async (sessionId, websiteId, userId) => {
    const session = await Session.findById(sessionId);
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
            websiteId: websiteId.toString(),
            sessionId: sessionId.toString(),
            features: features
        });

        const riskScore = mlResult.riskScore || 0;
        const prediction = mlResult.prediction || 'low_risk';

        session.abandonmentRisk = {
            score: riskScore,
            prediction: prediction,
            timestamp: new Date()
        };
        await session.save();

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
    const intervention = await Intervention.findById(interventionId);
    if (!intervention) {
        throw new Error('Intervention not found');
    }

    intervention.response.status = responseStatus;
    intervention.response.timestamp = new Date();

    if (sessionOutcome === 'purchase') {
        intervention.response.effectiveness = 1;
        intervention.outcome.prevented = true;
        intervention.outcome.converted = true;
    } else if (responseStatus === 'clicked') {
        intervention.response.effectiveness = 0.5;
    }

    await intervention.save();

    if (sessionOutcome) {
        await Session.findByIdAndUpdate(intervention.sessionId, { outcome: sessionOutcome });
    }

    return intervention;
};

/**
 * Get statistics for abandonment
 */
exports.getStats = async (websiteId, days) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const nonConvertedSessions = await Session.find({
        websiteId,
        converted: false,
        createdAt: { $gte: startDate }
    }).select('intentScore').lean();

    const overallRisk = nonConvertedSessions.length > 0
        ? (nonConvertedSessions.reduce((sum, s) => sum + (s.intentScore || 0), 0) / nonConvertedSessions.length) * 100
        : 0;

    const interventions = await Intervention.find({
        websiteId,
        timestamp: { $gte: startDate }
    }).lean();

    const triggered = interventions.length;
    const recovered = interventions.filter(i => i.outcome?.converted).length;
    const recoveryRate = triggered > 0 ? (recovered / triggered) * 100 : 0;

    const performanceMap = {};
    interventions.forEach(i => {
        const type = i.type || 'unknown';
        if (!performanceMap[type]) {
            performanceMap[type] = { type, shown: 0, clicked: 0, converted: 0 };
        }
        performanceMap[type].shown++;
        if (i.response?.status === 'clicked') performanceMap[type].clicked++;
        if (i.outcome?.converted) performanceMap[type].converted++;
    });

    const performance = Object.values(performanceMap).map(stats => ({
        ...stats,
        effectiveness: stats.shown > 0 ? (stats.converted / stats.shown) * 100 : 0
    }));

    const trends = await Session.aggregate([
        {
            $match: {
                websiteId: websiteId,
                converted: false,
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                avgIntentScore: { $avg: '$intentScore' },
                sessionsCount: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    return {
        overallRisk: parseFloat(overallRisk.toFixed(2)),
        interventionsTriggered: triggered,
        recoveryRate: parseFloat(recoveryRate.toFixed(2)),
        interventionPerformance: performance,
        riskTrends: trends.map(t => ({
            date: t._id,
            riskScore: t.avgIntentScore ? parseFloat((t.avgIntentScore * 100).toFixed(2)) : 0,
            sessions: t.sessionsCount
        }))
    };
};