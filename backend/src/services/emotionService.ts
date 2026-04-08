import axios from 'axios';
import { prisma } from '../config/database';
import redis from '../config/redis';
import { ML_SERVICE_URL } from '../config/env';

interface BehaviorData {
  mouseMovements: any[];
  scrollData: any[];
  clickData: any[];
  timeOnPage: number;
}

interface EmotionResult {
  emotion: string;
  confidence: number;
}

class EmotionService {
  private ML_SERVICE_URL: string;

  constructor() {
    this.ML_SERVICE_URL = ML_SERVICE_URL || 'http://localhost:8000';
  }

  /**
   * Analyze behavior and detect emotion
   */
  async detectEmotion(userId: string | undefined, behaviorData: BehaviorData, pageUrl: string = 'unknown'): Promise<EmotionResult> {
    try {
      const features = this.extractFeatures(behaviorData);

      const response = await axios.post(`${this.ML_SERVICE_URL}/ml/v1/predict/emotion`, {
        features,
        page_url: pageUrl
      });

      const emotion = response.data?.emotion || 'neutral';
      const confidence = response.data?.confidence || 0.5;

      const streamId = userId || 'anonymous';
      
      try {
        await redis.xadd('emotion:stream', '*', {
          user: streamId,
          emotion: emotion,
          confidence: confidence.toString(),
          timestamp: Date.now().toString()
        });
      } catch (redisError: any) {
        console.error('Redis Stream error in detectEmotion:', redisError.message);
      }

      if (userId) {
        await redis.set(`user:${userId}:emotion`, emotion, { ex: 300 });
      }

      return { emotion, confidence };
    } catch (error: any) {
      console.error('Emotion detection error:', error.message || error);
      return { emotion: 'neutral', confidence: 0.5 };
    }
  }

  /**
   * Extract emotion features from behavior
   */
  private extractFeatures(behaviorData: BehaviorData) {
    const { mouseMovements, scrollData, clickData, timeOnPage } = behaviorData;

    const speeds = (mouseMovements && mouseMovements.length > 1) ? mouseMovements.map((m, i) => {
      if (i === 0) return null;
      const prev = mouseMovements[i - 1];
      const distance = Math.sqrt(
        Math.pow(m.x - prev.x, 2) + Math.pow(m.y - prev.y, 2)
      );
      const time = m.timestamp - prev.timestamp;
      return time > 0 ? distance / time : null;
    }).filter((s): s is number => s !== null) : [];

    const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
    const speedVariance = speeds.length > 0 ? this.calculateVariance(speeds) : 0;

    const scrollDepthChanges = (scrollData && scrollData.length > 1)
      ? scrollData[scrollData.length - 1].scrollDepth - scrollData[0].scrollDepth
      : 0;

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

  private calculateVariance(arr: number[]): number {
    if (!arr || arr.length === 0) {
      return 0;
    }
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
  }

  /**
   * Get appropriate response for emotion based on website settings
   */
  async getEmotionResponse(websiteId: string, emotion: string) {
    const defaultResponse = { action: 'none', message: '' };

    try {
      const website = await prisma.website.findUnique({
        where: { id: websiteId },
        include: {
          settings: {
            include: {
              emotionInterventions: true
            }
          }
        }
      });
      if (!website || !website.settings || !website.settings.emotionInterventions) {
        return defaultResponse;
      }

      const intervention = (website.settings as any).emotionInterventions.find(
        (int: any) => int.emotion === emotion && int.status === 'active'
      );

      if (intervention) {
        return {
          action: intervention.action,
          message: intervention.message,
          data: intervention.data
        };
      }
    } catch (error) {
      console.error('Error fetching emotion intervention from website settings:', error);
    }

    return defaultResponse;
  }
}

const emotionService = new EmotionService();
export default emotionService;

export const detectEmotion = (userId: string | undefined, behaviorData: BehaviorData, pageUrl?: string) => 
  emotionService.detectEmotion(userId, behaviorData, pageUrl);

export const getEmotionResponse = (websiteId: string, emotion: string) => 
  emotionService.getEmotionResponse(websiteId, emotion);
