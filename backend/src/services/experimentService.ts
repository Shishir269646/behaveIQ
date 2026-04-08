import { prisma } from '../config/database';
import AppError from '../utils/AppError';
import { ExperimentStatus, VariationContentType } from '@prisma/client';
const { jStat } = require('jstat');

/**
 * Helper to calculate the winner of an experiment
 */
const calculateExperimentWinner = (experiment: any) => {
    if (experiment.variations.length < 2) return null;

    const control = experiment.variations.find((v: any) => v.isControl);
    if (!control) return null;

    if (control.visitors === 0) return null;

    let potentialWinner = null;

    for (const variation of experiment.variations) {
        if (variation.isControl) continue;

        if (variation.visitors < experiment.settings.minSampleSize || control.visitors < experiment.settings.minSampleSize) {
            continue;
        }

        const p1 = variation.conversionRate / 100;
        const p2 = control.conversionRate / 100;
        const n1 = variation.visitors;
        const n2 = control.visitors;

        if (p1 <= p2) continue;

        const p_pool = (variation.conversions + control.conversions) / (n1 + n2);
        const se = Math.sqrt(p_pool * (1 - p_pool) * (1/n1 + 1/n2));
        
        if (se === 0) continue;

        const z_score = (p1 - p2) / se;
        const p_value = 1 - jStat.normal.cdf(z_score, 0, 1);
        const confidence = (1 - p_value) * 100;

        if (confidence >= experiment.settings.minConfidence) {
            const improvement = control.conversionRate > 0
                ? ((p1 - p2) / p2) * 100
                : 100;

            potentialWinner = {
                winner: variation.name,
                confidence: parseFloat(confidence.toFixed(2)),
                improvement: parseFloat(improvement.toFixed(2))
            };
            break;
        }
    }

    return potentialWinner;
};


/**
 * Get all experiments
 */
export const getExperiments = async (websiteId: string, status?: string) => {
    const where: any = { websiteId };
    if (status) where.status = status as ExperimentStatus;

    return await prisma.experiment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            variations: true,
            results: true,
            settings: true,
        }
    });
};

/**
 * Create new experiment
 */
export const createExperiment = async (websiteId: string, data: any) => {
    const { name, description, variations, settings } = data;

    if (!variations || variations.length < 2) {
        throw new AppError('At least 2 variations required', 400);
    }

    const updatedVariations = variations.map((v: any, index: number) => ({
        ...v,
        isControl: index === 0 ? true : v.isControl
    }));

    return await prisma.experiment.create({
        data: {
            websiteId,
            name,
            description,
            variations: {
                create: updatedVariations.map((v: any) => ({
                    name: v.name,
                    isControl: v.isControl,
                    selector: v.selector,
                    content: v.content,
                    contentType: (v.contentType as VariationContentType) || 'text',
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
export const getExperiment = async (experimentId: string): Promise<any> => {
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
        const updatedVariations = await Promise.all(experiment.variations.map(async (variation: any) => {
            const sessionsCount = await prisma.session.count({
                where: {
                    websiteId: experiment!.websiteId,
                    experimentId: experiment!.id,
                }
            });

            const conversionsCount = await prisma.session.count({
                where: {
                    websiteId: experiment!.websiteId,
                    experimentId: experiment!.id,
                    outcome: 'purchase'
                }
            });

            const visitors = sessionsCount;
            const conversions = conversionsCount;
            const conversionRate = visitors > 0
                ? parseFloat(((conversions / visitors) * 100).toFixed(2))
                : 0;
            
            if(variation.visitors !== visitors || variation.conversions !== conversions) {
                 dirty = true;
                 return { ...variation, visitors, conversions, conversionRate };
            }
            return variation;
        }));

        if (dirty) {
            // Bulk update not directly supported in Prisma for varied data, doing it individually for now
            for (const v of updatedVariations) {
                await prisma.experimentVariation.update({
                    where: { id: v.id },
                    data: {
                        visitors: v.visitors,
                        conversions: v.conversions,
                        conversionRate: v.conversionRate
                    }
                });
            }
            (experiment as any).variations = updatedVariations;
        }

        const winnerData = calculateExperimentWinner(experiment);
        if (winnerData) {
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
            (experiment as any).results = {
                ...winnerData,
                declaredAt: new Date()
            };
            dirty = true;
        }

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
export const updateStatus = async (experimentId: string, status: string) => {
    const experiment = await prisma.experiment.findUnique({
        where: { id: experimentId },
    });
    if (!experiment) {
        throw new AppError('Experiment not found', 404);
    }

    const updateData: any = { status: status as ExperimentStatus };

    if (status === 'active' && !experiment.startDate) {
        updateData.startDate = new Date();
    }

    if (status === 'completed' && !experiment.endDate) {
        updateData.endDate = new Date();
    }

    return await prisma.experiment.update({
        where: { id: experimentId },
        data: updateData,
        include: {
            variations: true,
            results: true,
            settings: true,
        }
    });
};

/**
 * Declare winner manually
 */
export const declareWinner = async (experimentId: string, winningVariationName: string) => {
    let experiment = await prisma.experiment.findUnique({
        where: { id: experimentId },
        include: { variations: true, settings: true, results: true }
    });
    if (!experiment) {
        throw new AppError('Experiment not found', 404);
    }

    const winner = experiment.variations.find((v: any) => v.name === winningVariationName);
    if (!winner) {
        throw new AppError('Invalid variation name', 400);
    }

    const control = experiment.variations.find((v: any) => v.isControl);
    const improvement = control && control.conversionRate > 0
        ? parseFloat((((winner.conversionRate - control.conversionRate) / control.conversionRate) * 100).toFixed(2))
        : 0;

    await prisma.experimentResult.upsert({
        where: { experimentId: experiment.id },
        update: {
            winner: winner.name,
            confidence: 95,
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

    return await prisma.experiment.update({
        where: { id: experimentId },
        data: {
            status: 'completed',
            endDate: new Date()
        },
        include: { variations: true, results: true, settings: true }
    });
};

/**
 * Update experiment details
 */
export const updateExperiment = async (experimentId: string, data: any) => {
    const { variations, settings, ...rest } = data;
    const updateData: any = { ...rest };

    if (variations) {
        updateData.variations = {
            deleteMany: {},
            create: variations.map((v: any) => ({
                name: v.name,
                isControl: v.isControl,
                selector: v.selector,
                content: v.content,
                contentType: (v.contentType as VariationContentType) || 'text',
                trafficPercentage: v.trafficPercentage || 50,
            }))
        };
    }

    if (settings) {
        updateData.settings = {
            update: { ...settings }
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
export const deleteExperiment = async (experimentId: string) => {
    await prisma.experiment.delete({
        where: { id: experimentId }
    });
};
