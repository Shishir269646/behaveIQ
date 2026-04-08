import express from 'express';
import * as emotionController from '../controllers/emotionController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.post('/detect', emotionController.detectEmotion);
router.get('/trends', protect, emotionController.getEmotionTrends);

export default router;
