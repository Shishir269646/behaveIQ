const { asyncHandler } = require('../utils/helpers');
const { sendResponse } = require('../utils/responseHandler');
const AppError = require('../utils/AppError');
const { prisma } = require('../config/database'); // Import prisma client

// Get all users
const getUsers = asyncHandler(async (req, res) => {
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
            devices: true,
            personaInfo: true,
            emotionalProfile: true,
            intentScore: true,
            fraudScore: true,
            discounts: true,
            behavior: true,
            createdAt: true,
            updatedAt: true,
            lastActive: true,
        }
    });
    sendResponse(res, 200, { users, count: users.length });
});

// Get single user
const getUser = asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.params.id },
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
            devices: true,
            personaInfo: true,
            emotionalProfile: true,
            intentScore: true,
            fraudScore: true,
            discounts: true,
            behavior: true,
            createdAt: true,
            updatedAt: true,
            lastActive: true,
        }
    });

    if (!user) {
        throw new AppError(`User not found with id of ${req.params.id}`, 404);
    }

    sendResponse(res, 200, { user });
});

// Update user
const updateUser = asyncHandler(async (req, res) => {
    const { email, fullName, companyName, plan, role, settings, ...rest } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { id: req.params.id },
        include: { settings: true }, // Include settings to merge
    });

    if (!existingUser) {
        throw new AppError(`User not found with id of ${req.params.id}`, 404);
    }

    let updatedUserData = {};
    if (email !== undefined) updatedUserData.email = email;
    if (fullName !== undefined) updatedUserData.fullName = fullName;
    if (companyName !== undefined) updatedUserData.companyName = companyName;
    if (plan !== undefined) updatedUserData.plan = plan;
    if (role !== undefined) updatedUserData.role = role;
    // ... handle other top-level fields

    let updatedSettingsData = {};
    if (settings && typeof settings === 'object') {
        updatedSettingsData = {
            twoFactorEnabled: settings.twoFactorEnabled !== undefined ? settings.twoFactorEnabled : existingUser.settings?.twoFactorEnabled,
            emailNotificationsEnabled: settings.emailNotificationsEnabled !== undefined ? settings.emailNotificationsEnabled : existingUser.settings?.emailNotificationsEnabled,
            pushNotificationsEnabled: settings.pushNotificationsEnabled !== undefined ? settings.pushNotificationsEnabled : existingUser.settings?.pushNotificationsEnabled,
        };
    }

    const updatedUser = await prisma.user.update({
        where: { id: req.params.id },
        data: {
            ...updatedUserData,
            settings: {
                update: updatedSettingsData,
            },
            // Note: Handling nested updates for other models like personaInfo, emotionalProfile, etc.
            // will require similar logic depending on the relationship type (create, update, connect, disconnect)
        },
        select: { // Select all fields except password
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
            devices: true,
            personaInfo: true,
            emotionalProfile: true,
            intentScore: true,
            fraudScore: true,
            discounts: true,
            behavior: true,
            createdAt: true,
            updatedAt: true,
            lastActive: true,
        }
    });

    sendResponse(res, 200, { user: updatedUser });
});

// Delete user
const deleteUser = asyncHandler(async (req, res) => {
    // Check if user exists before attempting to delete
    const existingUser = await prisma.user.findUnique({
        where: { id: req.params.id },
    });

    if (!existingUser) {
        throw new AppError(`User not found with id of ${req.params.id}`, 404);
    }

    await prisma.user.delete({
        where: { id: req.params.id },
    });

    sendResponse(res, 200, {}, 'User deleted successfully');
});

module.exports = {
    getUsers,
    getUser,
    updateUser,
    deleteUser
};