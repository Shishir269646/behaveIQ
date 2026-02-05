

const User = require('../models/User');
const { asyncHandler } = require('../utils/helpers');

// Get all users


const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password');
    res.json({
        success: true,
        count: users.length,
        data: { users }
    });
});

// Get single user

const getUser = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
        return res.status(404).json({
            success: false,
            message: `User not found with id of ${req.params.id}`
        });
    }

    res.json({
        success: true,
        data: { user }
    });
});

// @desc    Update user

const updateUser = asyncHandler(async (req, res, next) => {
    const { email, fullName, companyName, plan, role, settings } = req.body;

    let user = await User.findById(req.params.id).select('+password');

    if (!user) {
        return res.status(404).json({
            success: false,
            message: `User not found with id of ${req.params.id}`
        });
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

    // Exclude password before sending response
    const updatedUser = await User.findById(user._id).select('-password');

    res.json({
        success: true,
        data: { user: updatedUser }
    });
});

//   Delete user

const deleteUser = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: `User not found with id of ${req.params.id}`
        });
    }

    await user.deleteOne();
    res.json({
        success: true,
        data: {}
    });
});

module.exports = {
    getUsers,
    getUser,
    updateUser,
    deleteUser
};