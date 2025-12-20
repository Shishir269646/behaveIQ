const Website = require('../models/Website');
const { asyncHandler } = require('../utils/helpers');

// @desc    Get all websites for user
// @route   GET /api/v1/websites
exports.getWebsites = asyncHandler(async (req, res) => {
    const websites = await Website.find({ userId: req.user._id })
        .sort('-createdAt')
        .select('-__v');

    res.json({
        success: true,
        count: websites.length,
        data: { websites }
    });
});

// @desc    Create new website
// @route   POST /api/v1/websites
exports.createWebsite = asyncHandler(async (req, res) => {
    const { name, domain, industry } = req.body;

    const website = await Website.create({
        userId: req.user._id,
        name,
        domain,
        industry,
        learningStartedAt: new Date()
    });

    // Generate SDK script
    const sdkScript = generateSDKScript(website.apiKey);

    res.status(201).json({
        success: true,
        data: {
            website,
            apiKey: website.apiKey,
            sdkScript
        }
    });
});

// @desc    Get single website
// @route   GET /api/v1/websites/:id
exports.getWebsite = asyncHandler(async (req, res) => {
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

    res.json({
        success: true,
        data: { website }
    });
});

// @desc    Update website
// @route   PATCH /api/v1/websites/:id
exports.updateWebsite = asyncHandler(async (req, res) => {
    const { name, settings, status } = req.body;

    const website = await Website.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { name, settings, status },
        { new: true, runValidators: true }
    );

    if (!website) {
        return res.status(404).json({
            success: false,
            message: 'Website not found'
        });
    }

    // If activating for first time
    if (status === 'active' && !website.activatedAt) {
        website.activatedAt = new Date();
        await website.save();
    }

    res.json({
        success: true,
        data: { website }
    });
});

// @desc    Delete website
// @route   DELETE /api/v1/websites/:id
exports.deleteWebsite = asyncHandler(async (req, res) => {
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
exports.getSDKScript = asyncHandler(async (req, res) => {
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

    const script = generateSDKScript(website.apiKey);

    res.json({
        success: true,
        data: { script }
    });
});

// Helper function
function generateSDKScript(apiKey) {
    const cdnUrl = process.env.SDK_CDN_URL || 'https://cdn.behaveiq.com/sdk/v1';
    return `<script src="${cdnUrl}/behaveiq.min.js"></script>
<script>
  BEHAVEIQ.init('${apiKey}', {
    trackMouse: true,
    trackScroll: true,
    trackClicks: true,
    autoPersonalize: true
  });
</script>`;
}
