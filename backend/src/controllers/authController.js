const { asyncHandler } = require('../utils/helpers');
const { sendResponse } = require('../utils/responseHandler');
const AppError = require('../utils/AppError');
const { prisma } = require('../config/database'); // Import prisma client
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRE } = require('../config/env');

// Helper to generate JWT token
const getSignedJwtToken = (id, role) => {
    return jwt.sign({ id, role }, JWT_SECRET, {
        expiresIn: JWT_EXPIRE
    });
};

// Register user
const register = asyncHandler(async (req, res) => {
    const { email, password, fullName, companyName } = req.body;

    // Check if user exists
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
        throw new AppError('User already exists with this email', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            fullName,
            companyName
        },
        select: { // Select all fields except password
            id: true,
            email: true,
            fullName: true,
            companyName: true,
            plan: true,
            role: true,
            settings: true,
        }
    });

    // Generate token
    const token = getSignedJwtToken(user.id, user.role);

    sendResponse(res, 201, {
        user,
        token
    });
});

//  Login user
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user, explicitly including the password for comparison
    const user = await prisma.user.findUnique({
        where: { email },
        include: { settings: true } // Include settings to match original response
    });

    if (!user) {
        throw new AppError('Invalid credentials', 401);
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new AppError('Invalid credentials', 401);
    }

    // Update last login
    await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
    });

    // Generate token
    const token = getSignedJwtToken(user.id, user.role);

    sendResponse(res, 200, {
        user: {
            id: user.id,
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
    // req.user is populated by the auth middleware, which will need to be updated as well.
    // For now, assuming req.user contains the necessary Prisma User object (without password)
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        companyName: true,
        plan: true,
        role: true,
        settings: true,
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    sendResponse(res, 200, { user });
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