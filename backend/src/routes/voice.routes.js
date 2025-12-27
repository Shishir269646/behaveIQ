// src/routes/voice.routes.js
const express = require('express');
const router = express.Router();
const voiceController = require('../controllers/voiceController');

router.post('/search', voiceController.searchByVoice);

module.exports = router;