const express = require('express');
const router = express.Router();
const {
  trackEvent,
  getPersonalization,
  calculateIntent,
  getSdkScript
} = require('../controllers/sdkController');

// No authentication needed for SDK routes (uses API key)
router.get('/init.js', getSdkScript); // New route for the dynamic script
router.post('/track', trackEvent);
router.get('/personalize/:apiKey/:sessionId', getPersonalization);
router.post('/intent-score', calculateIntent);

module.exports = router;