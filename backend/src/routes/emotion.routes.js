const express = require('express');
const router = express.Router();
const emotionController = require('../controllers/emotionController');
// const { protect } = require('../middleware/auth'); // Removed from here

router.post('/detect', emotionController.detectEmotion);
router.get('/trends', emotionController.getEmotionTrends);

module.exports = router;