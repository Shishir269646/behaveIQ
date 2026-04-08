import express from 'express';
import * as eventController from '../controllers/eventController';

const router = express.Router();

router.get('/', eventController.getEvents);
router.get('/stats', eventController.getEventStats);

export default router;
