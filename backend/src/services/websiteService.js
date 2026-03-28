const { prisma } = require('../config/database'); // Import prisma client
const AppError = require('../utils/AppError');
const { generateApiKey } = require('../utils/helpers'); // Assuming generateApiKey is still used

/**
 * Generate SDK script for a website
 * This function remains largely the same as it doesn't interact with the database directly.
 */
exports.generateSDKScript = (website) => {
    const cdnUrl = process.env.SDK_CDN_URL || 'http://localhost:3000/sdk/dist/behaveiq.min.js';
    
    // Ensure settings are properly loaded from Prisma
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
exports.getWebsites = async (userId) => {
    return await prisma.website.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { // Include related models for a complete website object
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
exports.getWebsiteAndVerify = async (websiteId, userId) => {
    const website = await prisma.website.findUnique({
        where: { id: websiteId, userId }, // Prisma allows compound unique on a combination of fields if defined in schema or just for querying
        include: { // Include related models for a complete website object
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
exports.createWebsite = async (userId, data) => {
    const { name, domain, industry, plan, settings, ...rest } = data;

    // Default settings if not provided
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
    
    // Merge provided settings with defaults
    const finalSettings = { ...defaultSettings, ...settings };

    // Create Website and its related models in a single transaction if needed,
    // or separately if relations are optional. Here we use nested create.
    const website = await prisma.website.create({
        data: {
            userId,
            name,
            domain,
            industry: industry || 'general',
            plan: plan || 'free',
            apiKey: generateApiKey(), // Using the helper for API key generation
            learningStartedAt: new Date(),
            settings: {
                create: {
                    learningPeriodHours: finalSettings.learningPeriodHours,
                    autoPersonalization: finalSettings.autoPersonalization,
                    experimentMode: finalSettings.experimentMode,
                    notificationEmail: finalSettings.notificationEmail,
                    emotionInterventions: {
                        create: finalSettings.emotionInterventions.map(inter => ({
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
                create: {} // Create default stats
            }
        },
        include: { // Include all related data to return a complete object
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
exports.updateWebsite = async (websiteId, userId, data) => {
    const existingWebsite = await this.getWebsiteAndVerify(websiteId, userId);
    const { name, domain, status, settings } = data;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (domain !== undefined) updateData.domain = domain;
    if (status !== undefined) updateData.status = status;

    if (status === 'active' && !existingWebsite.activatedAt) {
        updateData.activatedAt = new Date();
    }

    if (settings !== undefined) {
        // Handle nested settings updates
        const settingsUpdateData = {};
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
            // This is a more complex array update. For simplicity, we might replace or use more granular operations.
            // For now, let's assume a full replacement for emotionInterventions for update if provided.
            // A more robust solution would involve diffing and selective create/update/delete.
            settingsUpdateData.emotionInterventions = {
                deleteMany: {}, // Delete all existing
                create: settings.emotionInterventions.map(inter => ({ // Recreate with new data
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
        include: { // Include all related data to return a complete object
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
exports.deleteWebsite = async (websiteId) => {
    // Cascade delete for related models (settings, stats, etc.) might need to be handled
    // depending on Prisma's onDelete behavior defined in schema.prisma.
    // For now, assuming `onDelete: Cascade` is set for relations or Prisma handles it implicitly.
    await prisma.website.delete({
        where: { id: websiteId }
    });
};

/**
 * Get unique pages for website
 */
exports.getWebsitePages = async (websiteId) => {
    // Prisma's way to get distinct values from a JSON field needs more steps.
    // First, fetch all events for the website, then extract distinct page URLs from eventData.
    const events = await prisma.event.findMany({
        where: { websiteId },
        select: { eventData: true },
    });

    const pageUrls = new Set();
    for (const event of events) {
        if (event.eventData && event.eventData.pageUrl) {
            pageUrls.add(event.eventData.pageUrl);
        }
    }
    return Array.from(pageUrls);
};