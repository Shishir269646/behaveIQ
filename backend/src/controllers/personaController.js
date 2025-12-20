const Persona = require('../models/Persona');
const Website = require('../models/Website');
const Session = require('../models/Session');
const { callMLService } = require('../services/mlServiceClient');
const { asyncHandler } = require('../utils/helpers');

// @desc    Get all personas
// @route   GET /api/v1/personas?websiteId=xxx
exports.getPersonas = asyncHandler(async (req, res) => {
    const { websiteId } = req.query;

    // Verify website ownership
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

    const personas = await Persona.find({
        websiteId,
        isActive: true
    }).sort('-stats.sessionCount');

    res.json({
        success: true,
        count: personas.length,
        data: { personas }
    });
});

// @desc    Discover new personas using ML
// @route   POST /api/v1/personas/discover
exports.discoverPersonas = asyncHandler(async (req, res) => {
    const { websiteId, minSessions = 100 } = req.body;

    // Verify website ownership
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

    // Check if enough data
    const sessionCount = await Session.countDocuments({ websiteId });
    if (sessionCount < minSessions) {
        return res.status(400).json({
            success: false,
            message: `Need at least ${minSessions} sessions. Current: ${sessionCount}`
        });
    }

    // Get session data for ML
    const sessions = await Session.find({ websiteId })
        .select('intentScore avgScrollDepth totalClicks pageViews totalTimeSpent pagesVisited device')
        .limit(1000)
        .lean();

    // Call ML service for clustering
    const mlResult = await callMLService('/clustering/discover-personas', {
        websiteId: websiteId.toString(),
        sessionData: sessions,
        minClusters: 3,
        maxClusters: 6
    });

    // Save discovered personas
    const createdPersonas = [];
    for (const personaData of mlResult.personas) {
        const persona = await Persona.create({
            websiteId,
            name: personaData.name,
            description: personaData.description,
            clusterData: personaData.clusterData,
            isAutoDiscovered: true
        });

        // Update sessions with persona assignment
        await Session.updateMany(
            {
                websiteId,
                _id: { $in: personaData.sessionIds || [] }
            },
            {
                personaType: persona.name,
                personaId: persona._id
            }
        );

        // Calculate initial stats
        await persona.updateStats();
        createdPersonas.push(persona);
    }

    // Update website persona count
    website.stats.totalPersonas = createdPersonas.length;
    await website.save();

    res.json({
        success: true,
        message: `Discovered ${createdPersonas.length} personas`,
        data: { personas: createdPersonas }
    });
});

// @desc    Get single persona
// @route   GET /api/v1/personas/:id
exports.getPersona = asyncHandler(async (req, res) => {
    const persona = await Persona.findById(req.params.id)
        .populate('websiteId', 'name domain');

    if (!persona) {
        return res.status(404).json({
            success: false,
            message: 'Persona not found'
        });
    }

    // Verify ownership
    const website = await Website.findOne({
        _id: persona.websiteId,
        userId: req.user._id
    });

    if (!website) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized'
        });
    }

    res.json({
        success: true,
        data: { persona }
    });
});

// @desc    Update persona
// @route   PATCH /api/v1/personas/:id
exports.updatePersona = asyncHandler(async (req, res) => {
    const { name, description, isActive } = req.body;

    const persona = await Persona.findByIdAndUpdate(
        req.params.id,
        { name, description, isActive },
        { new: true, runValidators: true }
    );

    if (!persona) {
        return res.status(404).json({
            success: false,
            message: 'Persona not found'
        });
    }

    res.json({
        success: true,
        data: { persona }
    });
});

// @desc    Create personalization rule
// @route   POST /api/v1/personas/:id/personalization-rules
exports.createPersonalizationRule = asyncHandler(async (req, res) => {
    const { selector, content, contentType, variation, priority } = req.body;

    const persona = await Persona.findById(req.params.id);

    if (!persona) {
        return res.status(404).json({
            success: false,
            message: 'Persona not found'
        });
    }

    persona.personalizationRules.push({
        selector,
        content,
        contentType: contentType || 'text',
        variation: variation || 'default',
        priority: priority || 1,
        isActive: true,
        createdAt: new Date()
    });

    await persona.save();

    res.status(201).json({
        success: true,
        data: {
            rule: persona.personalizationRules[persona.personalizationRules.length - 1]
        }
    });
});