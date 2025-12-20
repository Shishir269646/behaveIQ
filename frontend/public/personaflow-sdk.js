/**
 * PersonaFlow SDK - Standalone Version
 * Version: 1.0.0
 * 
 * Usage:
 * <script src="https://cdn.yourdomain.com/personaflow-sdk.js"></script>
 * <script>
 *   PersonaFlow.init({
 *     siteId: 'site_xxx',
 *     apiKey: 'pk_xxx'
 *   });
 * </script>
 */

(function (window) {
    'use strict';

    // Configuration
    var config = {
        siteId: null,
        apiKey: null,
        apiUrl: 'http://localhost:5000/api',
        debug: false,
        autoTrack: true
    };

    // Storage keys
    var ANON_ID_KEY = 'pf_anon_id';
    var VARIANT_KEY = 'pf_variant';

    // Current state
    var anonId = null;
    var currentVariant = null;
    var scrollDepth = 0;

    /**
     * Initialize SDK
     */
    function init(options) {
        if (!options.siteId) {
            console.error('PersonaFlow: siteId is required');
            return;
        }
        if (!options.apiKey) {
            console.error('PersonaFlow: apiKey is required');
            return;
        }

        // Set config
        config.siteId = options.siteId;
        config.apiKey = options.apiKey;
        if (options.apiUrl) config.apiUrl = options.apiUrl;
        if (options.debug) config.debug = options.debug;

        // Get anon ID
        anonId = getOrCreateAnonId();

        // Load personalization
        loadPersonalization();

        // Track page view
        trackEvent('page_view', {
            referrer: document.referrer,
            title: document.title
        });

        // Setup auto tracking
        if (config.autoTrack) {
            setupScrollTracking();
            setupClickTracking();
        }

        log('PersonaFlow initialized');
    }

    /**
     * Get or create anonymous ID
     */
    function getOrCreateAnonId() {
        var id = localStorage.getItem(ANON_ID_KEY);
        if (!id) {
            id = 'anon_' + generateId();
            localStorage.setItem(ANON_ID_KEY, id);
        }
        return id;
    }

    /**
     * Generate random ID
     */
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Load personalization
     */
    function loadPersonalization() {
        var device = window.innerWidth < 768 ? 'mobile' : 'desktop';
        var url = config.apiUrl + '/personalize?' +
            'site=' + config.siteId +
            '&anon=' + anonId +
            '&path=' + window.location.pathname +
            '&device=' + device;

        fetch(url, {
            headers: {
                'x-api-key': config.apiKey
            }
        })
            .then(function (response) { return response.json(); })
            .then(function (data) {
                if (data.success && data.data) {
                    currentVariant = data.data;
                    localStorage.setItem(VARIANT_KEY, JSON.stringify(data.data));
                    applyVariant(data.data);

                    // Dispatch event
                    var event = new CustomEvent('personaflow:loaded', {
                        detail: data.data
                    });
                    window.dispatchEvent(event);
                }
            })
            .catch(function (error) {
                console.error('PersonaFlow error:', error);
            });
    }

    /**
     * Apply variant to page
     */
    function applyVariant(variant) {
        var content = variant.content;

        // Apply headline
        applyToElements('[data-pf-headline]', function (el) {
            el.textContent = content.headline;
        });

        // Apply subheadline
        applyToElements('[data-pf-subheadline]', function (el) {
            el.textContent = content.subheadline;
        });

        // Apply CTA
        applyToElements('[data-pf-cta]', function (el) {
            if (content.ctaText) {
                el.textContent = content.ctaText;
            }
            if (content.ctaColor) {
                el.style.backgroundColor = content.ctaColor;
            }
        });

        log('Variant applied:', variant.variant);
    }

    /**
     * Apply function to elements
     */
    function applyToElements(selector, callback) {
        var elements = document.querySelectorAll(selector);
        for (var i = 0; i < elements.length; i++) {
            callback(elements[i]);
        }
    }

    /**
     * Track event
     */
    function trackEvent(type, meta) {
        var eventData = {
            anonId: anonId,
            siteId: config.siteId,
            type: type,
            path: window.location.pathname,
            meta: meta || {},
            variant: currentVariant ? currentVariant.variant : null,
            device: window.innerWidth < 768 ? 'mobile' : 'desktop',
            timestamp: new Date().toISOString()
        };

        fetch(config.apiUrl + '/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.apiKey
            },
            body: JSON.stringify(eventData)
        }).catch(function (error) {
            console.error('Event tracking failed:', error);
        });

        log('Event tracked:', type, meta);
    }

    /**
     * Track conversion
     */
    function trackConversion(eventType, value) {
        var data = {
            anonId: anonId,
            siteId: config.siteId,
            event: eventType,
            value: value || 1,
            variant: currentVariant ? currentVariant.variant : null,
            path: window.location.pathname
        };

        fetch(config.apiUrl + '/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.apiKey
            },
            body: JSON.stringify(data)
        }).catch(function (error) {
            console.error('Conversion tracking failed:', error);
        });

        log('Conversion tracked:', eventType, value);
    }

    /**
     * Setup scroll tracking
     */
    function setupScrollTracking() {
        var lastScrollTime = 0;

        window.addEventListener('scroll', function () {
            var now = Date.now();
            if (now - lastScrollTime < 500) return;
            lastScrollTime = now;

            var scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            var scrolled = window.scrollY;
            var depth = Math.round((scrolled / scrollHeight) * 100);

            if (depth >= scrollDepth + 25) {
                scrollDepth = Math.floor(depth / 25) * 25;
                trackEvent('scroll', { depth: scrollDepth / 100 });
            }
        });
    }

    /**
     * Setup click tracking
     */
    function setupClickTracking() {
        document.addEventListener('click', function (e) {
            var target = e.target;
            var tagName = target.tagName.toLowerCase();

            if (tagName === 'button' || tagName === 'a') {
                trackEvent('click', {
                    elementId: target.id || null,
                    elementClass: target.className || null,
                    elementText: target.textContent.substring(0, 50)
                });
            }
        });
    }

    /**
     * Log debug messages
     */
    function log() {
        if (config.debug) {
            var args = Array.prototype.slice.call(arguments);
            args.unshift('[PersonaFlow]');
            console.log.apply(console, args);
        }
    }

    // Public API
    var PersonaFlow = {
        init: init,
        trackEvent: trackEvent,
        trackConversion: trackConversion,
        getVariant: function () { return currentVariant; },
        getAnonId: function () { return anonId; }
    };

    // Expose globally
    window.PersonaFlow = PersonaFlow;

})(window);