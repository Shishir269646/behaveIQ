const Website = require('../models/Website');
const Event = require('../models/Event');
const { asyncHandler } = require('../utils/helpers');

// @desc    Get all websites for user
// @route   GET /api/v1/websites
// Helper function
function generateSDKScript(website) { // Changed signature
    const cdnUrl = process.env.SDK_CDN_URL || 'http://localhost:3000/sdk/dist/behaveiq.min.js'; // Use SDK_CDN_URL from env or a sensible default
    
    // Default tracking settings (assuming defaults if settings are not explicitly defined)
    const trackMouse = website.settings?.trackMouse ?? true;
    const trackScroll = website.settings?.trackScroll ?? true;
    const trackClicks = website.settings?.trackClicks ?? true;
    const autoPersonalize = website.settings?.autoPersonalization ?? false; // Assuming this is part of settings

    return `<script src="${cdnUrl}"></script>
<script>
  BEHAVEIQ.init('${website.apiKey}', {
    trackMouse: ${trackMouse},
    trackScroll: ${trackScroll},
    trackClicks: ${trackClicks},
    autoPersonalize: ${autoPersonalize}
  });
</script>`;
}

// @desc    Get all websites for user
// @route   GET /api/v1/websites
const getWebsites = asyncHandler(async (req, res) => {
    const websites = await Website.find({ userId: req.user._id })
        .sort('-createdAt')
        .select('-__v');

    const websitesWithScripts = websites.map(website => ({
        ...website._doc,
        sdkScript: generateSDKScript(website), // Pass website object
    }));

    res.json({
        success: true,
        count: websites.length,
        data: { websites: websitesWithScripts }
    });
});

// @desc    Create new website
// @route   POST /api/v1/websites
const createWebsite = asyncHandler(async (req, res) => {
    const { name, domain, industry } = req.body;

    const website = await Website.create({
        userId: req.user._id,
        name,
        domain,
        industry,
        learningStartedAt: new Date()
    });

    // Generate SDK script
    const sdkScript = generateSDKScript(website); // Pass website object

    res.status(201).json({
        success: true,
        data: {
            website: {
                ...website._doc,
                sdkScript,
                apiKey: website.apiKey,
            }
        }
    });
});

// @desc    Get single website
// @route   GET /api/v1/websites/:id
const getWebsite = asyncHandler(async (req, res) => {
    const website = await Website.findOne({
        _id: req.params.id,
        userId: req.user._id
    });

    if (!website) {
        return res.status(404).json({
            success: false,
            message: 'Website not found'
        });
    }
    
    // Generate SDK script
    const sdkScript = generateSDKScript(website); // Pass website object

    res.json({
        success: true,
        data: {
            website: {
                ...website._doc,
                sdkScript,
            }
        }
    });
});

// @desc    Update website
// @route   PATCH /api/v1/websites/:id
const updateWebsite = asyncHandler(async (req, res) => {
    const { name, settings, status, domain } = req.body; // Added domain as it's a top-level field

    let website = await Website.findOne({ _id: req.params.id, userId: req.user._id });

    if (!website) {
        return res.status(404).json({
            success: false,
            message: 'Website not found'
        });
    }

    // Update top-level fields if provided
    if (name !== undefined) website.name = name;
    if (domain !== undefined) website.domain = domain; // Allow domain update
    if (status !== undefined) website.status = status;

    // Handle nested settings updates
    if (settings !== undefined) {
        // Merge top-level settings fields
        for (const key in settings) {
            if (key === 'fraudDetectionSettings' && typeof settings.fraudDetectionSettings === 'object') {
                // Deep merge fraudDetectionSettings
                website.settings.fraudDetectionSettings = {
                    ...website.settings.fraudDetectionSettings,
                    ...settings.fraudDetectionSettings
                };
            } else if (key === 'emotionInterventions' && Array.isArray(settings.emotionInterventions)) {
                // Replace the entire emotionInterventions array
                website.settings.emotionInterventions = settings.emotionInterventions;
            } else {
                // For other settings, direct assignment
                website.settings[key] = settings[key];
            }
        }
    }

    // If activating for first time
    if (status === 'active' && !website.activatedAt) {
        website.activatedAt = new Date();
    }

    await website.save(); // Save the modified document

    // Generate SDK script
    const sdkScript = generateSDKScript(website); // Pass website object

    res.json({
        success: true,
        data: {
            website: {
                ...website._doc,
                sdkScript,
            }
        }
    });
});

// @desc    Delete website
// @route   DELETE /api/v1/websites/:id
const deleteWebsite = asyncHandler(async (req, res) => {
    const website = await Website.findOneAndDelete({
        _id: req.params.id,
        userId: req.user._id
    });

    if (!website) {
        return res.status(404).json({
            success: false,
            message: 'Website not found'
        });
    }

    res.json({
        success: true,
        message: 'Website deleted successfully'
    });
});

// @desc    Get SDK script
// @route   GET /api/v1/websites/:id/sdk-script
const getSDKScript = asyncHandler(async (req, res) => {
    const website = await Website.findOne({
        _id: req.params.id,
        userId: req.user._id
    });

    if (!website) {
        return res.status(404).json({
            success: false,
            message: 'Website not found'
        });
    }

    const script = generateSDKScript(website); // Pass website object

    res.json({
        success: true,
        data: { script }
    });
});


// @desc    Get all unique page URLs for a given website
// @route   GET /api/v1/websites/:websiteId/pages
const getWebsitePages = asyncHandler(async (req, res) => {
    const { websiteId } = req.params;

    // Verify user owns the website
    const website = await Website.findOne({ _id: websiteId, userId: req.user._id });
    if (!website) {
        return res.status(403).json({
            success: false,
            message: 'You are not authorized to view pages for this website.'
        });
    }

    const pages = await Event.distinct('eventData.pageUrl', { websiteId });

    res.json({
        success: true,
        count: pages.length,
        data: { pages }
    });
});



module.exports = {
    getWebsites,
    createWebsite,
    getWebsite,
    updateWebsite,
    deleteWebsite,
    getSDKScript,
    getWebsitePages // Export the new function
};