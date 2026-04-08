import express from 'express';
import * as sdkController from '../controllers/sdkController';

const router = express.Router();

router.get('/config', sdkController.getSDKConfig);
router.post('/events', sdkController.trackEvent);
router.post('/identity', sdkController.identifyUser);
router.post('/heartbeat', sdkController.sendHeartbeat);

export default router;
