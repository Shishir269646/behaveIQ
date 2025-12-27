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