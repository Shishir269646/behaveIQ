import { prisma } from '../config/database';
import AppError from '../utils/AppError';
import { generateApiKey } from '../utils/helpers';
import { SDK_CDN_URL } from '../config/env';

/**
 * Generate SDK script for a website
 */
export const generateSDKScript = (website: any): string => {
    const cdnUrl = SDK_CDN_URL || 'http://localhost:3000/sdk/dist/behaveiq.min.js';
    
    const trackMouse = website.settings?.trackMouse ?? true;
    const trackScroll = website.settings?.trackScroll ?? true;
    const trackClicks = website.settings?.trackClicks ?? true;
    const autoPersonalize = website.settings?.autoPersonalization ?? false;

    return `<script src="${cdnUrl}"></script>
<script>
  BEHAVEIQ.init('${website.apiKey}', {
    trackMouse: ${trackMouse},
    trackScroll: ${trackScroll},
    trackClicks: ${trackClicks},
    autoPersonalize: ${autoPersonalize}
  });
</script>`;
};

/**
 * Get all websites for a user
 */
export const getWebsites = async (userId: string) => {
    return await prisma.website.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
            settings: {
                include: {
                    emotionInterventions: true,
                    fraudDetectionSettings: {
                        include: { riskBasedActions: true }
                    }
                }
            },
            stats: true,
        }
    });
};

/**
 * Get website by ID and verify ownership
 */
export const getWebsiteAndVerify = async (websiteId: string, userId: string) => {
    const website = await prisma.website.findFirst({
        where: { id: websiteId, userId },
        include: {
            settings: {
                include: {
                    emotionInterventions: true,
                    fraudDetectionSettings: {
                        include: { riskBasedActions: true }
                    }
                }
            },
            stats: true,
        }
    });
    if (!website) {
        throw new AppError('Website not found or not authorized', 404);
    }
    return website;
};

/**
 * Create website
 */
export const createWebsite = async (userId: string, data: any) => {
    const { name, domain, industry, plan, settings } = data;

    const defaultSettings = {
        learningPeriodHours: 48,
        autoPersonalization: false,
        experimentMode: false,
        emotionInterventions: [],
        fraudDetectionSettings: {
            sensitivity: 'medium',
            riskBasedActions: {
                requirePhoneVerification: false,
                requireEmailVerification: false,
                disableCOD: false,
                showCaptcha: false,
                manualReview: false,
                limitOrderValue: null
            }
        }
    };
    
    const finalSettings = { ...defaultSettings, ...settings };

    const website = await prisma.website.create({
        data: {
            userId,
            name,
            domain,
            industry: industry || 'general',
            plan: plan || 'free',
            apiKey: generateApiKey(),
            learningStartedAt: new Date(),
            settings: {
                create: {
                    learningPeriodHours: finalSettings.learningPeriodHours,
                    autoPersonalization: finalSettings.autoPersonalization,
                    experimentMode: finalSettings.experimentMode,
                    notificationEmail: finalSettings.notificationEmail,
                    emotionInterventions: {
                        create: finalSettings.emotionInterventions.map((inter: any) => ({
                            emotion: inter.emotion,
                            action: inter.action,
                            message: inter.message,
                            data: inter.data || {},
                            status: inter.status || 'active',
                            effectiveness: inter.effectiveness || 0,
                        }))
                    },
                    fraudDetectionSettings: {
                        create: {
                            sensitivity: finalSettings.fraudDetectionSettings.sensitivity,
                            riskBasedActions: {
                                create: finalSettings.fraudDetectionSettings.riskBasedActions
                            }
                        }
                    }
                }
            },
            stats: {
                create: {}
            }
        },
        include: {
            settings: {
                include: {
                    emotionInterventions: true,
                    fraudDetectionSettings: {
                        include: { riskBasedActions: true }
                    }
                }
            },
            stats: true,
        }
    });
    return website;
};

/**
 * Update website
 */
export const updateWebsite = async (websiteId: string, userId: string, data: any) => {
    const existingWebsite = await getWebsiteAndVerify(websiteId, userId);
    const { name, domain, status, settings } = data;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (domain !== undefined) updateData.domain = domain;
    if (status !== undefined) updateData.status = status;

    if (status === 'active' && !existingWebsite.activatedAt) {
        updateData.activatedAt = new Date();
    }

    if (settings !== undefined) {
        const settingsUpdateData: any = {};
        if (settings.learningPeriodHours !== undefined) settingsUpdateData.learningPeriodHours = settings.learningPeriodHours;
        if (settings.autoPersonalization !== undefined) settingsUpdateData.autoPersonalization = settings.autoPersonalization;
        if (settings.experimentMode !== undefined) settingsUpdateData.experimentMode = settings.experimentMode;
        if (settings.notificationEmail !== undefined) settingsUpdateData.notificationEmail = settings.notificationEmail;

        if (settings.fraudDetectionSettings !== undefined) {
            settingsUpdateData.fraudDetectionSettings = {
                update: {
                    sensitivity: settings.fraudDetectionSettings.sensitivity,
                    riskBasedActions: {
                        update: settings.fraudDetectionSettings.riskBasedActions
                    }
                }
            };
        }

        if (settings.emotionInterventions !== undefined) {
            settingsUpdateData.emotionInterventions = {
                deleteMany: {},
                create: settings.emotionInterventions.map((inter: any) => ({
                    emotion: inter.emotion,
                    action: inter.action,
                    message: inter.message,
                    data: inter.data || {},
                    status: inter.status || 'active',
                    effectiveness: inter.effectiveness || 0,
                }))
            };
        }

        updateData.settings = {
            update: settingsUpdateData
        };
    }

    const updatedWebsite = await prisma.website.update({
        where: { id: websiteId },
        data: updateData,
        include: {
            settings: {
                include: {
                    emotionInterventions: true,
                    fraudDetectionSettings: {
                        include: { riskBasedActions: true }
                    }
                }
            },
            stats: true,
        }
    });

    return updatedWebsite;
};

/**
 * Delete website
 */
export const deleteWebsite = async (websiteId: string) => {
    await prisma.website.delete({
        where: { id: websiteId }
    });
};

/**
 * Get unique pages for website
 */
export const getWebsitePages = async (websiteId: string) => {
    const events = await prisma.event.findMany({
        where: { websiteId },
        select: { eventData: true },
    });

    const pageUrls = new Set<string>();
    for (const event of events) {
        const data = event.eventData as any;
        if (data && data.pageUrl) {
            pageUrls.add(data.pageUrl);
        }
    }
    return Array.from(pageUrls);
};
