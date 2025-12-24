import Tracker from './core/tracker';
import Injector from './core/injector';
import Storage from './utils/storage';
import { generateFingerprint, generateSessionId } from './utils/helpers';

/**
 * @class BEHAVEIQ
 * @description The main class for the BehaveIQ SDK.
 * It handles both synchronous personalization and asynchronous event tracking.
 */
class BEHAVEIQ {
    constructor() {
        this.isInitialized = false;
        this.apiUrl = 'https://api.behaveiq.com/api/v1'; // Default API URL
    }

    /**
     * Initializes the SDK.
     * This is the main entry point. For zero-flicker personalization, this method
     * must be called from a synchronous script in the <head> of the page.
     * @param {string} apiKey - Your project's API key.
     * @param {Object} [options={}] - Configuration options.
     * @param {Array<Object>} [options.personalizationRules=[]] - Personalization rules to apply synchronously.
     * @param {Object} [options.config={}] - Other configuration like tracking settings.
     */
    init(apiKey, options = {}) {
        if (this.isInitialized) {
            console.warn('BEHAVEIQ: Already initialized');
            return;
        }

        const { personalizationRules = [], config = {} } = options;

        // --- 1. Synchronous Personalization (Zero-Flicker) ---
        // This part runs immediately to prevent content flicker.
        try {
            const injector = new Injector();
            injector.apply(personalizationRules); // This method also unhides the body.
        } catch (e) {
            console.error('BEHAVEIQ: Critical error during personalization. Unhiding page.', e);
            // Ensure the page is always visible even if personalization fails.
            new Injector().unhideBody();
        }

        // --- 2. Asynchronous Tracking Initialization ---
        // This part can run without blocking the page render.
        // We wrap it in a function to be called after the current script stack clears.
        setTimeout(() => {
            this.apiKey = apiKey;
            this.config = {
                trackMouse: config.trackMouse !== false,
                trackScroll: config.trackScroll !== false,
                trackClicks: config.trackClicks !== false,
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
            
            // Start tracking basic events
            this.tracker.trackPageView();
            this.tracker.trackExit();

            if (this.config.trackScroll) this.tracker.trackScroll();
            if (this.config.trackClicks) this.tracker.trackClicks();
            if (this.config.trackMouse) this.tracker.trackMouse();

            this.isInitialized = true;

            if (this.config.debug) {
                console.log('BEHAVEIQ tracking initialized:', {
                    apiKey: this.apiKey,
                    sessionId: this.sessionId
                });
            }
        }, 0);
    }

    /**
     * Tracks a custom event.
     * @param {string} eventName - The name of the event.
     * @param {Object} [metadata={}] - Custom data associated with the event.
     */
    track(eventName, metadata = {}) {
        // Queue the event if the SDK is not yet initialized.
        if (!this.isInitialized || !this.tracker) {
            (this._q = this._q || []).push(['track', eventName, metadata]);
            return;
        }
        this.tracker.trackCustomEvent(eventName, metadata);
    }
    
    /**
     * Gets the current session ID.
     */
    getSessionId() {
        return this.sessionId;
    }
}

// --- Global Setup ---
// Create a global instance and a command queue.
// This ensures that any `BEHAVEIQ.track()` calls made before `init()` is complete
// are captured and executed later.
const instance = new BEHAVEIQ();
if (typeof window !== 'undefined') {
    const queue = window.BEHAVEIQ && window.BEHAVEIQ._q ? window.BEHAVEIQ._q : [];
    window.BEHAVEIQ = instance;
    window.BEHAVEIQ._q = queue; // Restore queue

    // Process any queued commands
    setTimeout(() => {
        if (instance.isInitialized) {
            while (window.BEHAVEIQ._q.length > 0) {
                const [method, ...args] = window.BEHAVEIQ._q.shift();
                if (typeof instance[method] === 'function') {
                    instance[method](...args);
                }
            }
        }
    }, 100);
}

export default instance;