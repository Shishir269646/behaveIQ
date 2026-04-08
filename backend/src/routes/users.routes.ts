import express from 'express';
import {
    getUsers,
    getUser,
    updateUser,
    deleteUser
} from '../controllers/userController';
import { protect, authorize } from '../middleware/auth';
import { updateUserValidation, validate } from '../middleware/validation';

const router = express.Router();

// All routes here are protected and only accessible by admins
router.use(protect);
router.use(authorize('admin'));

router.route('/')
    .get(getUsers);

router.route('/:id')
    .get(getUser)
    .put(updateUserValidation, validate, updateUser)
    .delete(deleteUser);

export default router;
