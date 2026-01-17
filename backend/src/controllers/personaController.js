const Persona = require('../models/Persona');
const Website = require('../models/Website');
const Session = require('../models/Session');
const { callMLService } = require('../services/mlServiceClient');
const { asyncHandler } = require('../utils/helpers');

// @desc    Get all personas for a specific website
// @route   GET /api/v1/websites/:id/personas
const getPersonas = asyncHandler(async (req, res) => {
    console.log('--- getPersonas called ---');
    const websiteId = req.params.websiteId;

    if (!websiteId) {
        return res.status(400).json({
            success: false,
            message: 'No website ID provided.'
        });
    }

    console.log(`Fetching personas for websiteId: ${websiteId}, userId: ${req.user._id}`);

    const personas = await Persona.find({ websiteId, isActive: true }).sort('-stats.sessionCount');

    res.json({
        success: true,
        count: personas.length,
        data: { personas }
    });
});

// @desc    Discover new personas using ML
// @route   POST /api/v1/personas/discover
const discoverPersonas = asyncHandler(async (req, res) => {
    console.log('--- discoverPersonas called ---');

    if (!req.website || !req.website._id) {
        return res.status(400).json({
            success: false,
            message: 'No website context found. Please ensure you are authenticated and have an associated website.'
        });
    }

    const websiteId = req.website._id;
    const { minSessions = 10 } = req.body;

    // Check session count
    const sessionCount = await Session.countDocuments({ websiteId });
    if (sessionCount < minSessions) {
        return res.status(400).json({
            success: false,
            message: `Need at least ${minSessions} sessions. Current: ${sessionCount}`
        });
    }

    // Get session data
    const sessions = await Session.find({ websiteId })
        .select('intentScore behavior device')
        .limit(1000)
        .lean();

    const formattedSessions = sessions.map(s => {
        const pageViews = s.behavior?.pageViews || [];
        const clicks = s.behavior?.clicks || [];

        const totalTimeSpent = pageViews.reduce((sum, pv) => sum + (pv.timeSpent || 0), 0);
        const avgScrollDepth = pageViews.length
            ? pageViews.reduce((sum, pv) => sum + (pv.scrollDepth || 0), 0) / pageViews.length
            : 0;

        // 🔹 Device must be object
        const deviceObj = typeof s.device === 'object'
            ? s.device
            : { type: s.device || 'unknown' };

        let intentScore = 0.3;
        if (s.intentScore?.final != null) intentScore = s.intentScore.final;
        else if (s.intentScore?.initial != null) intentScore = s.intentScore.initial;
        else if (clicks.length > 5) intentScore = 0.6;

        return {
            _id: s._id.toString(),        // 🔹 include _id
            device: deviceObj,            // 🔹 send as object
            intentScore: Number(intentScore),
            avgScrollDepth: Number(avgScrollDepth),
            totalClicks: Number(clicks.length),
            pageViews: Number(pageViews.length),
            totalTimeSpent: Number(totalTimeSpent),
            pagesVisited: pageViews.map(pv => pv.url).slice(0, 10)
        };
    });


    // Prepare ML payload with exact fields ML expects
    // After mapping sessions to formattedSessions
    const meaningfulSessions = formattedSessions.filter(
        s => s.totalClicks > 0 || s.pageViews > 0 || s.totalTimeSpent > 0 || s.avgScrollDepth > 0
    );

    if (meaningfulSessions.length < 3) {
        return res.status(400).json({
            success: false,
            message: 'Not enough meaningful session data for persona discovery'
        });
    }

    // Then use meaningfulSessions in ML payload
    const mlPayload = {
        websiteId: websiteId.toString(),
        sessionData: meaningfulSessions.map(s => ({
            _id: s._id,        // required
            device: s.device,   // must be object
            intentScore: Number(s.intentScore),
            avgScrollDepth: Number(s.avgScrollDepth),
            totalClicks: Number(s.totalClicks),
            pageViews: Number(s.pageViews),
            totalTimeSpent: Number(s.totalTimeSpent),
            pagesVisited: s.pagesVisited
        })),
        minClusters: 3,
        maxClusters: 6
    };



    if (mlPayload.sessionData.length < 3) {
        return res.status(400).json({
            success: false,
            message: 'Not enough meaningful session data for persona discovery'
        });
    }

    // Call ML service
    const mlResult = await callMLService('/clustering/discover-personas', mlPayload);

    // Save discovered personas
    const createdPersonas = [];
    for (const personaData of mlResult.personas) {
        const persona = await Persona.create({
            websiteId,
            name: personaData.name,
            description: personaData.description,
            clusterData: personaData.clusterData,
            sessionIds: personaData.sessionIds,
            isAutoDiscovered: true
        });

        await Session.updateMany(
            { websiteId, _id: { $in: personaData.sessionIds || [] } },
            { personaType: persona.name, personaId: persona._id }
        );

        await persona.updateStats();
        createdPersonas.push(persona);
    }

    // Update website stats
    req.website.stats.totalPersonas = createdPersonas.length;
    await req.website.save();

    res.json({
        success: true,
        message: `Discovered ${createdPersonas.length} personas`,
        data: { personas: createdPersonas }
    });
});

// Other endpoints remain unchanged
const getPersona = asyncHandler(async (req, res) => {
    const persona = await Persona.findById(req.params.id).populate('websiteId', 'name domain');

    if (!persona) return res.status(404).json({ success: false, message: 'Persona not found' });

    if (!req.website || !req.website._id || persona.websiteId.toString() !== req.website._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to access this persona.' });
    }

    res.json({ success: true, data: { persona } });
});

const updatePersona = asyncHandler(async (req, res) => {
    const { name, description, isActive } = req.body;

    let persona = await Persona.findById(req.params.id);
    if (!persona) return res.status(404).json({ success: false, message: 'Persona not found' });

    if (!req.website || !req.website._id || persona.websiteId.toString() !== req.website._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this persona.' });
    }

    persona = await Persona.findByIdAndUpdate(req.params.id, { name, description, isActive }, { new: true, runValidators: true });

    res.json({ success: true, data: { persona } });
});

const createPersonalizationRule = asyncHandler(async (req, res) => {
    const { selector, content, contentType, variation, priority } = req.body;
    const persona = await Persona.findById(req.params.id);
    if (!persona) return res.status(404).json({ success: false, message: 'Persona not found' });

    if (!req.website || !req.website._id || persona.websiteId.toString() !== req.website._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to create personalization rule for this persona.' });
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

    res.status(201).json({ success: true, data: { rule: persona.personalizationRules.slice(-1)[0] } });
});

module.exports = {
    getPersonas,
    discoverPersonas,
    getPersona,
    updatePersona,
    createPersonalizationRule
};
