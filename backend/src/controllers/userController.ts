import { Request, Response } from 'express';
import { asyncHandler } from '../utils/helpers';
import { sendResponse } from '../utils/responseHandler';
import AppError from '../utils/AppError';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../types';

/**
 * Get all users
 */
export const getUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            fullName: true,
            companyName: true,
            plan: true,
            role: true,
            settings: {
                select: {
                    twoFactorEnabled: true,
                    emailNotificationsEnabled: true,
                    pushNotificationsEnabled: true,
                }
            },
            lastLogin: true,
            fingerprint: true,
            createdAt: true,
            updatedAt: true,
            lastActive: true,
        }
    });
    sendResponse(res, 200, { users, count: users.length });
});

/**
 * Get single user
 */
export const getUser = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({
        where: { id: id },
        select: {
            id: true,
            email: true,
            fullName: true,
            companyName: true,
            plan: true,
            role: true,
            settings: {
                select: {
                    twoFactorEnabled: true,
                    emailNotificationsEnabled: true,
                    pushNotificationsEnabled: true,
                }
            },
            lastLogin: true,
            fingerprint: true,
            createdAt: true,
            updatedAt: true,
            lastActive: true,
        }
    });

    if (!user) {
        throw new AppError(`User not found with id of ${id}`, 404);
    }

    sendResponse(res, 200, { user });
});

/**
 * Update user
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { email, fullName, companyName, plan, role, settings } = req.body;

    const existingUser = await prisma.user.findUnique({
        where: { id: id },
        include: { settings: true },
    });

    if (!existingUser) {
        throw new AppError(`User not found with id of ${id}`, 404);
    }

    const updatedUserData: any = {};
    if (email !== undefined) updatedUserData.email = email;
    if (fullName !== undefined) updatedUserData.fullName = fullName;
    if (companyName !== undefined) updatedUserData.companyName = companyName;
    if (plan !== undefined) updatedUserData.plan = plan;
    if (role !== undefined) updatedUserData.role = role;

    const updatedSettingsData: any = {};
    if (settings && typeof settings === 'object') {
        if (settings.twoFactorEnabled !== undefined) updatedSettingsData.twoFactorEnabled = settings.twoFactorEnabled;
        if (settings.emailNotificationsEnabled !== undefined) updatedSettingsData.emailNotificationsEnabled = settings.emailNotificationsEnabled;
        if (settings.pushNotificationsEnabled !== undefined) updatedSettingsData.pushNotificationsEnabled = settings.pushNotificationsEnabled;
    }

    const updatedUser = await prisma.user.update({
        where: { id: id },
        data: {
            ...updatedUserData,
            settings: Object.keys(updatedSettingsData).length > 0 ? {
                upsert: {
                    create: updatedSettingsData,
                    update: updatedSettingsData
                }
            } : undefined,
        },
        select: {
            id: true,
            email: true,
            fullName: true,
            companyName: true,
            plan: true,
            role: true,
            settings: {
                select: {
                    twoFactorEnabled: true,
                    emailNotificationsEnabled: true,
                    pushNotificationsEnabled: true,
                }
            },
            lastLogin: true,
            fingerprint: true,
            createdAt: true,
            updatedAt: true,
            lastActive: true,
        }
    });

    sendResponse(res, 200, { user: updatedUser });
});

/**
 * Delete user
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const existingUser = await prisma.user.findUnique({
        where: { id: id },
    });

    if (!existingUser) {
        throw new AppError(`User not found with id of ${id}`, 404);
    }

    await prisma.user.delete({
        where: { id: id },
    });

    sendResponse(res, 200, {}, 'User deleted successfully');
});
