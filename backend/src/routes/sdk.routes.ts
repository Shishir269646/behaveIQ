import express from 'express';
import * as sdkController from '../controllers/sdkController';
import { validate } from '../middleware/validate';
import { 
    getSDKConfigSchema, 
    identifyUserSchema, 
    trackEventSchema, 
    sendHeartbeatSchema,
    getPersonalizationSchema,
    calculateIntentSchema
} from '../validators/sdk.validator';

const router = express.Router();

router.get('/config', validate(getSDKConfigSchema), sdkController.getSDKConfig);
router.post('/events', validate(trackEventSchema), sdkController.trackEvent);
router.post('/identity', validate(identifyUserSchema), sdkController.identifyUser);
router.post('/heartbeat', validate(sendHeartbeatSchema), sdkController.sendHeartbeat);
router.get('/:apiKey/:sessionId/personalization', validate(getPersonalizationSchema), sdkController.getPersonalization);
router.post('/intent', validate(calculateIntentSchema), sdkController.calculateIntent);

export default router;
