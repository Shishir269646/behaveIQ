// sdk/tracker.js - Behavior Tracker
class BehaviorTracker {
    constructor(sdk) {
      this.sdk = sdk;
      this.mouseData = [];
      this.scrollData = [];
      this.clickData = [];
      this.cartActions = [];
      this.sessionStartTime = Date.now(); // Assuming session starts when SDK initializes
    }

    start() {
      this.trackPageView();
      this.trackMouse();
      this.trackScroll();
      this.trackClicks();
      this.trackCart();
    }

    trackPageView() {
      if (!this.sdk.userId || !this.sdk.sessionId) {
        console.warn('BqSdk BehaviorTracker: userId or sessionId not available, skipping pageview tracking.');
        return;
      }
      const pageData = {
        url: window.location.href,
        timestamp: Date.now(),
        referrer: document.referrer
      };

      this.sdk.request('/behavior/track', {
        method: 'POST',
        body: {
          userId: this.sdk.userId,
          sessionId: this.sdk.sessionId,
          eventType: 'pageview',
          eventData: pageData
        }
      });
    }

    trackMouse() {
      let lastTime = Date.now();
      
      document.addEventListener('mousemove', (e) => {
        const now = Date.now();
        
        this.mouseData.push({
          x: e.clientX,
          y: e.clientY,
          timestamp: now
        });

        // Keep only last 50 movements
        if (this.mouseData.length > 50) {
          this.mouseData.shift();
        }

        // Send every 5 seconds
        if (now - lastTime > 5000) {
          this.sendBehaviorData('mouse_move', {
            movements: this.mouseData.slice()
          });
          lastTime = now;
        }
      });
    }

    trackScroll() {
      let lastScrollTime = Date.now();
      
      window.addEventListener('scroll', () => {
        const now = Date.now();
        const scrollDepth = (window.scrollY + window.innerHeight) / document.body.scrollHeight * 100;
        
        this.scrollData.push({
          depth: Math.round(scrollDepth),
          timestamp: now
        });

        // Send every 3 seconds
        if (now - lastScrollTime > 3000) {
          this.sendBehaviorData('scroll', {
            scrollData: this.scrollData.slice()
          });
          lastScrollTime = now;
        }
      });
    }

    trackClicks() {
      document.addEventListener('click', (e) => {
        const clickData = {
          element: e.target.tagName,
          id: e.target.id,
          class: e.target.className,
          x: e.clientX,
          y: e.clientY,
          timestamp: Date.now()
        };

        this.clickData.push(clickData);

        this.sendBehaviorData('click', clickData);
      });
    }

    trackCart() {
      // Assuming you have cart buttons with specific attributes
      document.addEventListener('click', (e) => {
        const target = e.target;
        
        if (target.hasAttribute('data-cart-action')) {
          const action = target.getAttribute('data-cart-action');
          const productId = target.getAttribute('data-product-id');
          
          const cartAction = {
            action, // add, remove, view
            productId,
            timestamp: Date.now()
          };

          this.cartActions.push(cartAction);
          this.sendBehaviorData('cart_action', cartAction);

          // Check for abandonment risk
          if (action === 'view' && this.cartActions.length > 0) {
            this.checkAbandonmentRisk();
          }
        }
      });
    }

    async checkAbandonmentRisk() {
      if (!this.sdk.userId || !this.sdk.sessionId) {
        console.warn('BqSdk BehaviorTracker: userId or sessionId not available, skipping abandonment risk check.');
        return;
      }
      const cartDuration = Date.now() - this.cartActions[0].timestamp;
      
      const response = await this.sdk.request('/abandonment/predict', {
        method: 'POST',
        body: {
          userId: this.sdk.userId,
          sessionData: {
            sessionId: this.sdk.sessionId,
            cartDuration: cartDuration / 1000,
            scrollDepth: this.getMaxScrollDepth(),
            priceViewCount: this.countPriceViews(),
            productComparisons: this.cartActions.filter(a => a.action === 'view').length,
            device: this.sdk.getDeviceInfo().type,
            cartValue: this.getCartValue()
          }
        }
      });

      if (response.success && response.data.shouldIntervene) {
        console.log('🚨 High abandonment risk detected!');
      }
    }

    getMaxScrollDepth() {
      return this.scrollData.length > 0 
        ? Math.max(...this.scrollData.map(s => s.depth))
        : 0;
    }

    countPriceViews() {
      // Count clicks on price elements
      return this.clickData.filter(c => 
        c.class && c.class.includes('price')
      ).length;
    }

    getCartValue() {
      // Get from your cart system
      return 0; // Placeholder
    }

    sendBehaviorData(eventType, eventData) {
      if (!this.sdk.userId || !this.sdk.sessionId) {
        console.warn(`BqSdk BehaviorTracker: userId or sessionId not available, skipping ${eventType} tracking.`);
        return;
      }
      this.sdk.request('/behavior/track', {
        method: 'POST',
        body: {
          userId: this.sdk.userId,
          sessionId: this.sdk.sessionId,
          eventType,
          eventData
        }
      }).catch(err => console.error('Tracking error:', err));
    }
}
