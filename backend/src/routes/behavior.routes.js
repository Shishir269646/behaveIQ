// src/routes/behavior.routes.js
const express = require('express');
const router = express.Router();
const behaviorController = require('../controllers/behaviorController');

router.post('/track', behaviorController.trackEvent);
router.get('/summary/:sessionId', behaviorController.getBehaviorSummary);

module.exports = router;