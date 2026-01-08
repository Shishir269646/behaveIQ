// src/routes/abandonment.routes.js
const express = require('express');
const router = express.Router();
const { predictRisk, trackInterventionResponse, getAbandonmentStats } = require('../controllers/abandonmentController');
const { protect } = require('../middleware/auth');

router.post('/predict', predictRisk);
router.post('/intervention/response', trackInterventionResponse);
router.get('/stats', protect, getAbandonmentStats);

module.exports = router;