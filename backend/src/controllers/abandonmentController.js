// src/controllers/abandonmentController.js
const abandonmentService = require('../services/abandonmentService');

exports.predictRisk = async (req, res) => {
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

exports.trackInterventionResponse = async (req, res) => {
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