import express from 'express';
import {
    getUsers,
    getUser,
    updateUser,
    deleteUser
} from '../controllers/userController';
import { protect, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { userIdParamSchema, updateUserSchema } from '../validators/user.validator';

const router = express.Router();

// All routes here are protected and only accessible by admins
router.use(protect);
router.use(authorize('admin'));

router.route('/')
    .get(getUsers);

router.route('/:id')
    .get(validate(userIdParamSchema), getUser)
    .put(validate(updateUserSchema), updateUser)
    .delete(validate(userIdParamSchema), deleteUser);

export default router;
