const User = require('../models/User');
const { asyncHandler } = require('../utils/helpers');

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password'); // Exclude password from results
    res.json({
        success: true,
        count: users.length,
        data: { users }
    });
});

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private/Admin
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
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res, next) => {
    const { email, fullName, companyName, plan, role, settings } = req.body; // Added settings

    let user = await User.findById(req.params.id).select('+password'); // Fetch user to merge settings

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
            ...user.settings, // Preserve existing settings
            ...settings       // Merge new settings
        };
    }

    await user.save(); // Save the updated user

    // Exclude password before sending response
    const updatedUser = await User.findById(user._id).select('-password');

    res.json({
        success: true,
        data: { user: updatedUser }
    });
});

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: `User not found with id of ${req.params.id}`
        });
    }

    await user.deleteOne(); // Use deleteOne() to trigger middleware if any

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
