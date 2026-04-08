import express from 'express';
import * as behaviorController from '../controllers/behaviorController';

const router = express.Router();

router.post('/track', behaviorController.trackEvent);
router.get('/summary/:sessionId', behaviorController.getBehaviorSummary);

export default router;
