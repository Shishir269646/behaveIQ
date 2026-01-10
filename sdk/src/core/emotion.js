// sdk/emotion.js - Emotion Tracker
class EmotionTracker {
    constructor(sdk, emotionCheckInterval) {
      this.sdk = sdk;
      this.checkInterval = emotionCheckInterval || 10000; // Check every 10 seconds
    }

    start() {
      setInterval(() => this.analyzeEmotion(), this.checkInterval);
    }

    async analyzeEmotion() {
      if (!this.sdk.userId || !this.sdk.sessionId) {
        if (this.sdk.debug) console.warn('BqSdk EmotionTracker: userId or sessionId not available, skipping emotion analysis.');
        return;
      }
      const behaviorData = {
        mouseMovements: this.sdk.tracker.mouseData,
        scrollData: this.sdk.tracker.scrollData,
        clickData: this.sdk.tracker.clickData,
        timeOnPage: Date.now() - this.sdk.sessionStartTime,
        currentPage: window.location.href
      };

              const response = await this.sdk.request('/emotions/detect', {
                method: 'POST',
                body: {
                  userId: this.sdk.userId,
                  sessionId: this.sdk.sessionId,
                  behaviorData
                }
              });
      if (response.success && response.data.response.action !== 'none') {
        this.showEmotionResponse(response.data);
      }
    }

    showEmotionResponse(data) {
      const { emotion, response } = data;
      
      // Create intervention based on emotion
      if (response.action === 'show_help_chat') {
        this.showHelpButton(response.message);
      } else if (response.action === 'show_social_proof') {
        this.showSocialProof(response.urgencyMessage);
      } else if (response.action === 'show_guide') {
        this.showGuide(response.message);
      }
    }

    showHelpButton(message) {
      const button = document.createElement('div');
      button.id = 'behaveiq-help';
      button.innerHTML = `
        <div style="position: fixed; bottom: 20px; right: 20px; 
                    background: #007bff; color: white; padding: 15px 20px;
                    border-radius: 50px; cursor: pointer; z-index: 10000;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
          ${message}
        </div>
      `;
      document.body.appendChild(button);

      setTimeout(() => button.remove(), 5000);
    }

    showSocialProof(message) {
      const banner = document.createElement('div');
      banner.id = 'behaveiq-social';
      banner.innerHTML = `
        <div style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
                    background: #28a745; color: white; padding: 12px 24px;
                    border-radius: 8px; z-index: 10000;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
          ${message}
        </div>
      `;
      document.body.appendChild(banner);

      setTimeout(() => banner.remove(), 7000);
    }

    showGuide(message) {
      if (this.sdk.debug) console.log('Guide:', message);
      // Implement guide overlay
    }
  }

export default EmotionTracker;