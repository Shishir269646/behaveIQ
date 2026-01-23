const express = require('express');
const router = express.Router();
const emotionController = require('../controllers/emotionController');
const { protect } = require('../middleware/auth');

router.post('/detect', emotionController.detectEmotion);
router.get('/trends', protect, emotionController.getEmotionTrends);

module.exports = router;