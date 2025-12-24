const express = require('express');
const router = express.Router();
const { getHeatmapData } = require('../controllers/heatmapController');
const { protect } = require('../middleware/auth');

// @route   GET /api/v1/heatmap
router.route('/').get(protect, getHeatmapData);

module.exports = router;
