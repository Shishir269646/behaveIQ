import express from 'express';
import * as dashboardController from '../controllers/dashboardController';
import { validate } from '../middleware/validate';
import { 
    dashboardQuerySchema, 
    heatmapQuerySchema, 
    realtimeVisitorsQuerySchema,
    insightsQuerySchema,
    conversionFunnelQuerySchema,
    topPagesQuerySchema,
    intentDistributionQuerySchema,
    fraudSummaryQuerySchema,
    personaSummaryQuerySchema,
    personalizationStatusQuerySchema,
    heatmapSummaryQuerySchema,
    experimentSummaryQuerySchema,
    contentSummaryQuerySchema,
    abandonmentSummaryQuerySchema,
    discountSummaryQuerySchema
} from '../validators/dashboard.validator';

const router = express.Router();

router.get('/overview', validate(dashboardQuerySchema), dashboardController.getOverview);
router.get('/realtime', validate(realtimeVisitorsQuerySchema), dashboardController.getRealtimeVisitors);
router.get('/heatmap', validate(heatmapQuerySchema), dashboardController.getHeatmap);
router.get('/insights', validate(insightsQuerySchema), dashboardController.getInsights);
router.get('/funnel', validate(conversionFunnelQuerySchema), dashboardController.getConversionFunnel);
router.get('/top-pages', validate(topPagesQuerySchema), dashboardController.getTopPages);
router.get('/intent-distribution', validate(intentDistributionQuerySchema), dashboardController.getIntentDistribution);
router.get('/fraud-summary', validate(fraudSummaryQuerySchema), dashboardController.getFraudSummary);
router.get('/persona-summary', validate(personaSummaryQuerySchema), dashboardController.getPersonaSummary);
router.get('/personalization-status', validate(personalizationStatusQuerySchema), dashboardController.getPersonalizationStatus);
router.get('/heatmap-summary', validate(heatmapSummaryQuerySchema), dashboardController.getHeatmapSummary);
router.get('/experiment-summary', validate(experimentSummaryQuerySchema), dashboardController.getExperimentSummary);
router.get('/content-summary', validate(contentSummaryQuerySchema), dashboardController.getContentSummary);
router.get('/abandonment-summary', validate(abandonmentSummaryQuerySchema), dashboardController.getAbandonmentSummary);
router.get('/discount-summary', validate(discountSummaryQuerySchema), dashboardController.getDiscountSummary);

export default router;
