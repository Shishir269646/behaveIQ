import { prisma } from "../config/database";

/**
 * Get personalization rules for a session
 */
export const getPersonalization = async (
    websiteId: string,
    personaType: string | null,
    intentScore: number | null,
    personaId: string | null
) => {
    try {
        // If no persona detected yet
        if (!personaType && !personaId) {
            return {
                personalizationRules: [],
                personaType: null,
            };
        }

        // Get persona
        const persona = await prisma.persona.findFirst({
            where: {
                isActive: true,
                ...(personaId
                    ? { id: personaId }
                    : { websiteId: websiteId, name: personaType as string }),
            },
            include: {
                personalizationRules: {
                    where: { isActive: true },
                    orderBy: { priority: "desc" },
                },
            },
        });

        if (!persona) {
            return {
                personalizationRules: [],
                personaType: personaType,
            };
        }

        // Map rules
        const rules: any[] = persona.personalizationRules.map((rule) => ({
            ruleId: rule.id,
            selector: rule.selector,
            content: rule.content,
            contentType: rule.contentType,
        }));

        // Check for active experiments
        const activeExperiment = await prisma.experiment.findFirst({
            where: { websiteId, status: "active" },
            include: { variations: true },
        });

        if (activeExperiment && activeExperiment.variations.length > 0) {
            // Randomly assign variation
            const variation = selectVariation(activeExperiment.variations);

            if (variation) {
                rules.unshift({
                    ruleId: `exp_${activeExperiment.id}`,
                    selector: variation.selector,
                    content: variation.content,
                    contentType: variation.contentType || "text",
                    experimentId: activeExperiment.id,
                    variationName: variation.name,
                });
            }
        }

        return {
            personalizationRules: rules,
            personaType: persona.name,
            intentScore,
        };
    } catch (error) {
        console.error("Personalization error:", error);
        return {
            personalizationRules: [],
            personaType: null,
        };
    }
};

/**
 * Select variation based on traffic percentage
 */
function selectVariation(variations: any[]) {
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
