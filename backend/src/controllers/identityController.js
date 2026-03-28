const fingerprintService = require('../services/fingerprintService');
const { prisma } = require('../config/database'); // Import prisma client
const { v4: uuidv4 } = require('uuid');
const AppError = require('../utils/AppError');

const identify = async (req, res) => {
  try {
    // Ensure that a website context is available from the auth middleware
    if (!req.website) {
      throw new AppError('Forbidden: A valid API key linked to a registered website is required.', 403);
    }

    const { fingerprint, deviceInfo, fpComponents, location } = req.body;

    console.log('--- identify called with fpComponents:', JSON.stringify(fpComponents, null, 2));

    const websiteId = req.website.id; // Use req.website.id directly

    // Validate fingerprint
    const validation = fingerprintService.validateFingerprint(fpComponents);
    if (!validation.valid) {
      throw new AppError('Invalid fingerprint', 400, { missing: validation.missing });
    }

    // Generate session ID
    const sessionId = uuidv4();

    // Identify or create user
    const user = await fingerprintService.identifyUser(fingerprint, {
      sessionId,
      fpComponents,
      location,
      websiteId,
      deviceInfo // Pass deviceInfo to identifyUser
    });

    // Create session and connect related data
    const session = await prisma.session.create({
      data: {
        userId: user.id, // Use Prisma user.id
        websiteId: websiteId,
        fingerprint: fingerprint,
        sessionId: sessionId,
        deviceInfo: {
            create: { // Create nested DeviceSessionInfo
                type: deviceInfo?.type || 'unknown',
                os: deviceInfo?.os,
                browser: deviceInfo?.browser,
                userAgent: deviceInfo?.userAgent,
            }
        },
        locationInfo: {
            create: { // Create nested LocationInfo
                ip: location?.ip,
                country: location?.country,
                city: location?.city,
                coordinates: {
                    create: { // Create nested Coordinates
                        lat: location?.coordinates?.lat,
                        lng: location?.coordinates?.lng,
                    }
                }
            }
        },
        startTime: new Date()
      },
      include: {
          persona: true, // Include persona to return primary
          user: { include: { behavior: true } } // Include user behavior for isNewUser
      }
    });

    res.cookie('biq_fp', fingerprint, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true
    });

    res.json({
      success: true,
      data: {
        userId: user.id, // Use Prisma user.id
        sessionId,
        persona: session.persona?.name || 'Unknown', // Access persona from session include
        isNewUser: user.behavior?.totalSessions === 0 // Access totalSessions from user.behavior
      }
    });
  } catch (error) {
    console.error('Identity error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  identify
};