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
        return await User.findById(cachedUserId);
      }

      // Check if device exists
      let device = await Device.findOne({ fingerprint });
      
      if (device && device.userId) {
        // Existing user
        const user = await User.findById(device.userId);
        
        // Update last seen
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
        // New fingerprint - associate with the generic guest user
        const guestUser = await User.findOne({ email: 'guest@behaveiq.com' });
        if (!guestUser) {
            // This is a fallback for when the guest user doesn't exist.
            // In a real scenario, the user should be seeded.
            throw new Error('Critical: The default guest user (guest@behaveiq.com) was not found. Please seed the database.');
        }

        // Update the guest user's device list
        const deviceExists = guestUser.devices.some(d => d.fingerprint === fingerprint);
        if (deviceExists) {
            await User.updateOne(
                { _id: guestUser._id, 'devices.fingerprint': fingerprint },
                { $set: { 'devices.$.lastSeen': new Date() } }
            );
        } else {
            await User.updateOne(
                { _id: guestUser._id },
                {
                    $push: {
                        devices: {
                            fingerprint,
                            type: deviceInfo.type,
                            firstSeen: new Date(),
                            lastSeen: new Date()
                        }
                    }
                }
            );
        }

        // Create the separate Device record
        await Device.create({
          fingerprint,
          userId: guestUser._id,
          deviceInfo,
          fpComponents: sessionData.fpComponents,
          sessions: [{
            sessionId: sessionData.sessionId,
            timestamp: new Date(),
            location: sessionData.location
          }],
          firstSeen: new Date(),
          lastSeen: new Date()
        });

        // Cache the fingerprint to point to the GUEST user ID
        await redis.setex(`fp:${fingerprint}`, 86400, guestUser._id.toString());

        return guestUser;
      }
    } catch (error) {
      throw new Error(`Fingerprint identification failed: ${error.message}`);
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