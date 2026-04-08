import express from 'express';
import * as authController from '../controllers/authController';
import { protect } from '../middleware/auth';
import { registerValidation, loginValidation, validate } from '../middleware/validation';

const router = express.Router();

router.post('/register', registerValidation, validate, authController.register);
router.post('/login', loginValidation, validate, authController.login);
router.get('/me', protect, authController.getMe);
router.post('/logout', protect, authController.logout);

export default router;
