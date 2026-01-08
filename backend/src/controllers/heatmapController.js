const ClickEvent = require('../models/ClickEvent');
const Website = require('../models/Website');
const { asyncHandler } = require('../utils/helpers');

// @desc    Get heatmap data for a specific page
// @route   GET /api/v1/heatmap?websiteId=...&pageUrl=...
const getHeatmapData = asyncHandler(async (req, res) => {
    const { websiteId, pageUrl } = req.query;

    if (!websiteId || !pageUrl) {
        return res.status(400).json({
            success: false,
            message: 'Website ID and Page URL are required.'
        });
    }

    // Verify user owns the website
    const website = await Website.findOne({ _id: websiteId, userId: req.user._id });
    if (!website) {
        return res.status(403).json({
            success: false,
            message: 'You are not authorized to view data for this website.'
        });
    }

    // Fetch click events
    // We only need the coordinates, so we project to keep the payload small.
    const clicks = await ClickEvent.find({
        websiteId,
        pageUrl
    }).select('x y -_id'); // Select only x and y, exclude _id

    // For heatmap.js, it's often useful to have a 'value' property.
    // We can aggregate or just assign a static value for each click.
    const heatmapData = clicks.map(click => ({
        x: click.x,
        y: click.y,
        value: 1 // Each click has a static value; could be enhanced later
    }));

    res.json({
        success: true,
        count: heatmapData.length,
        data: heatmapData
    });
});


module.exports = {
    getHeatmapData
};
