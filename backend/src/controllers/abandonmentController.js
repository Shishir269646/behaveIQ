const Website = require('../models/Website');
const Intervention = require('../models/Intervention');
const { asyncHandler } = require('../utils/helpers');

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

    // Fetch interventions data
    const interventions = await Intervention.find({
        userId: req.user._id, // Assuming interventions are tied to user, not website directly for simplicity
        timestamp: { $gte: startDate }
    });

    // Calculate risk trends (mock data for now)
    const riskTrends = [];
    for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        riskTrends.push({
            date: date.toISOString().split('T')[0],
            riskScore: Math.floor(Math.random() * 50) + 30, // Random score between 30-80
            interventions: Math.floor(Math.random() * 20),
            conversions: Math.floor(Math.random() * 10)
        });
    }

    // Overall stats
    const totalInterventions = interventions.length;
    const recoveredInterventions = interventions.filter(i => i.outcome?.converted).length;
    const recoveryRate = totalInterventions > 0 ? (recoveredInterventions / totalInterventions) * 100 : 0;

    // Intervention performance (mock data for now)
    const interventionPerformance = [
        { type: 'discount', shown: 100, clicked: 30, converted: 15, effectiveness: 15 },
        { type: 'chat', shown: 80, clicked: 20, converted: 8, effectiveness: 10 },
    ];

    res.json({
        success: true,
        data: {
            riskTrends,
            overallRisk: Math.floor(Math.random() * 50) + 30,
            interventionsTriggered: totalInterventions,
            recoveryRate: recoveryRate.toFixed(2),
            interventionPerformance
        }
    });
});

module.exports = {
  predictRisk,
  trackInterventionResponse,
  getAbandonmentStats
};