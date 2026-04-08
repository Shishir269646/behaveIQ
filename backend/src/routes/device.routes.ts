import express from 'express';
import * as deviceController from '../controllers/deviceController';

const router = express.Router();

router.post('/stitch', deviceController.stitchDevices);
router.get('/user/:userId', deviceController.getUserDevices);

export default router;
