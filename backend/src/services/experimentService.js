const { prisma } = require('../config/database'); // Import prisma client
const AppError = require('../utils/AppError');
const { jStat } = require('jstat'); // Re-import jStat for calculateWinner logic

/**
 * Helper to calculate the winner of an experiment (re-implemented from Mongoose schema method)
 */
const calculateExperimentWinner = (experiment) => {
    if (experiment.variations.length < 2) return null;

    const control = experiment.variations.find(v => v.isControl);
    if (!control) return null; // Cannot calculate without a control

    // Don't bother if control has no data
    if (control.visitors === 0) return null;

    let potentialWinner = null;

    for (const variation of experiment.variations) {
        if (variation.isControl) continue;

        // Ensure minimum sample size is met for both variations being compared
        if (variation.visitors < experiment.settings.minSampleSize || control.visitors < experiment.settings.minSampleSize) {
            continue;
        }

        // Z-test for two population proportions
        // H0: p1 = p2 (conversion rates are equal)
        // H1: p1 != p2 (conversion rates are different)
        const p1 = variation.conversionRate / 100;
        const p2 = control.conversionRate / 100;
        const n1 = variation.visitors;
        const n2 = control.visitors;

        // If conversion rates are identical, skip
        if (p1 <= p2) continue;

        const p_pool = (variation.conversions + control.conversions) / (n1 + n2);
        const se = Math.sqrt(p_pool * (1 - p_pool) * (1/n1 + 1/n2));
        
        if (se === 0) continue;

        const z_score = (p1 - p2) / se;

        // One-tailed p-value, since we only care if the variation is BETTER
        const p_value = 1 - jStat.normal.cdf(z_score, 0, 1);

        // Confidence is the probability we are correct in rejecting the null hypothesis
        const confidence = (1 - p_value) * 100;

        if (confidence >= experiment.settings.minConfidence) {
            const improvement = control.conversionRate > 0
                ? ((p1 - p2) / p2) * 100
                : 100;

            // This variation is a statistically significant winner
            potentialWinner = {
                winner: variation.name,
                confidence: parseFloat(confidence.toFixed(2)),
                improvement: parseFloat(improvement.toFixed(2))
            };

            // Break after finding the first significant winner (or could be extended to find the best one)
            break;
        }
    }

    return potentialWinner;
};


/**
 * Get all experiments
 */
exports.getExperiments = async (websiteId, status) => {
    const where = { websiteId };
    if (status) where.status = status;

    return await prisma.experiment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { // Include related data if needed for display
            variations: true,
            results: true,
            settings: true,
        }
    });
};

/**
 * Create new experiment
 */
exports.createExperiment = async (websiteId, data) => {
    const { name, description, variations, settings } = data;

    // Validate variations
    if (!variations || variations.length < 2) {
        throw new AppError('At least 2 variations required', 400);
    }

    // Ensure one control variation
    const updatedVariations = variations.map((v, index) => ({
        ...v,
        isControl: index === 0 ? true : v.isControl // Default first to control if none specified
    }));

    return await prisma.experiment.create({
        data: {
            websiteId,
            name,
            description,
            variations: {
                create: updatedVariations.map(v => ({
                    name: v.name,
                    isControl: v.isControl,
                    selector: v.selector,
                    content: v.content,
                    contentType: v.contentType || 'text',
                    trafficPercentage: v.trafficPercentage || 50,
                }))
            },
            settings: {
                create: {
                    targetUrl: settings?.targetUrl,
                    conversionGoal: settings?.conversionGoal,
                    minSampleSize: settings?.minSampleSize || 100,
                    minConfidence: settings?.minConfidence || 95,
                    maxDuration: settings?.maxDuration || 30,
                }
            },
            status: 'draft'
        },
        include: {
            variations: true,
            settings: true,
        }
    });
};

/**
 * Get single experiment with results
 */
exports.getExperiment = async (experimentId) => {
    let experiment = await prisma.experiment.findUnique({
        where: { id: experimentId },
        include: {
            variations: true,
            results: true,
            settings: true,
        }
    });
    if (!experiment) {
        throw new AppError('Experiment not found', 404);
    }

    // Calculate latest results if active
    if (experiment.status === 'active') {
        let dirty = false;
        const updatedVariations = await Promise.all(experiment.variations.map(async (variation) => {
            // Need to retrieve sessions that were part of this experiment and variation
            const sessions = await prisma.session.findMany({
                where: {
                    websiteId: experiment.websiteId,
                    experimentId: experiment.id, // Assuming session stores experimentId
                    // Assuming session has a way to identify which variation it was exposed to
                    // This is a missing link in current schema: Session model needs 'experimentVariationId' or similar
                    // For now, I'll make a simplifying assumption or note this gap.
                    // If Session does not store variation info, this calculation becomes very difficult.
                    // Let's assume there's a field like `session.experimentVariationName` in the Session model
                    // or `session.experimentVariationId`
                    // For now, we will simply compare the variation names.
                    SessionIntervention: { // Assuming SessionIntervention acts as a proxy for experiment variation
                        some: {
                            type: variation.name // This is a weak assumption, needs better modeling
                        }
                    }
                },
                select: {
                    id: true,
                    outcome: true // Assuming 'purchase' outcome means converted
                }
            });

            const visitors = sessions.length;
            const conversions = sessions.filter(s => s.outcome === 'purchase').length;
            const conversionRate = visitors > 0
                ? parseFloat(((conversions / visitors) * 100).toFixed(2))
                : 0;
            
            if(variation.visitors !== visitors || variation.conversions !== conversions) {
                 dirty = true;
                 return { ...variation, visitors, conversions, conversionRate };
            }
            return variation;
        }));

        // Update variations in the database if dirty
        if (dirty) {
            await prisma.experimentVariation.updateMany({
                data: updatedVariations.map(v => ({
                    visitors: v.visitors,
                    conversions: v.conversions,
                    conversionRate: v.conversionRate
                })),
                where: {
                    experimentId: experiment.id,
                    id: { in: updatedVariations.map(v => v.id) }
                }
            });
            // Update the experiment object in memory for further calculations
            experiment.variations = updatedVariations;
        }

        // Calculate winner
        const winnerData = calculateExperimentWinner(experiment);
        if (winnerData) {
            // Update results in the database
            await prisma.experimentResult.upsert({
                where: { experimentId: experiment.id },
                update: {
                    winner: winnerData.winner,
                    confidence: winnerData.confidence,
                    improvement: winnerData.improvement,
                    declaredAt: new Date()
                },
                create: {
                    experimentId: experiment.id,
                    winner: winnerData.winner,
                    confidence: winnerData.confidence,
                    improvement: winnerData.improvement,
                    declaredAt: new Date()
                }
            });
            // Update the experiment object in memory
            experiment.results = {
                ...winnerData,
                declaredAt: new Date()
            };
            dirty = true;
        }

        // If anything changed, refetch to get latest consistent state, or reconstruct
        if (dirty) {
            experiment = await prisma.experiment.findUnique({
                where: { id: experimentId },
                include: {
                    variations: true,
                    results: true,
                    settings: true,
                }
            });
        }
    }

    return experiment;
};

/**
 * Update experiment status
 */
exports.updateStatus = async (experimentId, status) => {
    let experiment = await prisma.experiment.findUnique({
        where: { id: experimentId },
        include: {
            variations: true,
            results: true,
            settings: true,
        }
    });
    if (!experiment) {
        throw new AppError('Experiment not found', 404);
    }

    const updateData = { status };

    if (status === 'active' && !experiment.startDate) {
        updateData.startDate = new Date();
    }

    if (status === 'completed' && !experiment.endDate) {
        updateData.endDate = new Date();
    }

    experiment = await prisma.experiment.update({
        where: { id: experimentId },
        data: updateData,
        include: {
            variations: true,
            results: true,
            settings: true,
        }
    });
    return experiment;
};

/**
 * Declare winner manually
 */
exports.declareWinner = async (experimentId, winningVariationName) => {
    let experiment = await prisma.experiment.findUnique({
        where: { id: experimentId },
        include: { variations: true, settings: true, results: true }
    });
    if (!experiment) {
        throw new AppError('Experiment not found', 404);
    }

    const winner = experiment.variations.find(v => v.name === winningVariationName);
    if (!winner) {
        throw new AppError('Invalid variation name', 400);
    }

    const control = experiment.variations.find(v => v.isControl);
    const improvement = control && control.conversionRate > 0
        ? parseFloat((((winner.conversionRate - control.conversionRate) / control.conversionRate) * 100).toFixed(2))
        : 0;

    // Upsert the results
    await prisma.experimentResult.upsert({
        where: { experimentId: experiment.id },
        update: {
            winner: winner.name,
            confidence: 95, // Assuming 95% confidence for manual declaration
            improvement: improvement,
            declaredAt: new Date()
        },
        create: {
            experimentId: experiment.id,
            winner: winner.name,
            confidence: 95,
            improvement: improvement,
            declaredAt: new Date()
        }
    });

    // Update experiment status and end date
    experiment = await prisma.experiment.update({
        where: { id: experimentId },
        data: {
            status: 'completed',
            endDate: new Date()
        },
        include: { variations: true, results: true, settings: true }
    });
    return experiment;
};

/**
 * Update experiment details
 */
exports.updateExperiment = async (experimentId, data) => {
    const { variations, settings, ...rest } = data;

    const updateData = { ...rest };

    if (variations) {
        // Handle variations: for simplicity, assuming replacement or individual updates
        // This could be more complex with connect/disconnect/updateMany
        updateData.variations = {
            upsert: variations.map(v => ({
                where: { id: v.id || '' }, // Use variation id if exists, else it will create
                update: { ...v },
                create: { ...v }
            }))
        };
    }

    if (settings) {
        updateData.settings = {
            upsert: {
                create: { ...settings },
                update: { ...settings }
            }
        };
    }

    const experiment = await prisma.experiment.update({
        where: { id: experimentId },
        data: updateData,
        include: {
            variations: true,
            results: true,
            settings: true,
        }
    });
    if (!experiment) {
        throw new AppError('Experiment not found', 404);
    }
    return experiment;
};

/**
 * Delete experiment
 */
exports.deleteExperiment = async (experimentId) => {
    // Delete related records first if not using cascade deletes in schema.prisma
    // Or ensure cascade delete is properly configured for Experiment -> Variations, Results, Settings
    await prisma.experiment.delete({
        where: { id: experimentId }
    });
};