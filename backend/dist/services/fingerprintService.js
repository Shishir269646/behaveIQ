"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../config/database");
const redis_1 = __importDefault(require("../config/redis"));
const AppError_1 = __importDefault(require("../utils/AppError"));
class FingerprintService {
    /**
     * Generate unique fingerprint hash
     */
    generateHash(components) {
        const data = JSON.stringify(components);
        return crypto_1.default.createHash('sha256').update(data).digest('hex');
    }
    /**
     * Identify or create user from fingerprint
     */
    async identifyUser(fingerprint, sessionData) {
        try {
            // Check Redis cache first
            const cachedUserId = await redis_1.default.get(`fp:${fingerprint}`);
            if (cachedUserId && typeof cachedUserId === 'string') {
                // Find by ID directly, as the cache holds the ID
                const user = await database_1.prisma.user.findUnique({
                    where: { id: cachedUserId },
                    include: { devices: true, behavior: true, personaInfo: true }
                });
                if (user) {
                    // Update last seen for the UserDevice record
                    await database_1.prisma.userDevice.updateMany({
                        where: { userId: user.id, fingerprint: fingerprint },
                        data: { lastSeen: new Date() }
                    });
                    return user;
                }
                else {
                    // User not found, clear cache and proceed as new
                    await redis_1.default.del(`fp:${fingerprint}`);
                }
            }
            // If user not found in cache or cache invalid, try to find a UserDevice
            const userDevice = await database_1.prisma.userDevice.findFirst({
                where: { fingerprint: fingerprint },
                include: { user: { include: { behavior: true, personaInfo: true } } }
            });
            if (userDevice && userDevice.user) {
                // Existing user based on device's userId
                // Update last seen for the UserDevice record
                await database_1.prisma.userDevice.update({
                    where: { id: userDevice.id },
                    data: { lastSeen: new Date() }
                });
                // Cache in Redis (24 hours)
                await redis_1.default.set(`fp:${fingerprint}`, userDevice.user.id, { ex: 86400 });
                return userDevice.user;
            }
            // If no existing user found via UserDevice, treat as new fingerprint for guest user
            let guestUser = await database_1.prisma.user.findUnique({
                where: { email: 'guest@behaveiq.com' },
                include: { devices: true, behavior: true, personaInfo: true }
            });
            if (!guestUser) {
                // Create a default guest user if it doesn't exist
                guestUser = await database_1.prisma.user.create({
                    data: {
                        email: 'guest@behaveiq.com',
                        password: crypto_1.default.randomBytes(32).toString('hex'),
                        fullName: 'Guest User',
                        role: 'user',
                    },
                    include: { devices: true, behavior: true, personaInfo: true }
                });
                // Create default behavior for the new guest user
                await database_1.prisma.userBehavior.create({ data: { userId: guestUser.id } });
            }
            // Robust approach to find or create device record
            let deviceRecord = await database_1.prisma.userDevice.findFirst({
                where: { fingerprint: fingerprint, userId: guestUser.id }
            });
            if (deviceRecord) {
                await database_1.prisma.userDevice.update({
                    where: { id: deviceRecord.id },
                    data: {
                        lastSeen: new Date(),
                        fpComponents: sessionData.fpComponents,
                        type: sessionData.deviceInfo?.type || 'unknown'
                    }
                });
            }
            else {
                await database_1.prisma.userDevice.create({
                    data: {
                        userId: guestUser.id,
                        fingerprint: fingerprint,
                        firstSeen: new Date(),
                        lastSeen: new Date(),
                        fpComponents: sessionData.fpComponents,
                        type: sessionData.deviceInfo?.type || 'unknown',
                    }
                });
            }
            // Cache the fingerprint to point to the GUEST user ID
            await redis_1.default.set(`fp:${fingerprint}`, guestUser.id, { ex: 86400 });
            return guestUser;
        }
        catch (error) {
            console.error('FingerprintService identifyUser error:', error);
            throw new AppError_1.default(`Fingerprint identification failed: ${error.message}`, 500);
        }
    }
    /**
     * Check fingerprint quality
     */
    validateFingerprint(components) {
        const required = ['canvas', 'webgl', 'fonts'];
        const missing = required.filter(key => !components[key]);
        if (missing.length > 0) {
            return { valid: false, missing };
        }
        return { valid: true, quality: 'high' };
    }
}
const fingerprintService = new FingerprintService();
exports.default = fingerprintService;
