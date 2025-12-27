const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const auth = require('../middleware/auth');

// @route   POST api/content/generate
// @desc    Generate content based on persona
// @access  Private
router.post('/generate', auth, contentController.generateContent);

module.exports = router;
