const crypto = require('crypto');
const { prisma } = require('../config/database'); // Import prisma client
const redis = require('../config/redis');
const AppError = require('../utils/AppError');

class FingerprintService {
  // Generate unique fingerprint hash
  generateHash(components) {
    const data = JSON.stringify(components);
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Identify or create user from fingerprint
  async identifyUser(fingerprint, sessionData) {
    try {
        // Check Redis cache first
        const cachedUserId = await redis.get(`fp:${fingerprint}`);
        if (cachedUserId) {
            // Find by ID directly, as the cache holds the ID
            const user = await prisma.user.findUnique({
                where: { id: cachedUserId },
                include: { devices: true, behavior: true, personaInfo: true } // Include necessary relations
            });
            if (user) { // Ensure user still exists
                // Update last seen for the UserDevice record
                await prisma.userDevice.updateMany({ // updateMany because fingerprint might not be unique by itself if user can have multiple devices with same FP
                    where: { userId: user.id, fingerprint: fingerprint },
                    data: { lastSeen: new Date() }
                });
                return user;
            } else {
                // User not found, clear cache and proceed as new
                await redis.del(`fp:${fingerprint}`);
            }
        }
  
        // If user not found in cache or cache invalid, try to find a UserDevice
        let userDevice = await prisma.userDevice.findFirst({
            where: { fingerprint: fingerprint },
            include: { user: { include: { behavior: true, personaInfo: true } } } // Include user and its relations
        });
  
        if (userDevice && userDevice.user) {
            // Existing user based on device's userId
            // Update last seen for the UserDevice record
            await prisma.userDevice.update({
                where: { id: userDevice.id }, // Use device ID for unique update
                data: { lastSeen: new Date() }
            });
            // Cache in Redis (24 hours)
            await redis.setex(`fp:${fingerprint}`, 86400, userDevice.user.id);
            return userDevice.user;
        }
  
        // If no existing user found via UserDevice (or user link broken), treat as new fingerprint for guest user
        let guestUser = await prisma.user.findUnique({
            where: { email: 'guest@behaveiq.com' },
            include: { devices: true, behavior: true, personaInfo: true }
        });

        if (!guestUser) {
            // Create a default guest user if it doesn't exist
            guestUser = await prisma.user.create({
                data: {
                    email: 'guest@behaveiq.com',
                    password: crypto.randomBytes(32).toString('hex'), // Secure random password
                    fullName: 'Guest User',
                    role: 'user', // Default role for guest
                    // Other fields will take their defaults
                },
                include: { devices: true, behavior: true, personaInfo: true }
            });
            // Create default behavior for the new guest user
            await prisma.userBehavior.create({ data: { userId: guestUser.id } });
        }
  
        // Create or update the UserDevice record
        const createdOrUpdatedDevice = await prisma.userDevice.upsert({
            where: {
                // Assuming unique compound index { userId, fingerprint } or a unique `id`
                // If fingerprint is not unique globally, we need to consider how to upsert.
                // For a new device, we'll create. For an existing, we'll update.
                // Since this path means no userDevice was found with this fingerprint OR it was unlinked,
                // we'll try to create a new one linking to guestUser.
                // To handle potential existing unlinked devices with the same FP, findFirst is better than direct upsert by unique field.
                fingerprint: fingerprint, // This needs to be a unique field for 'where' in upsert.
                // Since fingerprint might not be globally unique, let's find or create.
                id: 'clue' // Placeholder for unique ID, this needs refinement
            },
            update: {
                userId: guestUser.id,
                lastSeen: new Date(),
                fpComponents: sessionData.fpComponents,
                type: sessionData.deviceInfo?.type || 'unknown',
            },
            create: {
                userId: guestUser.id,
                fingerprint: fingerprint,
                firstSeen: new Date(),
                lastSeen: new Date(),
                fpComponents: sessionData.fpComponents,
                type: sessionData.deviceInfo?.type || 'unknown',
            }
        });

        // The above upsert strategy for UserDevice needs careful consideration if fingerprint isn't globally unique.
        // A more robust approach:
        let deviceRecord = await prisma.userDevice.findFirst({
            where: { fingerprint: fingerprint, userId: guestUser.id }
        });

        if (deviceRecord) {
            deviceRecord = await prisma.userDevice.update({
                where: { id: deviceRecord.id },
                data: { lastSeen: new Date(), fpComponents: sessionData.fpComponents, type: sessionData.deviceInfo?.type || 'unknown' }
            });
        } else {
            deviceRecord = await prisma.userDevice.create({
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
        await redis.setex(`fp:${fingerprint}`, 86400, guestUser.id);
  
        return guestUser;
  
      } catch (error) {
        console.error('FingerprintService identifyUser error:', error);
        throw new AppError(`Fingerprint identification failed: ${error.message}`, 500);
      }
  }

  // Check fingerprint quality
  validateFingerprint(components) {
    const required = ['canvas', 'webgl', 'fonts'];
    const missing = required.filter(key => !components[key]);

    if (missing.length > 0) {
      return { valid: false, missing };
    }

    return { valid: true, quality: 'high' };
  }
}

module.exports = new FingerprintService();