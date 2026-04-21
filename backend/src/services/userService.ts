import { prisma } from '../config/database';
import AppError from '../utils/AppError';
import { UserRole, Plan } from '@prisma/client';

// Define a common select object for user data to avoid password exposure
const userSelect = {
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
};

/**
 * Get all users
 */
export const getAllUsers = async () => {
    return prisma.user.findMany({ select: userSelect });
};

/**
 * Get a single user by ID
 */
export const getUserById = async (id: string) => {
    const user = await prisma.user.findUnique({
        where: { id: id },
        select: userSelect,
    });

    if (!user) {
        throw new AppError(`User not found with id of ${id}`, 404);
    }
    return user;
};

/**
 * Update user details
 */
export const updateUser = async (id: string, updateData: any) => {
    const existingUser = await prisma.user.findUnique({
        where: { id: id },
        include: { settings: true },
    });

    if (!existingUser) {
        throw new AppError(`User not found with id of ${id}`, 404);
    }

    const { email, fullName, companyName, plan, role, settings } = updateData;

    const userData: any = {};
    if (email !== undefined) userData.email = email;
    if (fullName !== undefined) userData.fullName = fullName;
    if (companyName !== undefined) userData.companyName = companyName;
    if (plan !== undefined) userData.plan = plan;
    if (role !== undefined) userData.role = role;

    const settingsData: any = {};
    if (settings && typeof settings === 'object') {
        if (settings.twoFactorEnabled !== undefined) settingsData.twoFactorEnabled = settings.twoFactorEnabled;
        if (settings.emailNotificationsEnabled !== undefined) settingsData.emailNotificationsEnabled = settings.emailNotificationsEnabled;
        if (settings.pushNotificationsEnabled !== undefined) settingsData.pushNotificationsEnabled = settings.pushNotificationsEnabled;
    }

    const updatedUser = await prisma.user.update({
        where: { id: id },
        data: {
            ...userData,
            settings: Object.keys(settingsData).length > 0 ? {
                upsert: {
                    create: settingsData,
                    update: settingsData
                }
            } : undefined,
        },
        select: userSelect,
    });

    return updatedUser;
};

/**
 * Delete a user
 */
export const deleteUser = async (id: string) => {
    const existingUser = await prisma.user.findUnique({
        where: { id: id },
    });

    if (!existingUser) {
        throw new AppError(`User not found with id of ${id}`, 404);
    }

    await prisma.user.delete({
        where: { id: id },
    });
    return { message: 'User deleted successfully' };
};
