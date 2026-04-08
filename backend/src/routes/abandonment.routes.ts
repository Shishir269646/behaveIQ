import express from 'express';
import * as abandonmentController from '../controllers/abandonmentController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.post('/predict', abandonmentController.predictRisk);
router.post('/intervention/response', abandonmentController.trackInterventionResponse);
router.get('/stats', protect, abandonmentController.getAbandonmentStats);

export default router;
