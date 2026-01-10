const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { protect } = require('../middleware/auth');

// @route   POST api/content/generate
// @desc    Generate content based on persona
// @access  Private
router.post('/generate', protect, contentController.generateContent);

// @route   GET api/content/options
// @desc    Get available personas and content types for content generation
// @access  Private
router.get('/options', protect, contentController.getContentOptions);

module.exports = router;
