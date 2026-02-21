const Experiment = require('../models/Experiment');
const Session = require('../models/Session');
const AppError = require('../utils/AppError');

/**
 * Get all experiments
 */
exports.getExperiments = async (websiteId, status) => {
    const query = { websiteId };
    if (status) query.status = status;

    return await Experiment.find(query)
        .sort('-createdAt')
        .select('-__v')
        .lean();
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
    const hasControl = variations.some(v => v.isControl);
    if (!hasControl) {
        variations[0].isControl = true;
    }

    return await Experiment.create({
        websiteId,
        name,
        description,
        variations,
        settings: settings || {},
        status: 'draft'
    });
};

/**
 * Get single experiment with results
 */
exports.getExperiment = async (experimentId) => {
    const experiment = await Experiment.findById(experimentId);
    if (!experiment) {
        throw new AppError('Experiment not found', 404);
    }

    // Calculate latest results if active
    if (experiment.status === 'active') {
        let dirty = false;
        for (const variation of experiment.variations) {
            const sessions = await Session.find({
                websiteId: experiment.websiteId,
                experimentId: experiment._id,
                experimentVariation: variation.name
            }).lean();

            const visitors = sessions.length;
            const conversions = sessions.filter(s => s.converted).length;
            const conversionRate = visitors > 0
                ? ((conversions / visitors) * 100).toFixed(2)
                : 0;
            
            if(variation.visitors !== visitors || variation.conversions !== conversions) {
                 variation.visitors = visitors;
                 variation.conversions = conversions;
                 variation.conversionRate = conversionRate;
                 dirty = true;
            }
        }

        // Calculate winner
        const winnerData = experiment.calculateWinner();
        if (winnerData) {
            experiment.results = {
                ...winnerData,
                declaredAt: experiment.results?.declaredAt || null
            };
            dirty = true;
        }

        if(dirty) await experiment.save();
    }

    return experiment;
};

/**
 * Update experiment status
 */
exports.updateStatus = async (experimentId, status) => {
    const experiment = await Experiment.findById(experimentId);
    if (!experiment) {
        throw new AppError('Experiment not found', 404);
    }

    experiment.status = status;

    if (status === 'active' && !experiment.startDate) {
        experiment.startDate = new Date();
    }

    if (status === 'completed' && !experiment.endDate) {
        experiment.endDate = new Date();
    }

    await experiment.save();
    return experiment;
};

/**
 * Declare winner manually
 */
exports.declareWinner = async (experimentId, winningVariationName) => {
    const experiment = await Experiment.findById(experimentId);
    if (!experiment) {
        throw new AppError('Experiment not found', 404);
    }

    const winner = experiment.variations.find(v => v.name === winningVariationName);
    if (!winner) {
        throw new AppError('Invalid variation name', 400);
    }

    const control = experiment.variations.find(v => v.isControl);
    const improvement = control && control.conversionRate > 0
        ? (((winner.conversionRate - control.conversionRate) / control.conversionRate) * 100).toFixed(2)
        : 0;

    experiment.results = {
        winner: winner.name,
        confidence: 95,
        improvement: parseFloat(improvement),
        declaredAt: new Date()
    };

    experiment.status = 'completed';
    experiment.endDate = new Date();

    await experiment.save();
    return experiment;
};

/**
 * Update experiment details
 */
exports.updateExperiment = async (experimentId, data) => {
    const experiment = await Experiment.findByIdAndUpdate(experimentId, data, {
        new: true,
        runValidators: true
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
    const experiment = await Experiment.findById(experimentId);
    if (!experiment) {
        throw new AppError('Experiment not found', 404);
    }
    await experiment.deleteOne(); // Use deleteOne instead of remove (deprecated)
};