/**
 * @class Injector
 * @description Handles the synchronous application of personalization rules to the DOM.
 * This is a core part of the zero-flicker personalization strategy.
 */
class Injector {
    constructor() {
        this.appliedRules = new Set();
    }

    /**
     * Synchronously applies a set of personalization rules to the DOM.
     * This method is designed to be called from a script in the <head>
     * after the anti-flicker snippet and before the body is visible.
     * @param {Array<Object>} rules - An array of personalization rule objects.
     */
    apply(rules = []) {
        try {
            if (!rules || rules.length === 0) {
                return;
            }

            // The DOM should be queryable at this point, even if not fully loaded.
            this.injectContent(rules);

        } catch (error) {
            console.error('BEHAVEIQ: Personalization error:', error);
        } finally {
            // ALWAYS unhide the body to prevent the page from staying blank.
            this.unhideBody();
        }
    }

    /**
     * Injects the content based on the rules.
     * @param {Array<Object>} rules - The rules to inject.
     */
    injectContent(rules) {
        for (const rule of rules) {
            if (!rule.selector || this.appliedRules.has(rule.ruleId)) {
                continue;
            }

            try {
                // Find the element(s). This runs before DOMContentLoaded, so we rely
                // on the elements being present in the initial HTML payload.
                const elements = document.querySelectorAll(rule.selector);

                if (elements.length === 0) {
                    // It's common for elements to not be found if they are rendered by client-side JS.
                    // This synchronous injector can only act on server-rendered HTML.
                    continue;
                }

                elements.forEach(element => {
                    // Directly manipulate the content. The page is not visible yet.
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
                });

                this.appliedRules.add(rule.ruleId);

            } catch (error) {
                // Log error for the specific rule but continue processing others.
                console.error(`BEHAVEIQ: Error applying rule ${rule.ruleId}:`, error);
            }
        }
    }
    
    /**
     * Makes the body of the page visible.
     * This should be called after all synchronous DOM manipulations are complete.
     */
    unhideBody() {
        // This targets the style applied by the anti-flicker snippet.
        if (document.body) {
            document.body.style.opacity = '1';
        } else {
            // If the body isn't even parsed yet, we can wait for it.
            document.addEventListener('DOMContentLoaded', () => {
                if(document.body) document.body.style.opacity = '1';
            });
        }
    }
}

export default Injector;