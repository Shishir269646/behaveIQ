const Persona = require('../models/Persona');
const Experiment = require('../models/Experiment');

/**
 * Get personalization rules for a session
 */
exports.getPersonalization = async (websiteId, personaType, intentScore, personaId) => {
    try {
        // If no persona detected yet
        if (!personaType && !personaId) {
            return {
                personalizationRules: [],
                personaType: null
            };
        }

        // Get persona
        const persona = await Persona.findOne({
            ...(personaId ? { _id: personaId } : { websiteId, name: personaType }),
            isActive: true
        });

        if (!persona) {
            return {
                personalizationRules: [],
                personaType: personaType
            };
        }

        // Get active personalization rules
        const rules = persona.personalizationRules
            .filter(rule => rule.isActive)
            .sort((a, b) => b.priority - a.priority)
            .map(rule => ({
                ruleId: rule._id.toString(),
                selector: rule.selector,
                content: rule.content,
                contentType: rule.contentType
            }));

        // Check for active experiments
        const activeExperiment = await Experiment.findOne({
            websiteId,
            status: 'active'
        });

        if (activeExperiment) {
            // Randomly assign variation
            const variation = selectVariation(activeExperiment.variations);

            if (variation) {
                rules.unshift({
                    ruleId: `exp_${activeExperiment._id}`,
                    selector: variation.selector,
                    content: variation.content,
                    contentType: variation.contentType || 'text',
                    experimentId: activeExperiment._id,
                    variationName: variation.name
                });
            }
        }

        return {
            personalizationRules: rules,
            personaType: persona.name,
            intentScore
        };

    } catch (error) {
        console.error('Personalization error:', error);
        return {
            personalizationRules: [],
            personaType: null
        };
    }
};

/**
 * Select variation based on traffic percentage
 */
function selectVariation(variations) {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const variation of variations) {
        cumulative += variation.trafficPercentage;
        if (random <= cumulative) {
            return variation;
        }
    }

    return variations[0]; // Fallback
}
