// src/controllers/identityController.js
const fingerprintService = require('../services/fingerprintService');
const Session = require('../models/Session');
const { v4: uuidv4 } = require('uuid');

exports.identify = async (req, res) => {
  try {
    const { fingerprint, deviceInfo, fpComponents, location } = req.body;

    // Validate fingerprint
    const validation = fingerprintService.validateFingerprint(fpComponents);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid fingerprint',
        missing: validation.missing
      });
    }

    // Generate session ID
    const sessionId = uuidv4();

    // Identify or create user
    const user = await fingerprintService.identifyUser(fingerprint, deviceInfo, {
      sessionId,
      fpComponents,
      location
    });

    // Create session
    const session = await Session.create({
      userId: user._id,
      fingerprint,
      sessionId,
      device: deviceInfo,
      location,
      startTime: new Date()
    });

    res.json({
      success: true,
      data: {
        userId: user._id,
        sessionId,
        persona: user.persona.primary,
        isNewUser: user.behavior.totalSessions === 0
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