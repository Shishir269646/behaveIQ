// src/services/deviceStitchingService.js
const Device = require('../models/Device');
const User = require('../models/User');
const Session = require('../models/Session');

class DeviceStitchingService {
  // Stitch devices together
  async stitchDevices(fingerprint1, fingerprint2) {
    try {
      const device1 = await Device.findOne({ fingerprint: fingerprint1 });
      const device2 = await Device.findOne({ fingerprint: fingerprint2 });

      if (!device1 || !device2) {
        return { stitched: false, reason: 'device_not_found' };
      }

      // Check if already stitched
      if (device1.userId && device2.userId && 
          device1.userId.equals(device2.userId)) {
        return { stitched: true, reason: 'already_stitched' };
      }

      // Calculate stitching confidence
      const signals = await this.calculateStitchingSignals(device1, device2);
      const confidence = this.calculateStitchingConfidence(signals);

      if (confidence > 0.8) {
        // Perform stitching
        await this.mergeDevices(device1, device2, confidence);
        return { stitched: true, confidence, signals };
      }

      return { stitched: false, confidence, signals };
    } catch (error) {
      console.error('Device stitching error:', error);
      return { stitched: false, error: error.message };
    }
  }

  // Calculate stitching signals
  async calculateStitchingSignals(device1, device2) {
    // Check IP overlap
    const sameIP = this.checkIPOverlap(device1.sessions, device2.sessions);

    // Check temporal proximity
    const temporalProximity = this.checkTemporalProximity(device1.sessions, device2.sessions);

    // Check behavior similarity
    const behaviorSimilarity = await this.checkBehaviorSimilarity(
      device1.userId, 
      device2.userId
    );

    return {
      sameIP,
      temporalProximity,
      behaviorSimilarity
    };
  }

  checkIPOverlap(sessions1, sessions2) {
    const ips1 = new Set(sessions1.map(s => s.location?.ip).filter(Boolean));
    const ips2 = new Set(sessions2.map(s => s.location?.ip).filter(Boolean));
    
    const overlap = [...ips1].filter(ip => ips2.has(ip));
    return overlap.length > 0;
  }

  checkTemporalProximity(sessions1, sessions2) {
    // Check if sessions happened close in time (within 1 hour)
    const threshold = 3600000; // 1 hour in ms

    for (let s1 of sessions1) {
      for (let s2 of sessions2) {
        const timeDiff = Math.abs(s1.timestamp - s2.timestamp);
        if (timeDiff < threshold) {
          return true;
        }
      }
    }
    return false;
  }

  async checkBehaviorSimilarity(userId1, userId2) {
    if (!userId1 || !userId2) return false;

    const sessions1 = await Session.find({ userId: userId1 }).limit(10);
    const sessions2 = await Session.find({ userId: userId2 }).limit(10);

    // Simple similarity check based on page views
    const pages1 = new Set(
      sessions1.flatMap(s => s.behavior.pageViews.map(p => p.url))
    );
    const pages2 = new Set(
      sessions2.flatMap(s => s.behavior.pageViews.map(p => p.url))
    );

    const overlap = [...pages1].filter(page => pages2.has(page));
    const similarity = overlap.length / Math.max(pages1.size, pages2.size);

    return similarity > 0.3; // 30% overlap
  }

  calculateStitchingConfidence(signals) {
    let score = 0;
    if (signals.sameIP) score += 0.4;
    if (signals.temporalProximity) score += 0.3;
    if (signals.behaviorSimilarity) score += 0.3;
    return score;
  }

  async mergeDevices(device1, device2, confidence) {
    // Choose master device (one with userId or older one)
    const masterDevice = device1.userId ? device1 : 
                        device2.userId ? device2 : 
                        device1.firstSeen < device2.firstSeen ? device1 : device2;
    
    const slaveDevice = masterDevice === device1 ? device2 : device1;

    // Get or create master user
    let masterUser;
    if (masterDevice.userId) {
      masterUser = await User.findById(masterDevice.userId);
    } else {
      masterUser = await User.create({
        fingerprint: masterDevice.fingerprint,
        devices: [],
        lastActive: new Date()
      });
      masterDevice.userId = masterUser._id;
    }

    // Update slave device
    slaveDevice.userId = masterUser._id;
    slaveDevice.stitchedWith.push({
      fingerprint: masterDevice.fingerprint,
      confidence,
      stitchedAt: new Date()
    });

    // Update master device
    masterDevice.stitchedWith.push({
      fingerprint: slaveDevice.fingerprint,
      confidence,
      stitchedAt: new Date()
    });

    // Add slave device to master user's devices
    masterUser.devices.push({
      fingerprint: slaveDevice.fingerprint,
      type: slaveDevice.deviceInfo.type,
      firstSeen: slaveDevice.firstSeen,
      lastSeen: slaveDevice.lastSeen
    });

    // Merge sessions
    await Session.updateMany(
      { userId: slaveDevice.userId },
      { $set: { userId: masterUser._id } }
    );

    await masterDevice.save();
    await slaveDevice.save();
    await masterUser.save();

    return masterUser;
  }
}

module.exports = new DeviceStitchingService();