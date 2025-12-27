const express = require('express');
const router = express.Router();
const {
    getOverview,
    getRealtimeVisitors,
    getHeatmap,
    getInsights,
    getConversionFunnel,
    getTopPages
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/overview', getOverview);
router.get('/realtime', getRealtimeVisitors);
router.get('/heatmap', getHeatmap);
router.get('/insights', getInsights);
router.get('/conversion-funnel', getConversionFunnel);
router.get('/top-pages', getTopPages);

module.exports = router;