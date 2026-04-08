"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getUser = exports.getUsers = void 0;
const helpers_1 = require("../utils/helpers");
const responseHandler_1 = require("../utils/responseHandler");
const AppError_1 = __importDefault(require("../utils/AppError"));
const database_1 = require("../config/database");
/**
 * Get all users
 */
exports.getUsers = (0, helpers_1.asyncHandler)(async (req, res) => {
    const users = await database_1.prisma.user.findMany({
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
    (0, responseHandler_1.sendResponse)(res, 200, { users, count: users.length });
});
/**
 * Get single user
 */
exports.getUser = (0, helpers_1.asyncHandler)(async (req, res) => {
    const id = req.params.id;
    const user = await database_1.prisma.user.findUnique({
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
        throw new AppError_1.default(`User not found with id of ${id}`, 404);
    }
    (0, responseHandler_1.sendResponse)(res, 200, { user });
});
/**
 * Update user
 */
exports.updateUser = (0, helpers_1.asyncHandler)(async (req, res) => {
    const id = req.params.id;
    const { email, fullName, companyName, plan, role, settings } = req.body;
    const existingUser = await database_1.prisma.user.findUnique({
        where: { id: id },
        include: { settings: true },
    });
    if (!existingUser) {
        throw new AppError_1.default(`User not found with id of ${id}`, 404);
    }
    const updatedUserData = {};
    if (email !== undefined)
        updatedUserData.email = email;
    if (fullName !== undefined)
        updatedUserData.fullName = fullName;
    if (companyName !== undefined)
        updatedUserData.companyName = companyName;
    if (plan !== undefined)
        updatedUserData.plan = plan;
    if (role !== undefined)
        updatedUserData.role = role;
    const updatedSettingsData = {};
    if (settings && typeof settings === 'object') {
        if (settings.twoFactorEnabled !== undefined)
            updatedSettingsData.twoFactorEnabled = settings.twoFactorEnabled;
        if (settings.emailNotificationsEnabled !== undefined)
            updatedSettingsData.emailNotificationsEnabled = settings.emailNotificationsEnabled;
        if (settings.pushNotificationsEnabled !== undefined)
            updatedSettingsData.pushNotificationsEnabled = settings.pushNotificationsEnabled;
    }
    const updatedUser = await database_1.prisma.user.update({
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
    (0, responseHandler_1.sendResponse)(res, 200, { user: updatedUser });
});
/**
 * Delete user
 */
exports.deleteUser = (0, helpers_1.asyncHandler)(async (req, res) => {
    const id = req.params.id;
    const existingUser = await database_1.prisma.user.findUnique({
        where: { id: id },
    });
    if (!existingUser) {
        throw new AppError_1.default(`User not found with id of ${id}`, 404);
    }
    await database_1.prisma.user.delete({
        where: { id: id },
    });
    (0, responseHandler_1.sendResponse)(res, 200, {}, 'User deleted successfully');
});
