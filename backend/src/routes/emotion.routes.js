const express = require('express');
const router = express.Router();
console.log('Loading emotion routes...'); // ADDED
const emotionController = require('../controllers/emotionController');
// const { protect } = require('../middleware/auth'); // Removed from here

router.post('/detect', emotionController.detectEmotion);
router.get('/trends', emotionController.getEmotionTrends); console.log('Emotion route registered: /trends'); // ADDED

module.exports = router;