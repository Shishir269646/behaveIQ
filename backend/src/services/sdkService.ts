import { prisma } from '../config/database';
import AppError from '../utils/AppError';
import * as mlServiceClient from './mlServiceClient'; // Assuming mlServiceClient is in services
import { generateSessionId } from '../utils/helpers'; // Assuming this utility is available

/**
 * Helper to validate API key and get website
 */
export const getWebsiteByApiKey = async (apiKey: string) => {
  const website = await prisma.website.findUnique({
    where: { apiKey },
    include: { settings: true },
  });
  if (!website) {
    throw new AppError('Invalid API Key', 401);
  }
  return website;
};

/**
 * Get SDK configuration for a given API key
 */
export const getSDKConfiguration = async (apiKey: string) => {
  const website = await getWebsiteByApiKey(apiKey);
  return {
    websiteId: website.id,
    name: website.name,
    settings: website.settings,
    plan: website.plan,
    status: website.status,
  };
};

/**
 * Identify user with external ID and traits
 */
export const identifyUserWithExternalId = async (apiKey: string, externalId: string, traits: any, fingerprint: string) => {
  const website = await getWebsiteByApiKey(apiKey);

  // Simplified logic for linking externalId to a user and session
  // In a real scenario, this would involve more complex user management
  // and potentially updating an existing session or creating a new one.
  console.log(`Identifying user for website ${website.id} with externalId: ${externalId}, traits: ${JSON.stringify(traits)}, fingerprint: ${fingerprint}`);

  // You might want to update or create a User record here
  // And link the current session to this user if a session ID is also provided
  return { message: 'User identified' };
};

/**
 * Track an event for a session
 */
export const trackSDKEvent = async (apiKey: string, sessionId: string, eventType: string, eventData: any, url: string, timestamp: Date, fingerprint: string) => {
  const website = await getWebsiteByApiKey(apiKey);

  let session = await prisma.session.findUnique({ where: { sessionId } });

  if (!session) {
    // If session doesn't exist, create a new one
    session = await prisma.session.create({
      data: {
        sessionId,
        websiteId: website.id,
        fingerprint: fingerprint || 'unknown',
        startTime: timestamp,
      },
    });
  } else {
    // If session exists, ensure it belongs to the correct website
    if (session.websiteId !== website.id) {
        throw new AppError('Session does not belong to this website', 403);
    }
    // Update session info if needed, e.g., last active time, current URL
    await prisma.session.update({
        where: { id: session.id },
        data: { updatedAt: new Date(), currentUrl: url }
    });
  }

  const event = await prisma.event.create({
    data: {
      sessionId: session.id,
      websiteId: website.id,
      eventType: eventType,
      eventData: eventData || {},
      timestamp: timestamp,
      url: url,
    },
  });

  return { eventId: event.id };
};

/**
 * Update session heartbeat
 */
export const updateSessionHeartbeat = async (apiKey: string, sessionId: string) => {
  const website = await getWebsiteByApiKey(apiKey);

  const session = await prisma.session.findUnique({ where: { sessionId } });
  if (!session || session.websiteId !== website.id) {
      throw new AppError('Session not found or does not belong to this website', 404);
  }

  await prisma.session.update({
    where: { sessionId },
    data: { updatedAt: new Date() },
  });

  return { success: true };
};

/**
 * Get personalization rules for a session
 */
export const getPersonalizationRules = async (apiKey: string, sessionId: string) => {
  const website = await getWebsiteByApiKey(apiKey);

  const session = await prisma.session.findUnique({
    where: { sessionId: sessionId },
    include: {
      persona: { include: { personalizationRules: true } },
      experiment: { include: { variations: true } } // Include experiment for variation logic
    },
  });

  if (!session || session.websiteId !== website.id) {
    throw new AppError('Session not found or does not belong to this website', 404);
  }

  const personalizationRules: any[] = [];

  // Persona-based personalization
  if (website.settings?.autoPersonalization && session.persona && session.persona.isActive) {
    personalizationRules.push(...session.persona.personalizationRules.filter((r: any) => r.isActive));
  }

  // Experiment-based personalization
  if (website.settings?.experimentMode && session.experimentId && session.experimentVariation && session.experiment) {
    const experiment = session.experiment;
    if (experiment.status === 'active') {
        const variation = experiment.variations.find(v => v.name === session.experimentVariation);
        if (variation && !variation.isControl) {
            personalizationRules.push({
                selector: variation.selector,
                content: variation.content,
                contentType: variation.contentType,
                experimentId: experiment.id,
                variationName: variation.name,
            });
        }
    }
  }

  return { personalizationRules };
};

/**
 * Calculate and update intent score for a session
 */
export const calculateSessionIntent = async (apiKey: string, sessionId: string, sessionData: any) => {
  const website = await getWebsiteByApiKey(apiKey);

  let session = await prisma.session.findUnique({
    where: { sessionId: sessionId },
    include: { intentScore: true },
  });

  if (!session || session.websiteId !== website.id) {
    throw new AppError('Session not found or does not belong to this website', 404);
  }

  let intentScore = 0;

  try {
    const mlResult = await mlServiceClient.callMLService(
      '/intent/score',
      { websiteId: website.id, sessionId: session.id, sessionData }
    );
    intentScore = mlResult?.score || 0;
  } catch (error: any) {
    console.error('ML intent scoring failed:', error.message);
    // Fallback or use previous score if ML fails
    intentScore = session.intentScore?.final || 10;
  }

  // Upsert SessionIntentScore
  await prisma.sessionIntentScore.upsert({
    where: { sessionId: session.id },
    update: {
      final: intentScore,
      peak: {
        set: Math.max(intentScore, (session.intentScore?.peak || 0))
      },
      changes: {
        create: { score: intentScore, timestamp: new Date() }
      }
    },
    create: {
      sessionId: session.id,
      initial: intentScore,
      final: intentScore,
      peak: intentScore,
      changes: {
        create: { score: intentScore, timestamp: new Date() }
      }
    },
  });

  return { intentScore };
};
