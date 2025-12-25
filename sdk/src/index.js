import FingerprintGenerator from './core/fingerprint';
import BehaviorTracker from './core/tracker';
import EmotionTracker from './core/emotion';
import VoiceSearch from './core/voice';

class BqSdk {
    constructor(config) {
      if (!config || !config.apiKey) {
        console.error('BqSdk: API Key is required for initialization.');
        return;
      }
      this.apiUrl = config.apiUrl || 'http://localhost:5000/api';
      this.apiKey = config.apiKey;
      this.userId = null;
      this.sessionId = null;
      this.fingerprint = null;
      this.sessionStartTime = Date.now(); // Required for EmotionTracker
      
      // Initialize components
      this.fingerprintGenerator = new FingerprintGenerator();
      this.tracker = new BehaviorTracker(this);
      this.emotionTracker = new EmotionTracker(this);
      this.voiceSearch = new VoiceSearch(this);
      
      // Auto-initialize
      this.init();
    }

    async init() {
      try {
        // Generate fingerprint
        this.fingerprint = await this.fingerprintGenerator.generate();
        
        // Identify user
        await this.identifyUser();
        
        // Start tracking
        this.tracker.start();
        this.emotionTracker.start();
        
        console.log('✅ BqSdk initialized');
      } catch (error) {
        console.error('❌ BqSdk initialization failed:', error);
      }
    }

    async identifyUser() {
      const deviceInfo = this.getDeviceInfo();
      const location = await this.getLocation();
      
      const response = await this.request('/identity/identify', {
        method: 'POST',
        body: {
          fingerprint: this.fingerprint.hash,
          deviceInfo,
          fpComponents: this.fingerprint.components,
          location
        }
      });

      if (response.success) {
        this.userId = response.data.userId;
        this.sessionId = response.data.sessionId;
        this.persona = response.data.persona;
      }
    }

    getDeviceInfo() {
      const ua = navigator.userAgent;
      return {
        type: this.getDeviceType(),
        os: this.getOS(),
        browser: this.getBrowser(),
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        userAgent: ua,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    }

    getDeviceType() {
      const ua = navigator.userAgent;
      if (/mobile/i.test(ua)) return 'mobile';
      if (/tablet|ipad/i.test(ua)) return 'tablet';
      return 'desktop';
    }

    getOS() {
      const ua = navigator.userAgent;
      if (/windows/i.test(ua)) return 'Windows';
      if (/mac/i.test(ua)) return 'MacOS';
      if (/linux/i.test(ua)) return 'Linux';
      if (/android/i.test(ua)) return 'Android';
      if (/ios|iphone|ipad/i.test(ua)) return 'iOS';
      return 'Unknown';
    }

    getBrowser() {
      const ua = navigator.userAgent;
      if (/chrome/i.test(ua) && !/edge/i.test(ua)) return 'Chrome';
      if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
      if (/firefox/i.test(ua)) return 'Firefox';
      if (/edge/i.test(ua)) return 'Edge';
      return 'Unknown';
    }

    async getLocation() {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        return {
          ip: data.ip,
          country: data.country_name,
          city: data.city,
          coordinates: {
            lat: data.latitude,
            lng: data.longitude
          }
        };
      } catch (error) {
        return null;
      }
    }

    async request(endpoint, options = {}) {
      const url = `${this.apiUrl}${endpoint}`;
      const config = {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        }
      };

      if (options.body) {
        config.body = JSON.stringify(options.body);
      }

      const response = await fetch(url, config);
      return response.json();
    }
  }

export default BqSdk;