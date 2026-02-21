const User = require('../models/User');
const { asyncHandler } = require('../utils/helpers');
const { sendResponse } = require('../utils/responseHandler');
const AppError = require('../utils/AppError');

// Register user
const register = asyncHandler(async (req, res) => {
    const { email, password, fullName, companyName } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email }).lean();
    if (userExists) {
        throw new AppError('User already exists with this email', 400);
    }

    // Create user
    const user = await User.create({
        email,
        password,
        fullName,
        companyName
    });

    // Generate token
    const token = user.getSignedJwtToken();

    sendResponse(res, 201, {
        user: {
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            companyName: user.companyName,
            plan: user.plan,
            role: user.role,
            settings: user.settings
        },
        token
    });
});

//  Login user
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        throw new AppError('Invalid credentials', 401);
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
        throw new AppError('Invalid credentials', 401);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = user.getSignedJwtToken();

    sendResponse(res, 200, {
        user: {
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            companyName: user.companyName,
            plan: user.plan,
            role: user.role,
            settings: user.settings
        },
        token
    });
});

//  Get current user
const getMe = asyncHandler(async (req, res) => {
    sendResponse(res, 200, {
        user: req.user
    });
});

//  Logout
const logout = asyncHandler(async (req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    sendResponse(res, 200, {}, 'Logged out successfully');
});

module.exports = {
    register,
    login,
    getMe,
    logout
};