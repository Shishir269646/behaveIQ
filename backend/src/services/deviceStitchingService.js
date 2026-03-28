// src/services/deviceStitchingService.js
const { prisma } = require('../config/database'); // Import prisma client
const AppError = require('../utils/AppError');

class DeviceStitchingService {
  // Stitch devices together
  async stitchDevices(fingerprint1, fingerprint2) {
    try {
      // Find devices and their associated users
      const device1 = await prisma.userDevice.findFirst({
        where: { fingerprint: fingerprint1 },
        include: { user: true }
      });
      const device2 = await prisma.userDevice.findFirst({
        where: { fingerprint: fingerprint2 },
        include: { user: true }
      });

      if (!device1 || !device2) {
        return { stitched: false, reason: 'device_not_found' };
      }

      // Check if already stitched (same user)
      if (device1.userId && device2.userId &&
          device1.userId === device2.userId) { // Compare Prisma IDs
        return { stitched: true, reason: 'already_stitched' };
      }

      // Fetch sessions for each device's user to calculate signals
      const sessions1 = device1.userId ? await prisma.session.findMany({
        where: { userId: device1.userId },
        include: { locationInfo: true }, // Include location for IP overlap
        take: 100 // Limit for performance
      }) : [];
      const sessions2 = device2.userId ? await prisma.session.findMany({
        where: { userId: device2.userId },
        include: { locationInfo: true },
        take: 100
      }) : [];

      // Calculate stitching confidence
      const signals = this.calculateStitchingSignals(sessions1, sessions2);
      const confidence = this.calculateStitchingConfidence(signals);

      if (confidence > 0.8) {
        // Perform stitching
        const masterUser = await this.mergeDevices(device1, device2, confidence);
        return { stitched: true, confidence, signals, masterUser };
      }

      return { stitched: false, confidence, signals };
    } catch (error) {
      console.error('Device stitching error:', error);
      throw new AppError('Device stitching failed', 500);
    }
  }

  // Calculate stitching signals
  calculateStitchingSignals(sessions1, sessions2) {
    const sameIP = this.checkIPOverlap(sessions1, sessions2);
    const temporalProximity = this.checkTemporalProximity(sessions1, sessions2);
    // Behavior similarity requires user IDs, not directly sessions here
    // We'll need to pass user IDs to the behaviorSimilarity check if it's based on aggregated behavior
    // For now, let's keep it simple and base it on session data passed.
    // The original Mongoose method was `checkBehaviorSimilarity(device1.userId, device2.userId)`
    // This part will require the users to be explicitly fetched or passed.
    // For now, returning false, this needs a more complex query for actual behavior similarity
    const behaviorSimilarity = false; // Placeholder

    return {
      sameIP,
      temporalProximity,
      behaviorSimilarity
    };
  }

  checkIPOverlap(sessions1, sessions2) {
    const ips1 = new Set(sessions1.map(s => s.locationInfo?.ip).filter(Boolean));
    const ips2 = new Set(sessions2.map(s => s.locationInfo?.ip).filter(Boolean));
    
    const overlap = [...ips1].filter(ip => ips2.has(ip));
    return overlap.length > 0;
  }

  checkTemporalProximity(sessions1, sessions2) {
    // Check if sessions happened close in time (within 1 hour)
    const threshold = 3600000; // 1 hour in ms

    for (let s1 of sessions1) {
      for (let s2 of sessions2) {
        // Use getTime() for Date objects comparison
        const timeDiff = Math.abs(s1.createdAt.getTime() - s2.createdAt.getTime()); // Assuming createdAt for session start
        if (timeDiff < threshold) {
          return true;
        }
      }
    }
    return false;
  }

  async checkBehaviorSimilarity(userId1, userId2) {
    if (!userId1 || !userId2) return false;

    const sessions1 = await prisma.session.findMany({
      where: { userId: userId1 },
      take: 10,
      include: {
        behavior: {
          select: { pageViews: { select: { url: true } } }
        }
      }
    });
    const sessions2 = await prisma.session.findMany({
      where: { userId: userId2 },
      take: 10,
      include: {
        behavior: {
          select: { pageViews: { select: { url: true } } }
        }
      }
    });

    const pages1 = new Set(
      sessions1.flatMap(s => s.behavior?.pageViews.map(p => p.url)).filter(Boolean)
    );
    const pages2 = new Set(
      sessions2.flatMap(s => s.behavior?.pageViews.map(p => p.url)).filter(Boolean)
    );

    const overlap = [...pages1].filter(page => pages2.has(page));
    const similarity = overlap.length / Math.max(pages1.size, pages2.size, 1); // Avoid division by zero

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
      masterUser = await prisma.user.findUnique({ where: { id: masterDevice.userId } });
    } else {
      masterUser = await prisma.user.create({
        data: {
          email: `${masterDevice.fingerprint}@placeholder.com`, // Placeholder email for new user
          password: 'defaultpassword', // Must provide a password
          fullName: 'Anonymous User',
          fingerprint: masterDevice.fingerprint,
          lastActive: new Date(),
          // Connect/create related models as needed for a new user
        }
      });
      // Update the masterDevice to link to the new user
      await prisma.userDevice.update({
        where: { id: masterDevice.id },
        data: { userId: masterUser.id }
      });
    }

    // Update slave device
    await prisma.userDevice.update({
      where: { id: slaveDevice.id },
      data: {
        userId: masterUser.id,
        stitchedWith: { // Assuming stitchedWith is Json[]
          push: {
            fingerprint: masterDevice.fingerprint,
            confidence,
            stitchedAt: new Date()
          }
        }
      }
    });

    // Update master device
    await prisma.userDevice.update({
      where: { id: masterDevice.id },
      data: {
        stitchedWith: {
          push: {
            fingerprint: slaveDevice.fingerprint,
            confidence,
            stitchedAt: new Date()
          }
        }
      }
    });

    // Merge sessions: reassign sessions from slave user to master user
    await prisma.session.updateMany({
      where: { userId: slaveDevice.userId }, // Sessions belonging to the slave device's original user
      data: { userId: masterUser.id }
    });

    // If masterDevice itself didn't have a userId, its sessions might need reassigning too
    if (!device1.userId && masterDevice.id === device1.id) {
        await prisma.session.updateMany({
            where: { fingerprint: device1.fingerprint, userId: null }, // Sessions where original user was null
            data: { userId: masterUser.id }
        });
    } else if (!device2.userId && masterDevice.id === device2.id) {
         await prisma.session.updateMany({
            where: { fingerprint: device2.fingerprint, userId: null }, // Sessions where original user was null
            data: { userId: masterUser.id }
        });
    }


    // Return the updated master user with its devices
    const finalMasterUser = await prisma.user.findUnique({
      where: { id: masterUser.id },
      include: { devices: true }
    });

    return finalMasterUser;
  }
}

module.exports = new DeviceStitchingService();