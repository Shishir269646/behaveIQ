const Persona = require('../models/Persona');
const Website = require('../models/Website');
const Session = require('../models/Session');
const { callMLService } = require('../services/mlServiceClient');
const { asyncHandler } = require('../utils/helpers');

// @desc    Get all personas for a specific website
// @route   GET /api/v1/websites/:id/personas
const getPersonas = asyncHandler(async (req, res) => {
    console.log('--- getPersonas called ---'); // ADDED for debugging

    // The website ID is now coming from the nested route parameter
    const websiteId = req.params.id;

    if (!websiteId) {
        console.warn('getPersonas: No website ID provided in the route.');
        return res.status(400).json({
            success: false,
            message: 'No website ID provided.'
        });
    }

    // The `protect` middleware already ensures the user is authenticated.
    // The association between user and website is handled by the `protect` middleware.

    console.log(`Fetching personas for websiteId: ${websiteId}, userId: ${req.user._id}`); // ADDED for debugging

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
const discoverPersonas = asyncHandler(async (req, res) => {
    // Ensure req.website is populated by the auth middleware
    if (!req.website || !req.website._id) {
        console.warn('discoverPersonas: No website context found for authenticated user.');
        return res.status(400).json({
            success: false,
            message: 'No website context found. Please ensure you are authenticated and have an associated website.'
        });
    }

    const websiteId = req.website._id;
    const { minSessions = 100 } = req.body;

    // The website ownership is now verified by the auth middleware populating req.website
    // No need for explicit Website.findOne here.
    const website = req.website; 

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
const getPersona = asyncHandler(async (req, res) => {
    const persona = await Persona.findById(req.params.id)
        .populate('websiteId', 'name domain');

    if (!persona) {
        return res.status(404).json({
            success: false,
            message: 'Persona not found'
        });
    }

    // Ensure req.website is populated by the auth middleware
    if (!req.website || !req.website._id || persona.websiteId.toString() !== req.website._id.toString()) {
        console.warn('getPersona: Not authorized to access this persona or website context missing.');
        return res.status(403).json({
            success: false,
            message: 'Not authorized to access this persona.'
        });
    }

    res.json({
        success: true,
        data: { persona }
    });
});

// @desc    Update persona
// @route   PATCH /api/v1/personas/:id
const updatePersona = asyncHandler(async (req, res) => {
    const { name, description, isActive } = req.body;

    let persona = await Persona.findById(req.params.id);

    if (!persona) {
        return res.status(404).json({
            success: false,
            message: 'Persona not found'
        });
    }

    // Ensure req.website is populated by the auth middleware and matches persona's websiteId
    if (!req.website || !req.website._id || persona.websiteId.toString() !== req.website._id.toString()) {
        console.warn('updatePersona: Not authorized to update this persona or website context missing.');
        return res.status(403).json({
            success: false,
            message: 'Not authorized to update this persona.'
        });
    }

    persona = await Persona.findByIdAndUpdate(
        req.params.id,
        { name, description, isActive },
        { new: true, runValidators: true }
    );

    res.json({
        success: true,
        data: { persona }
    });
});

// @desc    Create personalization rule
// @route   POST /api/v1/personas/:id/personalization-rules
const createPersonalizationRule = asyncHandler(async (req, res) => {
    const { selector, content, contentType, variation, priority } = req.body;

    const persona = await Persona.findById(req.params.id);

    if (!persona) {
        return res.status(404).json({
            success: false,
            message: 'Persona not found'
        });
    }

    // Ensure req.website is populated by the auth middleware and matches persona's websiteId
    if (!req.website || !req.website._id || persona.websiteId.toString() !== req.website._id.toString()) {
        console.warn('createPersonalizationRule: Not authorized to create rule for this persona or website context missing.');
        return res.status(403).json({
            success: false,
            message: 'Not authorized to create personalization rule for this persona.'
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


module.exports = {
    getPersonas,
    discoverPersonas,
    getPersona,
    updatePersona,
    createPersonalizationRule
};