const { prisma } = require('../config/database'); // Import prisma client

/**
 * Calculate intent score for a session
 */
exports.calculateIntentScore = async (sessionId) => {
    try {
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: { behavior: true } // Include behavior to get totalTimeSpent, avgScrollDepth
        });

        if (!session) return;

        // Get session events
        const events = await prisma.event.findMany({
            where: { sessionId },
            orderBy: { timestamp: 'asc' }
        });

        if (events.length === 0) return;

        // Calculate metrics - these fields are now nested under session.behavior
        const timeSpent = session.behavior?.totalTimeSpent || 0;
        const scrollDepth = session.behavior?.avgScrollDepth || 0;
        // Assuming totalClicks and pageViews would be available through session.behavior or derived from events
        // For now, let's simplify as original Mongoose code might have calculated this differently
        // If 'totalClicks' and 'pageViews' are not directly in SessionBehavior, they need to be calculated
        // from 'clicks' and 'pageViews' arrays within SessionBehavior.
        const totalClicks = session.behavior?.clicks.length || 0; // Simplified for now
        const pageViews = session.behavior?.pageViews.length || 0; // Simplified for now
        const clickRate = totalClicks / Math.max(pageViews, 1);

        // Normalize values
        const normalizedTime = Math.min(timeSpent / 300, 1); // Max 5 minutes
        const normalizedScroll = scrollDepth;
        const normalizedClick = Math.min(clickRate, 1);

        // Intent Score Formula: (Time × 0.3) + (Scroll × 0.2) + (Click × 0.5)
        const intentScoreValue =
            (normalizedTime * 0.3) +
            (normalizedScroll * 0.2) +
            (normalizedClick * 0.5);
        
        const finalIntentScore = Math.min(intentScoreValue, 1);

        // Update session
        await prisma.session.update({
            where: { id: sessionId },
            data: {
                intentScore: {
                    upsert: { // Create or update the UserIntentScore record
                        create: { current: Math.round(finalIntentScore * 100) },
                        update: { current: Math.round(finalIntentScore * 100) }
                    }
                }
            }
        });

        return finalIntentScore;

    } catch (error) {
        console.error('Intent calculation error:', error);
        throw error;
    }
};

/**
 * Get intent distribution for website
 */
exports.getIntentDistribution = async (websiteId) => {
    const sessions = await prisma.session.findMany({
        where: { websiteId },
        select: {
            intentScore: {
                select: {
                    current: true
                }
            }
        },
    });

    const distribution = {
        low: 0,
        medium: 0,
        high: 0
    };

    sessions.forEach(session => {
        const score = session.intentScore?.current || 0; // Access current score from nested object
        if (score < 40) distribution.low++; // Scores are 0-100 now
        else if (score < 70) distribution.medium++;
        else distribution.high++;
    });

    return distribution;
};