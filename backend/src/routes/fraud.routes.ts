import express from 'express';
import * as fraudController from '../controllers/fraudController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { getFraudEventsQuerySchema, checkFraudBodySchema } from '../validators/fraud.validator';

const router = express.Router();

router.get('/', protect, validate(getFraudEventsQuerySchema), fraudController.getFraudEvents);
router.post('/check', validate(checkFraudBodySchema), fraudController.checkFraud);

export default router;