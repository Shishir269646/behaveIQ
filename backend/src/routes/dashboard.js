const express = require('express');
const router = express.Router();
console.log('Loading dashboard routes...'); // ADDED
const {
    getOverview,
    getRealtimeVisitors,
    getHeatmap,
    getInsights,
    getConversionFunnel,
    getTopPages,
    getIntentDistribution
} = require('../controllers/dashboardController');
// const { protect } = require('../middleware/auth'); // Removed from here

// router.use(protect); // Moved to app.js mounting

router.get('/overview', getOverview); console.log('Dashboard route registered: /overview'); // ADDED
router.get('/realtime', getRealtimeVisitors);
router.get('/heatmap', getHeatmap);
router.get('/insights', getInsights);
router.get('/conversion-funnel', getConversionFunnel);
router.get('/top-pages', getTopPages);
router.get('/intent-distribution', getIntentDistribution);

module.exports = router;