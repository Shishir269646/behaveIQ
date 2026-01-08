const Experiment = require('../models/Experiment');
const Website = require('../models/Website');
const Session = require('../models/Session');
const { asyncHandler } = require('../utils/helpers');

// @desc    Get all experiments
// @route   GET /api/v1/experiments?websiteId=xxx&status=active
const getExperiments = asyncHandler(async (req, res) => {
    const { websiteId, status } = req.query;

    // Verify ownership
    const website = await Website.findOne({
        _id: websiteId,
        userId: req.user._id
    });

    if (!website) {
        return res.status(404).json({
            success: false,
            message: 'Website not found'
        });
    }

    const query = { websiteId };
    if (status) query.status = status;

    const experiments = await Experiment.find(query)
        .sort('-createdAt')
        .select('-__v');

    res.json({
        success: true,
        count: experiments.length,
        data: { experiments }
    });
});

// @desc    Create new experiment
// @route   POST /api/v1/experiments
const createExperiment = asyncHandler(async (req, res) => {
    const {
        websiteId,
        name,
        description,
        variations,
        settings
    } = req.body;

    // Verify ownership
    const website = await Website.findOne({
        _id: websiteId,
        userId: req.user._id
    });

    if (!website) {
        return res.status(404).json({
            success: false,
            message: 'Website not found'
        });
    }

    // Validate variations
    if (!variations || variations.length < 2) {
        return res.status(400).json({
            success: false,
            message: 'At least 2 variations required'
        });
    }

    // Ensure one control variation
    const hasControl = variations.some(v => v.isControl);
    if (!hasControl) {
        variations[0].isControl = true;
    }

    const experiment = await Experiment.create({
        websiteId,
        name,
        description,
        variations,
        settings: settings || {},
        status: 'draft'
    });

    res.status(201).json({
        success: true,
        data: { experiment }
    });
});

// @desc    Get single experiment with results
// @route   GET /api/v1/experiments/:id
const getExperiment = asyncHandler(async (req, res) => {
    const experiment = await Experiment.findById(req.params.id);

    if (!experiment) {
        return res.status(404).json({
            success: false,
            message: 'Experiment not found'
        });
    }

    // Verify ownership
    const website = await Website.findOne({
        _id: experiment.websiteId,
        userId: req.user._id
    });

    if (!website) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized'
        });
    }

    // Calculate latest results
    if (experiment.status === 'active') {
        for (const variation of experiment.variations) {
            const sessions = await Session.find({
                websiteId: experiment.websiteId,
                experimentId: experiment._id,
                experimentVariation: variation.name
            });

            variation.visitors = sessions.length;
            variation.conversions = sessions.filter(s => s.converted).length;
            variation.conversionRate = variation.visitors > 0
                ? ((variation.conversions / variation.visitors) * 100).toFixed(2)
                : 0;
        }

        // Calculate winner
        const winnerData = experiment.calculateWinner();
        if (winnerData) {
            experiment.results = {
                ...winnerData,
                declaredAt: experiment.results?.declaredAt || null
            };
        }

        await experiment.save();
    }

    res.json({
        success: true,
        data: { experiment }
    });
});

// @desc    Update experiment status
// @route   PATCH /api/v1/experiments/:id/status
const updateExperimentStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;

    const experiment = await Experiment.findById(req.params.id);

    if (!experiment) {
        return res.status(404).json({
            success: false,
            message: 'Experiment not found'
        });
    }

    // Update status
    experiment.status = status;

    if (status === 'active' && !experiment.startDate) {
        experiment.startDate = new Date();
    }

    if (status === 'completed' && !experiment.endDate) {
        experiment.endDate = new Date();
    }

    await experiment.save();

    res.json({
        success: true,
        data: { experiment }
    });
});

// @desc    Declare winner manually
// @route   POST /api/v1/experiments/:id/declare-winner
const declareWinner = asyncHandler(async (req, res) => {
    const { winningVariation } = req.body;

    const experiment = await Experiment.findById(req.params.id);

    if (!experiment) {
        return res.status(404).json({
            success: false,
            message: 'Experiment not found'
        });
    }

    const winner = experiment.variations.find(v => v.name === winningVariation);

    if (!winner) {
        return res.status(400).json({
            success: false,
            message: 'Invalid variation name'
        });
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

    res.json({
        success: true,
        message: 'Winner declared successfully',
        data: { experiment }
    });
});


module.exports = {
    getExperiments,
    createExperiment,
    getExperiment,
    updateExperimentStatus,
    declareWinner
};