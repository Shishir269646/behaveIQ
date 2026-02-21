const User = require('../models/User');
const { asyncHandler } = require('../utils/helpers');
const { sendResponse } = require('../utils/responseHandler');
const AppError = require('../utils/AppError');

// Get all users
const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password').lean();
    sendResponse(res, 200, { users, count: users.length });
});

// Get single user
const getUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password').lean();

    if (!user) {
        throw new AppError(`User not found with id of ${req.params.id}`, 404);
    }

    sendResponse(res, 200, { user });
});

// Update user
const updateUser = asyncHandler(async (req, res) => {
    const { email, fullName, companyName, plan, role, settings } = req.body;

    let user = await User.findById(req.params.id);

    if (!user) {
        throw new AppError(`User not found with id of ${req.params.id}`, 404);
    }

    // Update top-level fields
    if (email !== undefined) user.email = email;
    if (fullName !== undefined) user.fullName = fullName;
    if (companyName !== undefined) user.companyName = companyName;
    if (plan !== undefined) user.plan = plan;
    if (role !== undefined) user.role = role;

    // Merge settings if provided
    if (settings && typeof settings === 'object') {
        user.settings = {
            ...user.settings,
            ...settings
        };
    }

    await user.save();

    // Exclude password before sending response (optimization: lean() not possible here as we just saved document)
    const updatedUser = user.toObject();
    delete updatedUser.password;

    sendResponse(res, 200, { user: updatedUser });
});

// Delete user
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        throw new AppError(`User not found with id of ${req.params.id}`, 404);
    }

    await user.deleteOne();
    sendResponse(res, 200, {}, 'User deleted successfully');
});

module.exports = {
    getUsers,
    getUser,
    updateUser,
    deleteUser
};