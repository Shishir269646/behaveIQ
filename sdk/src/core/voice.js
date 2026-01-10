// sdk/voice.js - Voice Search
class VoiceSearch {
    constructor(sdk) {
      this.sdk = sdk;
      this.recognition = null;
      this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      
      if (this.isSupported) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.lang = 'en-US';
      } else {
        if (this.sdk.debug) console.error('Voice recognition not supported by this browser.');
      }
    }

    start(callback) {
      if (!this.isSupported) {
        if (this.sdk.debug) console.error('Voice recognition not supported');
        return;
      }

      this.recognition.start();

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.searchByVoice(transcript, callback);
      };

      this.recognition.onerror = (event) => {
        if (this.sdk.debug) console.error('Voice recognition error:', event.error);
      };
    }

    async searchByVoice(query, callback) {
      const response = await this.sdk.request('/voice/search', {
        method: 'POST',
        body: {
          query,
          userId: this.sdk.userId
        }
      });

      if (response.success && callback) {
        callback(response.data.results);
      }
    }
  }

export default VoiceSearch;