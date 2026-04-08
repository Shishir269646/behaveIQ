import express from 'express';
import * as dashboardController from '../controllers/dashboardController';

const router = express.Router();

router.get('/overview', dashboardController.getOverview);
router.get('/realtime', dashboardController.getRealtimeVisitors);
router.get('/heatmap', dashboardController.getHeatmap);
router.get('/insights', dashboardController.getInsights);
router.get('/funnel', dashboardController.getConversionFunnel);
router.get('/top-pages', dashboardController.getTopPages);
router.get('/intent-distribution', dashboardController.getIntentDistribution);
router.get('/fraud-summary', dashboardController.getFraudSummary);
router.get('/persona-summary', dashboardController.getPersonaSummary);
router.get('/personalization-status', dashboardController.getPersonalizationStatus);
router.get('/heatmap-summary', dashboardController.getHeatmapSummary);
router.get('/experiment-summary', dashboardController.getExperimentSummary);
router.get('/content-summary', dashboardController.getContentSummary);
router.get('/abandonment-summary', dashboardController.getAbandonmentSummary);
router.get('/discount-summary', dashboardController.getDiscountSummary);

export default router;
