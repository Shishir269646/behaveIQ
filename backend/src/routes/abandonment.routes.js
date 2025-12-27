// src/routes/abandonment.routes.js
const express = require('express');
const router = express.Router();
const abandonmentController = require('../controllers/abandonmentController');

router.post('/predict', abandonmentController.predictRisk);
router.post('/intervention/response', abandonmentController.trackInterventionResponse);

module.exports = router;