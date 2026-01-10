const Website = require('../models/Website');
const Intervention = require('../models/Intervention');
const { asyncHandler } = require('../utils/helpers');
const abandonmentService = require('../services/abandonmentService');

const predictRisk = async (req, res) => {
  try {
    const { userId, sessionData } = req.body;

    // Predict abandonment risk
    const result = await abandonmentService.predictAbandonmentRisk(userId, sessionData);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Abandonment prediction error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const trackInterventionResponse = async (req, res) => {
  try {
    const { interventionId, response } = req.body;

    await abandonmentService.trackInterventionResponse(interventionId, response);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get abandonment statistics for a website
// @route   GET /api/v1/abandonment/stats?websiteId=xxx&timeRange=7d
const getAbandonmentStats = asyncHandler(async (req, res) => {
    const { websiteId, timeRange = '7d' } = req.query;

    const website = await Website.findOne({ _id: websiteId, userId: req.user._id });
    if (!website) {
        return res.status(404).json({ success: false, message: 'Website not found' });
    }

    const days = parseInt(timeRange) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Overall Risk (Average intent score of non-converted sessions within the time range,
    // or a more sophisticated ML prediction if available)
    const nonConvertedSessions = await Session.find({
        websiteId,
        converted: false,
        createdAt: { $gte: startDate }
    }).select('intentScore');

    const overallRisk = nonConvertedSessions.length > 0
        ? (nonConvertedSessions.reduce((sum, session) => sum + (session.intentScore || 0), 0) / nonConvertedSessions.length) * 100
        : 0;

    // Interventions Triggered and Recovery Rate
    const interventions = await Intervention.find({
        websiteId,
        timestamp: { $gte: startDate }
    });

    const interventionsTriggered = interventions.length;
    const recoveredInterventions = interventions.filter(i => i.outcome?.converted).length;
    const recoveryRate = interventionsTriggered > 0 ? (recoveredInterventions / interventionsTriggered) * 100 : 0;

    // Intervention Performance
    const interventionPerformanceMap = new Map();
    for (const intervention of interventions) {
        const type = intervention.type || 'unknown';
        if (!interventionPerformanceMap.has(type)) {
            interventionPerformanceMap.set(type, { shown: 0, clicked: 0, converted: 0, effectiveness: 0 });
        }
        const stats = interventionPerformanceMap.get(type);
        stats.shown++;
        if (intervention.response?.status === 'clicked') {
            stats.clicked++;
        }
        if (intervention.outcome?.converted) {
            stats.converted++;
        }
    }
    const interventionPerformance = Array.from(interventionPerformanceMap.entries()).map(([type, stats]) => {
        stats.effectiveness = stats.shown > 0 ? (stats.converted / stats.shown) * 100 : 0;
        return { type, ...stats };
    });

    // Abandonment Risk Trends (Daily average intent score of non-converted sessions)
    const riskTrends = await Session.aggregate([
        {
            $match: {
                websiteId: website._id,
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
        {
            $sort: { _id: 1 }
        }
    ]);

    const formattedRiskTrends = riskTrends.map(trend => ({
        date: trend._id,
        riskScore: trend.avgIntentScore ? parseFloat((trend.avgIntentScore * 100).toFixed(2)) : 0,
        sessions: trend.sessionsCount
    }));


    res.json({
        success: true,
        data: {
            overallRisk: parseFloat(overallRisk.toFixed(2)),
            interventionsTriggered,
            recoveryRate: parseFloat(recoveryRate.toFixed(2)),
            interventionPerformance,
            riskTrends: formattedRiskTrends
        }
    });
});

module.exports = {
  predictRisk,
  trackInterventionResponse,
  getAbandonmentStats
};