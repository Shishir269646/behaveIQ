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
        // New user - create
        const newUser = await User.create({
          fingerprint,
          devices: [{
            fingerprint,
            type: deviceInfo.type,
            firstSeen: new Date(),
            lastSeen: new Date()
          }],
          lastActive: new Date()
        });

        // Create device record
        await Device.create({
          fingerprint,
          userId: newUser._id,
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

        // Cache
        await redis.setex(`fp:${fingerprint}`, 86400, newUser._id.toString());

        return newUser;
      }
    } catch (error) {
      throw new Error(`Fingerprint identification failed: ${error.message}`);
    }
  }

  // Check fingerprint quality
  validateFingerprint(components) {
    const required = ['canvas', 'webgl', 'audio', 'fonts'];
    const missing = required.filter(key => !components[key]);
    
    if (missing.length > 0) {
      return { valid: false, missing };
    }
    
    return { valid: true, quality: 'high' };
  }
}

module.exports = new FingerprintService();

// ================================================================

// src/services/emotionService.js
const redis = require('../config/redis');
const axios = require('axios');

class EmotionService {
  constructor() {
    this.ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://ml-service:8000';
  }

  // Analyze behavior and detect emotion
  async detectEmotion(userId, behaviorData) {
    try {
      // Extract features from behavior
      const features = this.extractFeatures(behaviorData);

      // Call ML service
      const response = await axios.post(`${this.ML_SERVICE_URL}/predict/emotion`, {
        features
      });

      const emotion = response.data.emotion;
      const confidence = response.data.confidence;

      // Store in Redis Stream for real-time processing
      await redis.xadd('emotion:stream', '*',
        'user', userId,
        'emotion', emotion,
        'confidence', confidence.toString(),
        'timestamp', Date.now().toString()
      );

      // Cache current emotion
      await redis.setex(`user:${userId}:emotion`, 300, emotion); // 5 min TTL

      return { emotion, confidence };
    } catch (error) {
      console.error('Emotion detection error:', error);
      return { emotion: 'neutral', confidence: 0.5 };
    }
  }

  // Extract emotion features from behavior
  extractFeatures(behaviorData) {
    const { mouseMovements, scrollData, clickData, timeOnPage } = behaviorData;

    // Calculate mouse speed variance
    const speeds = mouseMovements.map((m, i) => {
      if (i === 0) return 0;
      const prev = mouseMovements[i - 1];
      const distance = Math.sqrt(
        Math.pow(m.x - prev.x, 2) + Math.pow(m.y - prev.y, 2)
      );
      const time = m.timestamp - prev.timestamp;
      return distance / time;
    });

    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const speedVariance = this.calculateVariance(speeds);

    // Scroll pattern analysis
    const scrollDepthChanges = scrollData.length > 1 
      ? scrollData[scrollData.length - 1].depth - scrollData[0].depth 
      : 0;

    // Click hesitation
    const clickHesitation = clickData.reduce((sum, click, i) => {
      if (i === 0) return 0;
      return sum + (click.timestamp - clickData[i - 1].timestamp);
    }, 0) / clickData.length;

    return {
      mouse_speed_variance: speedVariance,
      avg_mouse_speed: avgSpeed,
      scroll_depth_changes: scrollDepthChanges,
      click_hesitation_time: clickHesitation,
      time_on_page: timeOnPage
    };
  }

  calculateVariance(arr) {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
  }

  // Get appropriate response for emotion
  getEmotionResponse(emotion, currentPage) {
    const responses = {
      frustrated: {
        action: 'show_help_chat',
        message: 'Need help? Our team is here!',
        simplifyUI: true,
        showShortcuts: true,
        priority: 'high'
      },
      confused: {
        action: 'show_guide',
        highlightNextStep: true,
        showComparisonTool: true,
        message: 'Let us help you find what you need',
        priority: 'medium'
      },
      excited: {
        action: 'show_social_proof',
        urgencyMessage: 'Popular choice! 50+ bought today',
        showRecommendations: true,
        priority: 'low'
      },
      considering: {
        action: 'show_comparison',
        enableCompare: true,
        showReviews: true,
        priority: 'medium'
      },
      neutral: {
        action: 'none',
        priority: 'none'
      }
    };

    return responses[emotion] || responses.neutral;
  }
}

module.exports = new EmotionService();

// ================================================================

// src/services/abandonmentService.js
const axios = require('axios');
const redis = require('../config/redis');
const User = require('../models/User');
const Intervention = require('../models/Intervention');

class AbandonmentService {
  constructor() {
    this.ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://ml-service:8000';
  }

  // Predict cart abandonment risk
  async predictAbandonmentRisk(userId, sessionData) {
    try {
      // Get user history
      const user = await User.findById(userId);
      const previousAbandons = user?.behavior?.cartAbandons || 0;

      // Get current emotion
      const emotion = await redis.get(`user:${userId}:emotion`) || 'neutral';

      // Prepare features
      const features = {
        time_in_cart: sessionData.cartDuration,
        scroll_percentage: sessionData.scrollDepth,
        price_checks: sessionData.priceViewCount,
        comparisons: sessionData.productComparisons,
        previous_abandons: previousAbandons,
        emotion: emotion,
        device: sessionData.device,
        time_of_day: new Date().getHours(),
        cart_value: sessionData.cartValue
      };

      // Call ML service
      const response = await axios.post(`${this.ML_SERVICE_URL}/predict/abandonment`, {
        features
      });

      const riskScore = Math.round(response.data.probability * 100);

      // Store in Redis
      await redis.setex(`cart:${userId}:risk`, 300, riskScore.toString());

      // Trigger intervention if high risk
      if (riskScore > 70) {
        await this.triggerIntervention(userId, riskScore, features, sessionData);
      }

      return { riskScore, shouldIntervene: riskScore > 70 };
    } catch (error) {
      console.error('Abandonment prediction error:', error);
      return { riskScore: 50, shouldIntervene: false };
    }
  }

  // Trigger appropriate intervention
  async triggerIntervention(userId, riskScore, features, sessionData) {
    const intervention = this.selectIntervention(riskScore, features);

    // Save intervention record
    const interventionDoc = await Intervention.create({
      userId,
      sessionId: sessionData.sessionId,
      type: 'cart_abandon_prevention',
      trigger: {
        reason: 'high_risk_detected',
        score: riskScore,
        emotion: features.emotion
      },
      content: intervention,
      timestamp: new Date()
    });

    // Publish to Redis for real-time delivery
    await redis.publish('interventions', JSON.stringify({
      userId: userId.toString(),
      intervention,
      interventionId: interventionDoc._id.toString()
    }));

    return intervention;
  }

  // Select best intervention based on risk level
  selectIntervention(riskScore, features) {
    if (riskScore > 80) {
      return {
        type: 'urgent_discount',
        message: '🔥 Complete your order now - Get 10% OFF!',
        action: 'show_discount_popup',
        timer: 600, // 10 minutes
        showLiveChat: true,
        discountValue: 10,
        data: {
          urgency: 'high',
          expiresIn: 600
        }
      };
    } else if (riskScore > 60) {
      return {
        type: 'free_shipping',
        message: '🚚 Free shipping on this order!',
        action: 'show_shipping_banner',
        showTrustBadges: true,
        data: {
          urgency: 'medium'
        }
      };
    } else {
      return {
        type: 'social_proof',
        message: '✨ 500+ people bought this today',
        action: 'show_social_proof',
        showReviews: true,
        data: {
          urgency: 'low'
        }
      };
    }
  }

  // Track intervention effectiveness
  async trackInterventionResponse(interventionId, response) {
    const intervention = await Intervention.findById(interventionId);
    
    if (!intervention) return;

    intervention.response = {
      status: response.action, // clicked, ignored, dismissed
      timestamp: new Date(),
      effectiveness: response.action === 'clicked' ? 1 : 0
    };

    if (response.converted) {
      intervention.outcome = {
        prevented: true,
        converted: true,
        revenue: response.orderValue
      };
    }

    await intervention.save();
  }
}

module.exports = new AbandonmentService();

// ================================================================

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

// ================================================================

// src/services/discountService.js
const crypto = require('crypto');
const Discount = require('../models/Discount');
const User = require('../models/User');

class DiscountService {
  // Calculate personalized discount
  async calculateDiscount(userId, productInfo) {
    try {
      const user = await User.findById(userId);
      
      const factors = {
        loyalty: this.calculateLoyaltyBonus(user),
        firstTime: this.calculateFirstTimeBonus(user),
        persona: this.calculatePersonaBonus(user.persona.primary),
        cartAbandonment: await this.calculateAbandonmentBonus(userId),
        seasonal: this.calculateSeasonalBonus(productInfo)
      };

      // Calculate total (max 30%)
      const totalDiscount = Math.min(
        Object.values(factors).reduce((a, b) => a + b, 0),
        30
      );

      if (totalDiscount === 0) {
        return null; // No discount
      }

      // Generate discount code
      const code = this.generateDiscountCode();
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour

      // Create discount record
      const discount = await Discount.create({
        userId,
        code,
        type: 'percentage',
        value: totalDiscount,
        reasons: Object.entries(factors)
          .filter(([_, value]) => value > 0)
          .map(([factor, value]) => ({ factor, value })),
        applicableTo: {
          products: productInfo.productIds || [],
          minAmount: 0
        },
        expiresAt
      });

      return {
        code,
        discount: totalDiscount,
        reasons: this.generateDiscountReasons(factors),
        expiresAt,
        discountId: discount._id
      };
    } catch (error) {
      console.error('Discount calculation error:', error);
      return null;
    }
  }

  calculateLoyaltyBonus(user) {
    const purchases = user?.behavior?.purchases || 0;
    if (purchases >= 10) return 15;
    if (purchases >= 5) return 10;
    if (purchases >= 2) return 5;
    return 0;
  }

  calculateFirstTimeBonus(user) {
    return (user?.behavior?.purchases || 0) === 0 ? 15 : 0;
  }

  calculatePersonaBonus(persona) {
    const bonuses = {
      budget_buyer: 10,
      impulse_buyer: 5,
      feature_explorer: 3,
      careful_researcher: 5,
      casual_visitor: 0
    };
    return bonuses[persona] || 0;
  }

  async calculateAbandonmentBonus(userId) {
    const user = await User.findById(userId);
    const abandons = user?.behavior?.cartAbandons || 0;
    return abandons > 0 ? 10 : 0;
  }

  calculateSeasonalBonus(productInfo) {
    // Simple seasonal logic (can be enhanced)
    const month = new Date().getMonth();
    if ([10, 11].includes(month)) return 5; // Nov-Dec holiday season
    return 0;
  }

  generateDiscountCode() {
    return 'BEHAVE' + crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  generateDiscountReasons(factors) {
    const reasons = [];
    if (factors.loyalty > 0) reasons.push('Loyal customer bonus');
    if (factors.firstTime > 0) reasons.push('First purchase welcome offer');
    if (factors.persona > 0) reasons.push('Personalized discount');
    if (factors.cartAbandonment > 0) reasons.push('Come back offer');
    if (factors.seasonal > 0) reasons.push('Seasonal sale');
    return reasons;
  }
}

module.exports = new DiscountService();