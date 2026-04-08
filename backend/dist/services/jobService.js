"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeActiveExperiments = void 0;
const database_1 = require("../config/database");
/**
 * Analyze active experiments and automatically declare winners if possible
 */
const analyzeActiveExperiments = async () => {
    try {
        console.log("Running job: Analyzing active experiments...");
        const activeExperiments = await database_1.prisma.experiment.findMany({
            where: {
                status: "active",
            },
            include: {
                variations: true,
                results: true,
            },
        });
        for (const experiment of activeExperiments) {
            const winnerData = calculateWinner(experiment.variations);
            if (winnerData) {
                console.log(`Winner found for experiment: ${experiment.name}. Winner: ${winnerData.winner}`);
                await database_1.prisma.experiment.update({
                    where: { id: experiment.id },
                    data: {
                        status: "completed",
                        endDate: new Date(),
                        results: {
                            upsert: {
                                create: {
                                    winner: winnerData.winner,
                                    confidence: winnerData.confidence,
                                    improvement: winnerData.improvement,
                                    declaredAt: new Date(),
                                },
                                update: {
                                    winner: winnerData.winner,
                                    confidence: winnerData.confidence,
                                    improvement: winnerData.improvement,
                                    declaredAt: new Date(),
                                },
                            },
                        },
                    },
                });
                console.log(`Experiment ${experiment.name} has been automatically completed.`);
            }
        }
        console.log("Finished job: Analyzing active experiments.");
    }
    catch (error) {
        console.error("Error analyzing active experiments:", error);
    }
};
exports.analyzeActiveExperiments = analyzeActiveExperiments;
/**
 * Helper function to calculate experiment winner
 */
const calculateWinner = (variations) => {
    if (!variations || variations.length < 2)
        return null;
    let bestVariation = null;
    for (const variation of variations) {
        const conversionRate = variation.visitors > 0
            ? variation.conversions / variation.visitors
            : 0;
        if (!bestVariation ||
            conversionRate >
                bestVariation.conversions / (bestVariation.visitors || 1)) {
            bestVariation = variation;
        }
    }
    if (!bestVariation)
        return null;
    // Simple heuristic for auto-completion (can be made more robust with statistical significance)
    if (bestVariation.visitors < 100)
        return null;
    return {
        winner: bestVariation.name,
        confidence: 95,
        improvement: bestVariation.conversionRate || 0,
    };
};
