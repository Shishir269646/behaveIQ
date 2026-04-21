import express from 'express';
import * as abandonmentController from '../controllers/abandonmentController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { predictRiskSchema, trackInterventionResponseSchema, getAbandonmentStatsSchema } from '../validators/abandonment.validator';

const router = express.Router();

router.post('/predict', validate(predictRiskSchema), abandonmentController.predictRisk);
router.post('/intervention/response', validate(trackInterventionResponseSchema), abandonmentController.trackInterventionResponse);
router.get('/stats', protect, validate(getAbandonmentStatsSchema), abandonmentController.getAbandonmentStats);

export default router;

