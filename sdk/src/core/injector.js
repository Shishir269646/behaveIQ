import Network from '../utils/network';

class Injector {
    constructor(options) {
        this.apiKey = options.apiKey;
        this.sessionId = options.sessionId;
        this.apiUrl = options.apiUrl;
        this.appliedRules = new Set();
    }

    /**
     * Apply personalization rules
     */
    async applyPersonalization() {
        try {
            // Get personalization rules from API
            const response = await Network.get(
                `${this.apiUrl}/sdk/personalize/${this.apiKey}/${this.sessionId}`
            );

            if (!response.personalizationRules || response.personalizationRules.length === 0) {
                return;
            }

            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.injectContent(response.personalizationRules);
                });
            } else {
                this.injectContent(response.personalizationRules);
            }

        } catch (error) {
            console.error('BEHAVEIQ: Personalization error:', error);
        }
    }

    /**
     * Inject content into DOM
     */
    injectContent(rules) {
        for (const rule of rules) {
            // Skip if already applied
            if (this.appliedRules.has(rule.ruleId)) {
                continue;
            }

            try {
                const elements = document.querySelectorAll(rule.selector);

                if (elements.length === 0) {
                    console.warn(`BEHAVEIQ: No elements found for selector: ${rule.selector}`);
                    continue;
                }

                elements.forEach(element => {
                    // Apply zero-flicker technique
                    element.style.opacity = '0';
                    element.style.transition = 'opacity 0.2s ease-in-out';

                    setTimeout(() => {
                        switch (rule.contentType) {
                            case 'text':
                                element.textContent = rule.content;
                                break;

                            case 'html':
                                element.innerHTML = rule.content;
                                break;

                            case 'image':
                                if (element.tagName === 'IMG') {
                                    element.src = rule.content;
                                }
                                break;

                            default:
                                element.textContent = rule.content;
                        }

                        // Fade in
                        element.style.opacity = '1';
                    }, 50);
                });

                this.appliedRules.add(rule.ruleId);

            } catch (error) {
                console.error(`BEHAVEIQ: Error applying rule ${rule.ruleId}:`, error);
            }
        }
    }

    /**
     * Remove all applied personalization
     */
    reset() {
        this.appliedRules.clear();
    }
}

export default Injector;