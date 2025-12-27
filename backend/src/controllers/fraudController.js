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