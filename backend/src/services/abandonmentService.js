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