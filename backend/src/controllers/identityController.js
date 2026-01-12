// src/controllers/identityController.js
const fingerprintService = require('../services/fingerprintService');
const Session = require('../models/Session');
const { v4: uuidv4 } = require('uuid');

const identify = async (req, res) => {
  
  try {
    // Ensure that a website context is available from the auth middleware
    if (!req.website) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: A valid API key linked to a registered website is required.'
      });
    }

    const { fingerprint, deviceInfo, fpComponents, location, websiteId } = req.body;

    if (websiteId && websiteId !== req.website._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request: The websiteId in the request body does not match the API key.'
      });
    }

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
    // The fingerprintService.identifyUser might internally create a guest user
    // but it needs the website context to tie that user/session to the correct website
    const user = await fingerprintService.identifyUser(fingerprint, deviceInfo, {
      sessionId,
      fpComponents,
      location,
      websiteId: req.website._id // Pass websiteId to fingerprintService as well
    });

    // Create session
    const session = await Session.create({
      userId: user._id,
      websiteId: req.website._id, // Associate session with the website
      fingerprint,
      sessionId,
      device: deviceInfo,
      location,
      startTime: new Date()
    });


    res.cookie('biq_fp', fingerprint, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true
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

module.exports = {
  identify
};