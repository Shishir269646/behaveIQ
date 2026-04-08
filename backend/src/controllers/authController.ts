import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { asyncHandler } from '../utils/helpers';
import { sendResponse } from '../utils/responseHandler';
import AppError from '../utils/AppError';
import { JWT_SECRET, JWT_EXPIRE } from '../config/env';
import { AuthenticatedRequest } from '../types';

/**
 * Helper to generate JWT token
 */
const getSignedJwtToken = (id: string, role: string): string => {
    return jwt.sign({ id, role }, JWT_SECRET as string, {
        expiresIn: JWT_EXPIRE as any
    });
};

/**
 * Register user
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
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

    // Generate token
    const token = getSignedJwtToken(user.id, user.role);

    sendResponse(res, 201, {
        user,
        token
    });
});

/**
 * Login user
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
        where: { email },
        include: { settings: true }
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

/**
 * Get current user
 */
export const getMe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
        throw new AppError('Not authorized', 401);
    }

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

/**
 * Logout
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    sendResponse(res, 200, {}, 'Logged out successfully');
});
