import FingerprintGenerator from './core/fingerprint';
import BehaviorTracker from './core/tracker';
import EmotionTracker from './core/emotion';
import VoiceSearch from './core/voice';

class BqSdk {
    constructor(config) {
      console.log('BqSdk: Constructor called with config:', config);
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
      console.log('BqSdk: Constructor finished.');
    }

    async init() {
      console.log('BqSdk: init() started.');
      try {
        // Generate fingerprint
        console.log('BqSdk: Generating fingerprint...');
        this.fingerprint = await this.fingerprintGenerator.generate();
        console.log('BqSdk: Fingerprint generated:', this.fingerprint);
        
        // Identify user
        console.log('BqSdk: Identifying user...');
        await this.identifyUser();
        console.log('BqSdk: User identified. userId:', this.userId, 'sessionId:', this.sessionId);
        
        // Start tracking
        console.log('BqSdk: Starting trackers...');
        this.tracker.start();
        this.emotionTracker.start();
        
        console.log('✅ BqSdk initialized');
      } catch (error) {
        console.error('❌ BqSdk initialization failed:', error);
      }
      console.log('BqSdk: init() finished.');
    }

    async identifyUser() {
      console.log('BqSdk: identifyUser() started.');
      const deviceInfo = this.getDeviceInfo();
      const location = await this.getLocation();
      
      console.log('BqSdk: Sending identity request...');
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
        console.log('BqSdk: Identity request successful. userId:', this.userId);
      } else {
        console.error('BqSdk: Identity request failed:', response.error);
      }
      console.log('BqSdk: identifyUser() finished.');
    }

    getDeviceInfo() {
        const userAgent = navigator.userAgent;
        let type = 'desktop';
                if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|rim)|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda /i.test(userAgent.substr(0, 4)) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|erw|us)|ah(gl|ki)|ai(ko|ri)|ap(ap|bd|bm|gf|gh|gl|iy)|br(ch|er|ev)|bu(en)|c550|c500|dspn|el(fi|ung)|er(en|ob|re)|ez(go|jp)|fl(ch|in)|frie|g900|gf5g|go(.w|od)|gr(ad|un)|haie|hcit|hd(ad|at)|hg(hp|hs|pl)|ht(ft|tp)|ia(hp|kk|pn)|ip(ck|in|tk)|jig |kddi|keji|kgt|klon|kpt |kwc|kyo(c|k)|le(no|xi)|lg( g50|g51|g70|g80|g90|hpt|ik|in|ip)|li(e4|wn)|mago|ma(te|ui)|mc(ad|ch|lo)|me(rc|ri)|mi(o8|oa|op)|mo(bi|wt)|mt(p1|si)|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|te)|pdxg|pg(13|21|41|61|70|80)|phil(am|zr)|pm(mi|og|wg)|pn(ap|ei)|plcm|pndc|show|sis(a|v)|siwa|sm(al|ar|b3|it)|t5(au|te)|tdg |tel(i|m)|tim |t-mo|tk(wa|wg)|tr(ind|sl)|un(av|go|ww)|ut(ap|ti)|vach|vag |vc(w|nd)|vi(rg|us)|voda|vulc|w3c |wapj|wasm|wj(ck|f)|wonu|x700|yas |your|zeto|zte- /i.test(userAgent.substr(0, 4))) {
            type = 'mobile';
        } else if (/(ipad|tablet|playbook|silk)|(android(?!.*mobile))/i.test(userAgent)) {
            type = 'tablet';
        }

        let os = 'Unknown';
        if (userAgent.indexOf('Win') !== -1) os = 'Windows';
        if (userAgent.indexOf('Mac') !== -1) os = 'macOS';
        if (userAgent.indexOf('Linux') !== -1) os = 'Linux';
        if (userAgent.indexOf('Android') !== -1) os = 'Android';
        if (userAgent.indexOf('iOS') !== -1) os = 'iOS';

        let browser = 'Unknown';
        if (userAgent.indexOf('Firefox') !== -1) browser = 'Firefox';
        if (userAgent.indexOf('Chrome') !== -1) browser = 'Chrome';
        if (userAgent.indexOf('Safari') !== -1) browser = 'Safari';
        if (userAgent.indexOf('Edge') !== -1) browser = 'Edge';
        if (userAgent.indexOf('Opera') !== -1) browser = 'Opera';

        return { type, os, browser, userAgent };
    }

    async getLocation() {
        return new Promise((resolve) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        });
                    },
                    (error) => {
                        console.warn('Geolocation error:', error.message);
                        resolve({ latitude: null, longitude: null, error: error.message });
                    },
                    { timeout: 5000, enableHighAccuracy: false, maximumAge: 60000 }
                );
            } else {
                resolve({ latitude: null, longitude: null, error: 'Geolocation not supported' });
            }
        });
    }

    async request(endpoint, options = {}) {
      console.log('BqSdk: Making request to endpoint:', endpoint);
      const url = `${this.apiUrl}${endpoint}`;

      console.log('BqSdk: Full request URL:', url); // Added log
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
      console.log('BqSdk: Request config:', config); // Added log

      const response = await fetch(url, config);
      console.log('BqSdk: Request response status:', response.status);
      return response.json();
    }
  }

export default BqSdk;