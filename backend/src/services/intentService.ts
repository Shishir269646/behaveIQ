import { prisma } from '../config/database';

/**
 * Calculate intent score for a session
 */
export const calculateIntentScore = async (sessionId: string): Promise<number | undefined> => {
    try {
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: { 
                behavior: {
                    include: {
                        pageViews: true,
                        clicks: true
                    }
                }
            }
        });

        if (!session) return;

        const timeSpent = session.duration || 0;
        const pageViews = session.behavior?.pageViews.length || 0;
        const totalClicks = session.behavior?.clicks.length || 0;
        
        // Calculate average scroll depth
        const avgScrollDepth = session.behavior?.pageViews.reduce((acc, pv) => acc + (pv.scrollDepth || 0), 0) || 0;
        const scrollDepth = pageViews > 0 ? avgScrollDepth / pageViews : 0;

        const clickRate = totalClicks / Math.max(pageViews, 1);

        // Normalize values
        const normalizedTime = Math.min(timeSpent / 300, 1); // Max 5 minutes
        const normalizedScroll = Math.min(scrollDepth / 100, 1);
        const normalizedClick = Math.min(clickRate, 1);

        // Intent Score Formula: (Time × 0.3) + (Scroll × 0.2) + (Click × 0.5)
        const intentScoreValue =
            (normalizedTime * 0.3) +
            (normalizedScroll * 0.2) +
            (normalizedClick * 0.5);
        
        const finalIntentScore = Math.min(intentScoreValue, 1);
        const score100 = Math.round(finalIntentScore * 100);

        // Update session's SessionIntentScore
        await prisma.sessionIntentScore.upsert({
            where: { sessionId: session.id },
            update: { 
                final: score100,
                peak: {
                    set: Math.max(score100, (await prisma.sessionIntentScore.findUnique({ where: { sessionId: session.id } }))?.peak || 0)
                }
            },
            create: { 
                sessionId: session.id,
                initial: score100,
                final: score100,
                peak: score100
            }
        });

        // Also update User's UserIntentScore if userId exists
        if (session.userId) {
            await prisma.userIntentScore.upsert({
                where: { userId: session.userId },
                update: { current: score100 },
                create: { userId: session.userId, current: score100 }
            });
        }

        return finalIntentScore;

    } catch (error) {
        console.error('Intent calculation error:', error);
        throw error;
    }
};

/**
 * Get intent distribution for website
 */
export const getIntentDistribution = async (websiteId: string) => {
    const sessions = await prisma.session.findMany({
        where: { websiteId },
        select: {
            intentScore: {
                select: {
                    final: true
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
        const score = session.intentScore?.final || 0;
        if (score < 40) distribution.low++;
        else if (score < 70) distribution.medium++;
        else distribution.high++;
    });

    return distribution;
};
