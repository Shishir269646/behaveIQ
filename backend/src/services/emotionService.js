// src/services/emotionService.js
const redis = require('../config/redis');
const axios = require('axios');

class EmotionService {
  constructor() {
    this.ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://ml-service:8000';
  }

  // Analyze behavior and detect emotion
  async detectEmotion(userId, behaviorData, pageUrl) {
    console.log('--- emotionService.detectEmotion received pageUrl ---', pageUrl);
    try {
      // Extract features from behavior
      const features = this.extractFeatures(behaviorData);

      // Call ML service
      const response = await axios.post(`${this.ML_SERVICE_URL}/ml/v1/predict/emotion`, {
        features,
        page_url: pageUrl
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
    const speeds = (mouseMovements && mouseMovements.length > 1) ? mouseMovements.map((m, i) => {
      if (i === 0) return null; // Use null to filter later
      const prev = mouseMovements[i - 1];
      const distance = Math.sqrt(
        Math.pow(m.x - prev.x, 2) + Math.pow(m.y - prev.y, 2)
      );
      const time = m.timestamp - prev.timestamp;
      return time > 0 ? distance / time : null;
    }).filter(s => s !== null) : [];

    const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
    const speedVariance = speeds.length > 0 ? this.calculateVariance(speeds) : 0;

    // Scroll pattern analysis
    const scrollDepthChanges = (scrollData && scrollData.length > 1)
      ? scrollData[scrollData.length - 1].depth - scrollData[0].depth
      : 0;

    // Click hesitation (average time between clicks)
    const clickHesitation = (clickData && clickData.length > 1) ? (clickData.reduce((sum, click, i) => {
      if (i === 0) return 0;
      return sum + (click.timestamp - clickData[i - 1].timestamp);
    }, 0) / (clickData.length - 1)) : 0;

    return {
      mouse_speed_variance: speedVariance,
      avg_mouse_speed: avgSpeed,
      scroll_depth_changes: scrollDepthChanges,
      click_hesitation_time: clickHesitation,
      time_on_page: timeOnPage
    };
  }

  calculateVariance(arr) {
    if (!arr || arr.length === 0) {
      return 0;
    }
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
  }

  // Get appropriate response for emotion
  // Get appropriate response for emotion based on website settings
  async getEmotionResponse(websiteId, emotion) { // Added websiteId
    const Website = require('../models/Website'); // Require here to avoid circular dependency

    const defaultResponse = { action: 'none', message: '' };

    try {
      const website = await Website.findById(websiteId); // Find by websiteId
      if (!website || !website.settings || !website.settings.emotionInterventions) {
        return defaultResponse;
      }

      const intervention = website.settings.emotionInterventions.find(
        (int) => int.emotion === emotion && int.status === 'active'
      );

      if (intervention) {
        return {
          action: intervention.action,
          message: intervention.message,
          // Add any other dynamic data from the intervention settings here
          data: intervention.data // Example
        };
      }
    } catch (error) {
      console.error('Error fetching emotion intervention from website settings:', error);
    }

    return defaultResponse;
  }
}

module.exports = new EmotionService();