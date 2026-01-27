const Website = require('../models/Website');
const ClickEvent = require('../models/ClickEvent');
const { asyncHandler } = require('../utils/helpers');

const getHeatmapData = asyncHandler(async (req, res) => {
    const { websiteId, pageUrl } = req.query;

    if (!websiteId || !pageUrl) {
        return res.status(400).json({
            success: false,
            message: 'Website ID and Page URL are required.'
        });
    }

    const decodedPageUrl = decodeURIComponent(pageUrl);

    // ✅ Ownership check
    const website = await Website.findOne({
        _id: websiteId,
        userId: req.user._id
    });

    console.log("website", website)

    if (!website) {
        return res.status(403).json({
            success: false,
            message: 'Unauthorized access.'
        });
    }

    // ✅ Fetch click heatmap data
    const clicks = await ClickEvent.find({
        websiteId,
        pageUrl: decodedPageUrl
    }).select('x y -_id').lean();

    const clickData = clicks.map(click => ({
        x: click.x,
        y: click.y,
        value: 1
    }));

    // 🔕 Scroll & hover future extension placeholder
    const scrollDepth = {
        avgScrollDepth: 0,
        maxScrollDepth: 0
    };

    const confusionZones = [];

    // 🚫 Disable caching
    res.setHeader('Cache-Control', 'no-store');

    res.json({
        success: true,
        data: {
            clicks: clickData,
            scrollDepth,
            confusionZones
        }
    });
});

module.exports = { getHeatmapData };
