import express from 'express';
import * as voiceController from '../controllers/voiceController';

const router = express.Router();

router.post('/search', voiceController.searchByVoice);

export default router;