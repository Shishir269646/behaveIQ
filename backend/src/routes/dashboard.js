const express = require('express');
const router = express.Router();

const {
    getOverview,
    getRealtimeVisitors,
    getHeatmap,
    getInsights,
    getConversionFunnel,
    getTopPages,
    getIntentDistribution,
    getPersonaSummary, // New
    getPersonalizationStatus, // New
    getHeatmapSummary, // New
    getExperimentSummary, // New
    getContentSummary, // New
    getAbandonmentSummary, // New
    getDiscountSummary, // New
    getFraudSummary, // New
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

router.get('/summary/personas', getPersonaSummary);
router.get('/summary/personalization', getPersonalizationStatus);
router.get('/summary/heatmaps', getHeatmapSummary);
router.get('/summary/experiments', getExperimentSummary);
router.get('/summary/content', getContentSummary);
router.get('/summary/abandonment', getAbandonmentSummary);
router.get('/summary/discounts', getDiscountSummary);
router.get('/summary/fraud', getFraudSummary);

module.exports = router;