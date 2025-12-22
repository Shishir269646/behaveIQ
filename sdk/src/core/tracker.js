import Network from '../utils/network';
import { throttle, debounce } from '../utils/helpers';

class Tracker {
    constructor(options) {
        this.apiKey = options.apiKey;
        this.sessionId = options.sessionId;
        this.fingerprint = options.fingerprint;
        this.apiUrl = options.apiUrl;
        this.config = options.config;

        this.eventQueue = [];
        this.flushInterval = 5000; // 5 seconds
        this.startTime = Date.now();
        this.pageStartTime = Date.now();

        // Start flush interval
        setInterval(() => this.flush(), this.flushInterval);
    }

    /**
     * Track page view
     */
    trackPageView() {
        this.sendEvent('pageview', {
            pageUrl: window.location.href,
            pageTitle: document.title,
            referrer: document.referrer
        });
    }

    /**
     * Track mouse movement (throttled)
     */
    trackMouse() {
        const handleMouseMove = throttle((e) => {
            this.queueEvent('mousemove', {
                x: e.clientX,
                y: e.clientY,
                pageUrl: window.location.href
            });
        }, 2000); // Send every 2 seconds max

        document.addEventListener('mousemove', handleMouseMove);
    }

    /**
     * Track scroll depth
     */
    trackScroll() {
        let maxScrollDepth = 0;

        const handleScroll = throttle(() => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollDepth = docHeight > 0 ? scrollTop / docHeight : 0;

            if (scrollDepth > maxScrollDepth) {
                maxScrollDepth = scrollDepth;

                this.queueEvent('scroll', {
                    scrollDepth: parseFloat(scrollDepth.toFixed(2)),
                    scrollDirection: 'down',
                    pageUrl: window.location.href
                });
            }
        }, 1000);

        window.addEventListener('scroll', handleScroll);
    }

    /**
     * Track clicks
     */
    trackClicks() {
        document.addEventListener('click', (e) => {
            const element = e.target;

            this.sendEvent('click', {
                element: element.tagName.toLowerCase(),
                elementText: element.textContent?.substring(0, 100) || '',
                elementId: element.id || '',
                elementClass: element.className || '',
                x: e.clientX,
                y: e.clientY,
                pageUrl: window.location.href
            });
        });
    }

    /**
     * Track page exit
     */
    trackExit() {
        const sendExitEvent = () => {
            const timeSpent = Math.floor((Date.now() - this.pageStartTime) / 1000);

            // Use sendBeacon for reliable sending on page unload
            const data = JSON.stringify({
                apiKey: this.apiKey,
                sessionId: this.sessionId,
                eventType: 'exit',
                eventData: {
                    pageUrl: window.location.href,
                    timeSpent
                },
                userAgent: navigator.userAgent,
                fingerprint: this.fingerprint
            });

            navigator.sendBeacon(
                `${this.apiUrl}/sdk/track`,
                new Blob([data], { type: 'application/json' })
            );
        };

        window.addEventListener('beforeunload', sendExitEvent);
        window.addEventListener('pagehide', sendExitEvent);
    }

    /**
     * Track custom event
     */
    trackCustomEvent(eventName, metadata) {
        this.sendEvent('custom', {
            eventName,
            customData: metadata,
            pageUrl: window.location.href
        });
    }

    /**
     * Queue event for batch sending
     */
    queueEvent(eventType, eventData) {
        this.eventQueue.push({
            eventType,
            eventData,
            timestamp: Date.now()
        });

        // Flush if queue is large
        if (this.eventQueue.length >= 10) {
            this.flush();
        }
    }

    /**
     * Send event immediately
     */
    async sendEvent(eventType, eventData) {
        try {
            await Network.post(`${this.apiUrl}/sdk/track`, {
                apiKey: this.apiKey,
                sessionId: this.sessionId,
                eventType,
                eventData,
                userAgent: navigator.userAgent,
                fingerprint: this.fingerprint
            });

            if (this.config.debug) {
                console.log('BEHAVEIQ: Event sent:', eventType, eventData);
            }
        } catch (error) {
            console.error('BEHAVEIQ: Error sending event:', error);
        }
    }

    /**
     * Flush event queue
     */
    async flush() {
        if (this.eventQueue.length === 0) return;

        const events = [...this.eventQueue];
        this.eventQueue = [];

        // Send all queued events
        for (const event of events) {
            await this.sendEvent(event.eventType, event.eventData);
        }
    }
}

export default Tracker;