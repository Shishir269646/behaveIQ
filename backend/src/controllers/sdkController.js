const Session = require('../models/Session');
const Event = require('../models/Event');
const Website = require('../models/Website');
const { calculateIntentScore } = require('../services/intentService');
const { getPersonalization } = require('../services/personalizationService');
const { getCached, setCached } = require('../services/cacheService');
const { asyncHandler } = require('../utils/helpers');

// @desc    Track user event
// @route   POST /api/v1/sdk/track
exports.trackEvent = asyncHandler(async (req, res) => {
    const {
        apiKey,
        sessionId,
        eventType,
        eventData,
        userAgent,
        fingerprint
    } = req.body;

    // Validate API Key
    const website = await Website.findOne({ apiKey });
    if (!website) {
        return res.status(401).json({ error: 'Invalid API key' });
    }

    // Find or Create Session
    let session = await Session.findOne({ sessionId });

    if (!session) {
        session = await Session.create({
            websiteId: website._id,
            sessionId,
            fingerprint,
            userAgent,
            ipAddress: req.ip || req.headers['x-forwarded-for'],
            landingPage: eventData.pageUrl,
            referrer: eventData.referrer,
            device: parseUserAgent(userAgent)
        });

        // Update website stats
        website.stats.totalSessions += 1;
        await website.save();
    } else {
        // Update last activity
        session.lastActivityTime = new Date();
        await session.save();
    }

    // Create Event
    const event = await Event.create({
        sessionId: session._id,
        websiteId: website._id,
        eventType,
        eventData,
        timestamp: new Date()
    });

    // Update Session Metrics
    await updateSessionMetrics(session, event);

    // Calculate Intent Score (async, don't wait)
    if (session.pageViews > 2) {
        calculateIntentScore(session._id).catch(err =>
            console.error('Intent calculation error:', err)
        );
    }

    // Update website event count
    website.stats.totalEvents += 1;
    await website.save();

    res.json({
        success: true,
        sessionId: session.sessionId
    });
});

// @desc    Get personalization rules
// @route   GET /api/v1/sdk/personalize/:apiKey/:sessionId
exports.getPersonalization = asyncHandler(async (req, res) => {
    const { apiKey, sessionId } = req.params;

    // Check cache first
    const cacheKey = `personalization:${sessionId}`;
    const cached = await getCached(cacheKey);

    if (cached) {
        return res.json(JSON.parse(cached));
    }

    // Validate API Key
    const website = await Website.findOne({ apiKey });
    if (!website) {
        return res.status(401).json({ error: 'Invalid API key' });
    }

    // Check if in learning mode
    if (website.status === 'learning') {
        return res.json({
            personalizationRules: [],
            message: 'In learning mode',
            status: 'learning'
        });
    }

    // Get session
    const session = await Session.findOne({ sessionId });
    if (!session) {
        return res.json({ personalizationRules: [] });
    }

    // Get personalization rules
    const personalizationData = await getPersonalization(
        website._id,
        session.personaType,
        session.intentScore,
        session.personaId
    );

    // Mark personalization as applied
    if (personalizationData.personalizationRules.length > 0) {
        session.personalizationApplied = true;
        await session.save();
    }

    // Cache for 5 minutes
    await setCached(cacheKey, JSON.stringify(personalizationData), 300);

    res.json(personalizationData);
});

// @desc    Calculate real-time intent
// @route   POST /api/v1/sdk/intent-score
exports.calculateIntent = asyncHandler(async (req, res) => {
    const { sessionId, timeSpent, scrollDepth, clickRate } = req.body;

    // Intent Score Formula: (Time × 0.3) + (Scroll × 0.2) + (Click × 0.5)
    const normalizedTime = Math.min(timeSpent / 300, 1); // Max 5 minutes
    const normalizedScroll = scrollDepth;
    const normalizedClick = Math.min(clickRate, 1);

    const intentScore =
        (normalizedTime * 0.3) +
        (normalizedScroll * 0.2) +
        (normalizedClick * 0.5);

    // Determine intent level
    let intent = 'low-intent';
    if (intentScore > 0.7) intent = 'high-purchase-intent';
    else if (intentScore > 0.4) intent = 'medium-intent';

    // Update session
    await Session.findOneAndUpdate(
        { sessionId },
        { intentScore: Math.min(intentScore, 1) }
    );

    res.json({
        intentScore: parseFloat(Math.min(intentScore, 1).toFixed(2)),
        intent
    });
});

// Helper functions
function parseUserAgent(ua) {
    const mobile = /mobile|android|iphone|ipad|phone/i.test(ua);
    const tablet = /tablet|ipad/i.test(ua);

    return {
        type: mobile ? 'mobile' : tablet ? 'tablet' : 'desktop',
        browser: ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : 'Other',
        os: ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'Mac' : 'Other'
    };
}

async function updateSessionMetrics(session, event) {
    const { eventType, eventData } = event;

    switch (eventType) {
        case 'pageview':
            session.pageViews += 1;
            if (!session.pagesVisited.includes(eventData.pageUrl)) {
                session.pagesVisited.push(eventData.pageUrl);
            }
            break;

        case 'click':
            session.totalClicks += 1;
            break;

        case 'scroll':
            if (eventData.scrollDepth) {
                const currentAvg = session.avgScrollDepth || 0;
                const totalEvents = session.pageViews;
                session.avgScrollDepth =
                    (currentAvg * (totalEvents - 1) + eventData.scrollDepth) / totalEvents;

                if (eventData.scrollDepth > session.maxScrollDepth) {
                    session.maxScrollDepth = eventData.scrollDepth;
                }
            }
            break;

        case 'exit':
            session.endTime = new Date();
            session.exitPage = eventData.pageUrl;
            break;
    }

    if (eventData.timeSpent) {
        session.totalTimeSpent += eventData.timeSpent;
    }

    await session.save();
}

