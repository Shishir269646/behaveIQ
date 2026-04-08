import express from 'express';
import * as fraudController from '../controllers/fraudController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/', protect, fraudController.getFraudEvents);
router.post('/check', fraudController.checkFraud);

export default router;