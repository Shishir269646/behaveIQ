import { prisma } from '../config/database';
import { NotFoundError } from '../utils/AppError';

/**
 * Get abandonment statistics for a specific website
 */
export const getWebsiteAbandonmentStats = async (websiteId: string, userId: string) => {
  const website = await prisma.website.findFirst({
    where: { id: websiteId, userId }
  });

  if (!website) throw new NotFoundError('Website not found');

  const abandonmentEvents = await prisma.event.findMany({
    where: { 
      websiteId,
      eventType: 'ABANDONMENT_INTENT'
    },
    include: { session: true }
  });

  // Calculate metrics (simplified for brevity)
  const totalIntents = abandonmentEvents.length;
  const recoveredSessions = abandonmentEvents.filter(e => (e.eventData as any).recovered).length;

  return {
    totalIntents,
    recoveredSessions,
    recoveryRate: totalIntents > 0 ? (recoveredSessions / totalIntents) * 100 : 0,
    events: abandonmentEvents.slice(0, 100) // Return recent events
  };
};

/**
 * Process abandonment intent from SDK
 */
export const processAbandonmentIntent = async (data: any) => {
  const { sessionId, websiteId, metadata } = data;

  return prisma.event.create({
    data: {
      sessionId,
      websiteId,
      eventType: 'ABANDONMENT_INTENT',
      eventData: metadata || {},
    }
  });
};
