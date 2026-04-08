import express from 'express';
import * as contentController from '../controllers/contentController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.post('/generate', protect, contentController.generateContent);
router.get('/options', protect, contentController.getContentOptions);

export default router;
