const User = require('../models/User');
const { asyncHandler } = require('../utils/helpers');

// @desc    Register user
// @route   POST /api/v1/auth/register
const register = asyncHandler(async (req, res) => {
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
                plan: user.plan,
                role: user.role,
                settings: user.settings // New
            },
            token
        }
    });
});

// @desc    Login user
// @route   POST /api/v1/auth/login
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    console.log('Login attempt for email:', email);
    console.log('Password received (plaintext - for debug only, be cautious in production):', password);


    // Find user with password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        console.warn('Login failed: User not found for email:', email);
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }

    console.log('User found:', user._id);
    console.log('Stored hashed password:', user.password);

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
        console.warn('Login failed: Password mismatch for user:', email);
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }

    console.log('Login successful for user:', email);

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
                plan: user.plan,
                role: user.role,
                settings: user.settings // New
            },
            token
        }
    });
});

// @desc    Get current user
// @route   GET /api/v1/auth/me
const getMe = asyncHandler(async (req, res) => {
    res.json({
        success: true,
        data: {
            user: req.user
        }
    });
});

// @desc    Logout
// @route   POST /api/v1/auth/logout
const logout = asyncHandler(async (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});




module.exports = {
    register,
    login,
    getMe,
    logout
};
