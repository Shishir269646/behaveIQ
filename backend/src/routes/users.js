const express = require('express');
const router = express.Router();
const {
    getUsers,
    getUser,
    updateUser,
    deleteUser
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { updateUserValidation, validate } = require('../middleware/validation');

// All routes here are protected and only accessible by admins
router.use(protect);
router.use(authorize('admin'));

router.route('/')
    .get(getUsers);

router.route('/:id')
    .get(getUser)
    .put(updateUserValidation, validate, updateUser)
    .delete(deleteUser);

module.exports = router;
