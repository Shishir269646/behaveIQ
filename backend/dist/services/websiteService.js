"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebsitePages = exports.deleteWebsite = exports.updateWebsite = exports.createWebsite = exports.getWebsiteAndVerify = exports.getWebsites = exports.generateSDKScript = void 0;
const database_1 = require("../config/database");
const AppError_1 = __importDefault(require("../utils/AppError"));
const helpers_1 = require("../utils/helpers");
const env_1 = require("../config/env");
/**
 * Generate SDK script for a website
 */
const generateSDKScript = (website) => {
    const cdnUrl = env_1.SDK_CDN_URL || 'http://localhost:3000/sdk/dist/behaveiq.min.js';
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
exports.generateSDKScript = generateSDKScript;
/**
 * Get all websites for a user
 */
const getWebsites = async (userId) => {
    return await database_1.prisma.website.findMany({
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
exports.getWebsites = getWebsites;
/**
 * Get website by ID and verify ownership
 */
const getWebsiteAndVerify = async (websiteId, userId) => {
    const website = await database_1.prisma.website.findFirst({
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
        throw new AppError_1.default('Website not found or not authorized', 404);
    }
    return website;
};
exports.getWebsiteAndVerify = getWebsiteAndVerify;
/**
 * Create website
 */
const createWebsite = async (userId, data) => {
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
    const website = await database_1.prisma.website.create({
        data: {
            userId,
            name,
            domain,
            industry: industry || 'general',
            plan: plan || 'free',
            apiKey: (0, helpers_1.generateApiKey)(),
            learningStartedAt: new Date(),
            settings: {
                create: {
                    learningPeriodHours: finalSettings.learningPeriodHours,
                    autoPersonalization: finalSettings.autoPersonalization,
                    experimentMode: finalSettings.experimentMode,
                    notificationEmail: finalSettings.notificationEmail,
                    emotionInterventions: {
                        create: finalSettings.emotionInterventions.map((inter) => ({
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
exports.createWebsite = createWebsite;
/**
 * Update website
 */
const updateWebsite = async (websiteId, userId, data) => {
    const existingWebsite = await (0, exports.getWebsiteAndVerify)(websiteId, userId);
    const { name, domain, status, settings } = data;
    const updateData = {};
    if (name !== undefined)
        updateData.name = name;
    if (domain !== undefined)
        updateData.domain = domain;
    if (status !== undefined)
        updateData.status = status;
    if (status === 'active' && !existingWebsite.activatedAt) {
        updateData.activatedAt = new Date();
    }
    if (settings !== undefined) {
        const settingsUpdateData = {};
        if (settings.learningPeriodHours !== undefined)
            settingsUpdateData.learningPeriodHours = settings.learningPeriodHours;
        if (settings.autoPersonalization !== undefined)
            settingsUpdateData.autoPersonalization = settings.autoPersonalization;
        if (settings.experimentMode !== undefined)
            settingsUpdateData.experimentMode = settings.experimentMode;
        if (settings.notificationEmail !== undefined)
            settingsUpdateData.notificationEmail = settings.notificationEmail;
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
                create: settings.emotionInterventions.map((inter) => ({
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
    const updatedWebsite = await database_1.prisma.website.update({
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
exports.updateWebsite = updateWebsite;
/**
 * Delete website
 */
const deleteWebsite = async (websiteId) => {
    await database_1.prisma.website.delete({
        where: { id: websiteId }
    });
};
exports.deleteWebsite = deleteWebsite;
/**
 * Get unique pages for website
 */
const getWebsitePages = async (websiteId) => {
    const events = await database_1.prisma.event.findMany({
        where: { websiteId },
        select: { eventData: true },
    });
    const pageUrls = new Set();
    for (const event of events) {
        const data = event.eventData;
        if (data && data.pageUrl) {
            pageUrls.add(data.pageUrl);
        }
    }
    return Array.from(pageUrls);
};
exports.getWebsitePages = getWebsitePages;
