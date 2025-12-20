const User = require('../models/User');
const { asyncHandler } = require('../utils/helpers');

// @desc    Register user
// @route   POST /api/v1/auth/register
exports.register = asyncHandler(async (req, res) => {
    const { email, password, fullName, companyName } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({
            success: false,
            message: 'User already exists with this email'
        });
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

    res.status(201).json({
        success: true,
        data: {
            user: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                companyName: user.companyName,
                plan: user.plan
            },
            token
        }
    });
});

// @desc    Login user
// @route   POST /api/v1/auth/login
exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = user.getSignedJwtToken();

    res.json({
        success: true,
        data: {
            user: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                companyName: user.companyName,
                plan: user.plan
            },
            token
        }
    });
});

// @desc    Get current user
// @route   GET /api/v1/auth/me
exports.getMe = asyncHandler(async (req, res) => {
    res.json({
        success: true,
        data: {
            user: req.user
        }
    });
});

// @desc    Logout
// @route   POST /api/v1/auth/logout
exports.logout = asyncHandler(async (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});
