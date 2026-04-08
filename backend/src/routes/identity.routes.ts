import express from 'express';
import * as identityController from '../controllers/identityController';

const router = express.Router();

router.post('/identify', identityController.identify);

export default router;