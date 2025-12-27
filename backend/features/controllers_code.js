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

// ================================================================

// src/controllers/behaviorController.js
const Behavior = require('../models/Behavior');
const Session = require('../models/Session');
const emotionService = require('../services/emotionService');

exports.trackEvent = async (req, res) => {
  try {
    const { userId, sessionId, eventType, eventData } = req.body;

    // Create behavior event
    const behavior = await Behavior.create({
      userId,
      sessionId,
      eventType,
      eventData,
      timestamp: new Date()
    });

    // Update session
    await Session.findOneAndUpdate(
      { sessionId },
      {
        $push: {
          [`behavior.${eventType}s`]: {
            ...eventData,
            timestamp: new Date()
          }
        }
      }
    );

    // Analyze emotion if enough data
    if (eventType === 'mouse_move' || eventType === 'scroll') {
      const session = await Session.findOne({ sessionId });
      if (session.behavior.mouseMovements.length > 10) {
        const emotionResult = await emotionService.detectEmotion(userId, {
          mouseMovements: session.behavior.mouseMovements,
          scrollData: session.behavior.pageViews,
          clickData: session.behavior.clicks,
          timeOnPage: Date.now() - session.startTime
        });

        // Get appropriate response
        const response = emotionService.getEmotionResponse(
          emotionResult.emotion, 
          eventData.url
        );

        return res.json({
          success: true,
          emotion: emotionResult.emotion,
          response
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Behavior tracking error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getBehaviorSummary = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const summary = {
      pageViews: session.behavior.pageViews.length,
      clicks: session.behavior.clicks.length,
      timeSpent: Date.now() - session.startTime,
      emotion: session.emotion.current,
      intentScore: session.intentScore.current
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ================================================================

// src/controllers/emotionController.js
const emotionService = require('../services/emotionService');
const Session = require('../models/Session');
const User = require('../models/User');

exports.detectEmotion = async (req, res) => {
  try {
    const { userId, sessionId, behaviorData } = req.body;

    // Detect emotion
    const result = await emotionService.detectEmotion(userId, behaviorData);

    // Update session
    await Session.findOneAndUpdate(
      { sessionId },
      {
        $set: { 'emotion.current': result.emotion },
        $push: {
          'emotion.changes': {
            to: result.emotion,
            timestamp: new Date()
          }
        }
      }
    );

    // Update user profile
    await User.findByIdAndUpdate(userId, {
      $set: {
        'emotionalProfile.dominantEmotion': result.emotion
      },
      $push: {
        'emotionalProfile.history': {
          emotion: result.emotion,
          timestamp: new Date(),
          page: behaviorData.currentPage
        }
      }
    });

    // Get appropriate response
    const response = emotionService.getEmotionResponse(
      result.emotion,
      behaviorData.currentPage
    );

    res.json({
      success: true,
      data: {
        emotion: result.emotion,
        confidence: result.confidence,
        response
      }
    });
  } catch (error) {
    console.error('Emotion detection error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ================================================================

// src/controllers/abandonmentController.js
const abandonmentService = require('../services/abandonmentService');

exports.predictRisk = async (req, res) => {
  try {
    const { userId, sessionData } = req.body;

    // Predict abandonment risk
    const result = await abandonmentService.predictAbandonmentRisk(userId, sessionData);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Abandonment prediction error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.trackInterventionResponse = async (req, res) => {
  try {
    const { interventionId, response } = req.body;

    await abandonmentService.trackInterventionResponse(interventionId, response);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ================================================================

// src/controllers/deviceController.js
const deviceStitchingService = require('../services/deviceStitchingService');
const Device = require('../models/Device');

exports.stitchDevices = async (req, res) => {
  try {
    const { fingerprint1, fingerprint2 } = req.body;

    const result = await deviceStitchingService.stitchDevices(
      fingerprint1,
      fingerprint2
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Device stitching error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getUserDevices = async (req, res) => {
  try {
    const { userId } = req.params;

    const devices = await Device.find({ userId });

    res.json({
      success: true,
      data: devices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ================================================================

// src/controllers/discountController.js
const discountService = require('../services/discountService');
const Discount = require('../models/Discount');

exports.calculateDiscount = async (req, res) => {
  try {
    const { userId, productInfo } = req.body;

    const discount = await discountService.calculateDiscount(userId, productInfo);

    if (!discount) {
      return res.json({
        success: true,
        data: { hasDiscount: false }
      });
    }

    res.json({
      success: true,
      data: {
        hasDiscount: true,
        ...discount
      }
    });
  } catch (error) {
    console.error('Discount calculation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.applyDiscount = async (req, res) => {
  try {
    const { code, userId } = req.body;

    const discount = await Discount.findOne({
      code,
      userId,
      status: 'active',
      expiresAt: { $gt: new Date() }
    });

    if (!discount) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired discount code'
      });
    }

    res.json({
      success: true,
      data: {
        type: discount.type,
        value: discount.value,
        reasons: discount.reasons
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.markAsUsed = async (req, res) => {
  try {
    const { code, orderId } = req.body;

    await Discount.findOneAndUpdate(
      { code },
      {
        status: 'used',
        usedAt: new Date(),
        orderId
      }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ================================================================

// src/controllers/fraudController.js
const FraudScore = require('../models/FraudScore');
const User = require('../models/User');

exports.checkFraud = async (req, res) => {
  try {
    const { userId, sessionData } = req.body;

    let riskScore = 0;
    const flags = [];
    const signals = {};

    // Check 1: Too fast checkout
    if (sessionData.checkoutTime < 10) {
      riskScore += 20;
      flags.push({ type: 'too_fast_checkout', severity: 3 });
      signals.tooFastCheckout = true;
    }

    // Check 2: Suspicious email pattern
    if (sessionData.email && /\d{8,}@/.test(sessionData.email)) {
      riskScore += 15;
      flags.push({ type: 'suspicious_email', severity: 2 });
      signals.suspiciousEmail = true;
    }

    // Check 3: No mouse movements (bot)
    if (sessionData.mouseMovements === 0) {
      riskScore += 25;
      flags.push({ type: 'bot_behavior', severity: 4 });
      signals.botBehavior = true;
    }

    // Check 4: Multiple failed payments
    const user = await User.findById(userId);
    if (user && user.behavior.failedPayments > 2) {
      riskScore += 20;
      flags.push({ type: 'multiple_failed_payments', severity: 3 });
      signals.multipleFailedPayments = true;
    }

    // Determine risk level
    const riskLevel = riskScore > 80 ? 'critical' :
                     riskScore > 60 ? 'high' :
                     riskScore > 40 ? 'medium' : 'low';

    // Create experience adjustment
    const experienceAdjustment = {
      requirePhoneVerification: riskScore > 80,
      requireEmailVerification: riskScore > 60,
      showCaptcha: riskScore > 50,
      disableCOD: riskScore > 70,
      manualReview: riskScore > 80,
      limitOrderValue: riskScore > 70 ? 5000 : null
    };

    // Save fraud score
    await FraudScore.create({
      userId,
      sessionId: sessionData.sessionId,
      score: riskScore,
      riskLevel,
      flags,
      signals,
      experienceAdjustment,
      timestamp: new Date()
    });

    // Update user fraud score
    await User.findByIdAndUpdate(userId, {
      $set: {
        'fraudScore.current': riskScore,
        'fraudScore.flags': flags.map(f => f.type),
        'fraudScore.lastChecked': new Date()
      }
    });

    res.json({
      success: true,
      data: {
        riskScore,
        riskLevel,
        flags,
        experienceAdjustment
      }
    });
  } catch (error) {
    console.error('Fraud check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ================================================================

// src/controllers/voiceController.js
exports.searchByVoice = async (req, res) => {
  try {
    const { query, userId } = req.body;

    // Simple product search (integrate with your product DB)
    // This is a placeholder - replace with actual search logic
    const results = await searchProducts(query);

    res.json({
      success: true,
      data: {
        query,
        results
      }
    });
  } catch (error) {
    console.error('Voice search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

async function searchProducts(query) {
  // Placeholder - implement your actual product search
  return [
    { id: 1, name: 'Product 1', price: 100 },
    { id: 2, name: 'Product 2', price: 200 }
  ];
}