import Tracker from './core/tracker';
import Injector from './core/injector';
import Storage from './utils/storage';
import Network from './utils/network';
import { generateFingerprint, generateSessionId } from './utils/helpers';

class BEHAVEIQ {
    constructor() {
        this.apiKey = null;
        this.config = {};
        this.tracker = null;
        this.injector = null;
        this.sessionId = null;
        this.fingerprint = null;
        this.isInitialized = false;
        this.apiUrl = 'https://api.behaveiq.com/api/v1'; // Change to your API URL
    }

    /**
     * Initialize SDK
     */
    init(apiKey, config = {}) {
        if (this.isInitialized) {
            console.warn('BEHAVEIQ: Already initialized');
            return;
        }

        this.apiKey = apiKey;
        this.config = {
            trackMouse: config.trackMouse !== false,
            trackScroll: config.trackScroll !== false,
            trackClicks: config.trackClicks !== false,
            autoPersonalize: config.autoPersonalize !== false,
            debug: config.debug || false,
            apiUrl: config.apiUrl || this.apiUrl
        };

        // Generate fingerprint and session ID
        this.fingerprint = generateFingerprint();
        this.sessionId = Storage.get('behaveiq_session') || generateSessionId();
        Storage.set('behaveiq_session', this.sessionId, 30); // 30 minutes

        // Initialize tracker
        this.tracker = new Tracker({
            apiKey: this.apiKey,
            sessionId: this.sessionId,
            fingerprint: this.fingerprint,
            apiUrl: this.config.apiUrl,
            config: this.config
        });

        // Initialize injector
        this.injector = new Injector({
            apiKey: this.apiKey,
            sessionId: this.sessionId,
            apiUrl: this.config.apiUrl
        });

        // Start tracking
        if (this.config.trackMouse) {
            this.tracker.trackMouse();
        }

        if (this.config.trackScroll) {
            this.tracker.trackScroll();
        }

        if (this.config.trackClicks) {
            this.tracker.trackClicks();
        }

        // Track page view
        this.tracker.trackPageView();

        // Auto personalize
        if (this.config.autoPersonalize) {
            this.personalize();
        }

        // Track page unload
        this.tracker.trackExit();

        this.isInitialized = true;

        if (this.config.debug) {
            console.log('BEHAVEIQ initialized:', {
                apiKey: this.apiKey,
                sessionId: this.sessionId,
                fingerprint: this.fingerprint
            });
        }
    }

    /**
     * Track custom event
     */
    track(eventName, metadata = {}) {
        if (!this.isInitialized) {
            console.error('BEHAVEIQ: Not initialized. Call init() first.');
            return;
        }

        this.tracker.trackCustomEvent(eventName, metadata);
    }

    /**
     * Get current persona
     */
    async getPersona() {
        if (!this.isInitialized) {
            console.error('BEHAVEIQ: Not initialized.');
            return null;
        }

        try {
            const response = await Network.get(
                `${this.config.apiUrl}/sdk/personalize/${this.apiKey}/${this.sessionId}`
            );
            return response.personaType || null;
        } catch (error) {
            console.error('BEHAVEIQ: Error getting persona:', error);
            return null;
        }
    }

    /**
     * Apply personalization
     */
    async personalize() {
        if (!this.isInitialized) {
            console.error('BEHAVEIQ: Not initialized.');
            return;
        }

        try {
            await this.injector.applyPersonalization();
        } catch (error) {
            console.error('BEHAVEIQ: Personalization error:', error);
        }
    }

    /**
     * Get current session ID
     */
    getSessionId() {
        return this.sessionId;
    }
}

// Create global instance
const behaveiq = new BEHAVEIQ();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = behaveiq;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.BEHAVEIQ = behaveiq;
}

export default behaveiq;