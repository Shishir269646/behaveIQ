import { prisma } from '../config/database';
import { NotFoundError } from '../utils/AppError';
import { generateApiKey } from '../utils/helpers';
import { SDK_CDN_URL } from '../config/env';

const WEBSITE_INCLUDE = {
  settings: {
    include: {
      emotionInterventions: true,
      fraudDetectionSettings: { include: { riskBasedActions: true } }
    }
  },
  stats: true,
};

/**
 * Generate SDK script for a website
 */
export const generateSDKScript = (website: any): string => {
  const cdnUrl = SDK_CDN_URL || 'http://localhost:3000/sdk/dist/behaveiq.min.js';
  const { trackMouse = true, trackScroll = true, trackClicks = true, autoPersonalization = false } = website.settings || {};

  return `<script src="${cdnUrl}"></script>
<script>
  BEHAVEIQ.init('${website.apiKey}', {
    trackMouse: ${trackMouse},
    trackScroll: ${trackScroll},
    trackClicks: ${trackClicks},
    autoPersonalize: ${autoPersonalization}
  });
</script>`;
};

/**
 * Get all websites for a user
 */
export const getWebsites = async (userId: string) => {
  return prisma.website.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: WEBSITE_INCLUDE,
  });
};

/**
 * Get website and verify ownership
 */
export const getWebsiteAndVerify = async (id: string, userId: string) => {
  const website = await prisma.website.findFirst({
    where: { id, userId },
    include: WEBSITE_INCLUDE,
  });
  if (!website) throw new NotFoundError('Website not found');
  return website;
};

/**
 * Create a new website with default settings
 */
export const createWebsite = async (userId: string, data: any) => {
  const { settings = {}, ...websiteData } = data;
  
  return prisma.website.create({
    data: {
      ...websiteData,
      userId,
      apiKey: generateApiKey(),
      learningStartedAt: new Date(),
      settings: {
        create: {
          learningPeriodHours: settings.learningPeriodHours || 48,
          autoPersonalization: settings.autoPersonalization || false,
          experimentMode: settings.experimentMode || false,
          emotionInterventions: {
            create: (settings.emotionInterventions || []).map((i: any) => ({ ...i, data: i.data || {} }))
          },
          fraudDetectionSettings: {
            create: {
              sensitivity: settings.fraudDetectionSettings?.sensitivity || 'medium',
              riskBasedActions: { create: settings.fraudDetectionSettings?.riskBasedActions || {} }
            }
          }
        }
      },
      stats: { create: {} }
    },
    include: WEBSITE_INCLUDE,
  });
};

/**
 * Update website and its settings
 */
export const updateWebsite = async (id: string, userId: string, data: any) => {
  const existing = await getWebsiteAndVerify(id, userId);
  const { settings, status, ...websiteData } = data;

  const updatePayload: any = { ...websiteData };
  if (status) {
    updatePayload.status = status;
    if (status === 'active' && !existing.activatedAt) updatePayload.activatedAt = new Date();
  }

  if (settings) {
    updatePayload.settings = {
      update: {
        ...settings,
        emotionInterventions: settings.emotionInterventions ? {
          deleteMany: {},
          create: settings.emotionInterventions.map((i: any) => ({ ...i, data: i.data || {} }))
        } : undefined,
        fraudDetectionSettings: settings.fraudDetectionSettings ? {
          update: {
            ...settings.fraudDetectionSettings,
            riskBasedActions: { update: settings.fraudDetectionSettings.riskBasedActions }
          }
        } : undefined
      }
    };
  }

  return prisma.website.update({
    where: { id },
    data: updatePayload,
    include: WEBSITE_INCLUDE,
  });
};

/**
 * Delete a website
 */
export const deleteWebsite = async (id: string) => {
  return prisma.website.delete({ where: { id } });
};

/**
 * Get unique page URLs for a website from events
 */
export const getWebsitePages = async (websiteId: string) => {
  const events = await prisma.event.findMany({
    where: { websiteId },
    select: { eventData: true },
    distinct: ['eventData'], // Optimization hint if your DB supports it
  });

  return Array.from(new Set(
    events.map(e => (e.eventData as any)?.pageUrl).filter(Boolean)
  ));
};
