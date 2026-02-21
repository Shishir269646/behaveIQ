const Website = require('../models/Website');
const Event = require('../models/Event');
const AppError = require('../utils/AppError');

/**
 * Generate SDK script for a website
 */
exports.generateSDKScript = (website) => {
    const cdnUrl = process.env.SDK_CDN_URL || 'http://localhost:3000/sdk/dist/behaveiq.min.js';
    
    const settings = website.settings || {};
    const trackMouse = settings.trackMouse ?? true;
    const trackScroll = settings.trackScroll ?? true;
    const trackClicks = settings.trackClicks ?? true;
    const autoPersonalize = settings.autoPersonalization ?? false;

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
    return await Website.find({ userId })
        .sort('-createdAt')
        .select('-__v')
        .lean();
};

/**
 * Get website by ID and verify ownership
 */
exports.getWebsiteAndVerify = async (websiteId, userId) => {
    const website = await Website.findOne({ _id: websiteId, userId });
    if (!website) {
        throw new AppError('Website not found or not authorized', 404);
    }
    return website;
};

/**
 * Create website
 */
exports.createWebsite = async (userId, data) => {
    return await Website.create({
        ...data,
        userId,
        learningStartedAt: new Date()
    });
};

/**
 * Update website
 */
exports.updateWebsite = async (websiteId, userId, data) => {
    const website = await this.getWebsiteAndVerify(websiteId, userId);
    const { name, settings, status, domain } = data;

    if (name !== undefined) website.name = name;
    if (domain !== undefined) website.domain = domain;
    if (status !== undefined) website.status = status;

    if (settings !== undefined) {
        for (const key in settings) {
            if (key === 'fraudDetectionSettings' && typeof settings.fraudDetectionSettings === 'object') {
                website.settings.fraudDetectionSettings = {
                    ...website.settings.fraudDetectionSettings,
                    ...settings.fraudDetectionSettings
                };
            } else if (key === 'emotionInterventions' && Array.isArray(settings.emotionInterventions)) {
                website.settings.emotionInterventions = settings.emotionInterventions;
            } else {
                website.settings[key] = settings[key];
            }
        }
    }

    if (status === 'active' && !website.activatedAt) {
        website.activatedAt = new Date();
    }

    await website.save();
    return website;
};

/**
 * Get unique pages for website
 */
exports.getWebsitePages = async (websiteId) => {
    return await Event.distinct('eventData.pageUrl', { websiteId }).lean();
};