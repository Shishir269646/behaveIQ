// src/services/fingerprintService.js
const crypto = require('crypto');
const Device = require('../models/Device');
const User = require('../models/User');
const redis = require('../config/redis');

class FingerprintService {
  // Generate unique fingerprint hash
  generateHash(components) {
    const data = JSON.stringify(components);
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Identify or create user from fingerprint
  async identifyUser(fingerprint, deviceInfo, sessionData) {
    try {
            // Check Redis cache first
            const cachedUserId = await redis.get(`fp:${fingerprint}`);
            if (cachedUserId) {
              // Find by ID directly, as the cache holds the ID
              const user = await User.findById(cachedUserId);
              if (user) { // Ensure user still exists
                  // Update last seen for the device in the user's devices array
                  await User.updateOne(
                      { _id: user._id, 'devices.fingerprint': fingerprint },
                      { '$set': { 'devices.$.lastSeen': new Date() } }
                  );
                  // Also update the standalone Device record
                  await Device.findOneAndUpdate(
                      { fingerprint: fingerprint },
                      { $set: { lastSeen: new Date() }, $push: { sessions: { sessionId: sessionData.sessionId, timestamp: new Date(), location: sessionData.location } } },
                      { new: true }
                  );
                  return user;
              } else {
                  // User not found, clear cache and proceed as new
                  await redis.del(`fp:${fingerprint}`);
              }
            }
      
            // If user not found in cache or cache invalid, check if device exists
            let device = await Device.findOne({ fingerprint });
      
            if (device && device.userId) {
              // Existing user based on device's userId
              const user = await User.findById(device.userId);
              if (user) {
                  // Update last seen for the device in the user's devices array
                  await User.updateOne(
                      { _id: user._id, 'devices.fingerprint': fingerprint },
                      { '$set': { 'devices.$.lastSeen': new Date() } }
                  );
                  // Update standalone Device record
                  device.lastSeen = new Date();
                  device.sessions.push({
                      sessionId: sessionData.sessionId,
                      timestamp: new Date(),
                      location: sessionData.location
                  });
                  await device.save();
      
                  // Cache in Redis (24 hours)
                  await redis.setex(`fp:${fingerprint}`, 86400, user._id.toString());
                  return user;
              } else {
                  // Device exists but linked user doesn't. This indicates data inconsistency.
                  // Option 1: Cleanup device (remove userId, let it be reassigned)
                  // Option 2: Treat as new fingerprint and potentially create a new user.
                  // For now, let's treat it as if userId didn't exist, will create a new one below for guest.
                  device.userId = undefined; // Clear broken link
                  await device.save();
              }
            }
      
            // If no existing user found (or user link broken), treat as new fingerprint for guest user
            const guestUser = await User.findOne({ email: 'guest@behaveiq.com' });
            if (!guestUser) {
                throw new Error('Critical: The default guest user (guest@behaveiq.com) was not found. Please seed the database.');
            }
      
            const deviceToPush = {
                fingerprint,
                type: deviceInfo.type,
                firstSeen: new Date(),
                lastSeen: new Date()
            };
      
            // Directly manipulate the devices array in memory and save
            // This bypasses the $push operator which seems to be causing CastError
            let userFoundInGuestDevices = false;
            for (let i = 0; i < guestUser.devices.length; i++) {
                if (guestUser.devices[i].fingerprint === fingerprint) {
                    guestUser.devices[i].lastSeen = new Date();
                    userFoundInGuestDevices = true;
                    break;
                }
            }
            if (!userFoundInGuestDevices) {
                guestUser.devices.push(deviceToPush);
            }
            await guestUser.save(); // Save the guest user with updated devices array
      
            // Create or update the separate Device record
            await Device.findOneAndUpdate(
                { fingerprint },
                {
                    userId: guestUser._id,
                    deviceInfo,
                    fpComponents: sessionData.fpComponents,
                    $push: {
                        sessions: {
                            sessionId: sessionData.sessionId,
                            timestamp: new Date(),
                            location: sessionData.location
                        }
                    },
                    $setOnInsert: { firstSeen: new Date() }, // Set firstSeen only on insert
                    lastSeen: new Date()
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
      
            // Cache the fingerprint to point to the GUEST user ID
            await redis.setex(`fp:${fingerprint}`, 86400, guestUser._id.toString());
      
            return guestUser;
      
          } catch (error) {
            console.error('FingerprintService identifyUser error:', error); // Log the actual error
            throw new Error(`Fingerprint identification failed: ${error.message}`);
          }
  } // Closing brace for identifyUser()

  // Check fingerprint quality
  validateFingerprint(components) {
    const required = ['canvas', 'webgl', 'fonts'];
    const missing = required.filter(key => !components[key]);

    if (missing.length > 0) {
      return { valid: false, missing };
    }

    return { valid: true, quality: 'high' };
  }
} // Closing brace for class FingerprintService

module.exports = new FingerprintService();