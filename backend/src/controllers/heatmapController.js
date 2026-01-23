const Website = require('../models/Website');
const Event = require('../models/Event'); // New Import
const { asyncHandler } = require('../utils/helpers');

// @desc    Get heatmap data for a specific page

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

    // 1. Fetch click events
    const clicks = await Event.find({
        websiteId,
        'eventData.pageUrl': pageUrl
    }).select('x y -_id');



    const clickData = clicks.map(click => ({
        x: click.x,
        y: click.y,
        value: 1
    }));

    // 2. Fetch scroll depth data
    const scrollData = await Event.aggregate([
        {
            $match: {
                websiteId: website._id,
                eventType: 'scroll',
                'eventData.pageUrl': pageUrl
            }
        },
        {
            $group: {
                _id: null,
                avgScrollDepth: { $avg: '$eventData.scrollDepth' },
                maxScrollDepth: { $max: '$eventData.scrollDepth' }
            }
        }
    ]);

    const formattedScrollData = scrollData.length > 0 ? {
        avgScrollDepth: parseFloat(scrollData[0].avgScrollDepth.toFixed(2)),
        maxScrollDepth: parseFloat(scrollData[0].maxScrollDepth.toFixed(2))
    } : { avgScrollDepth: 0, maxScrollDepth: 0 };


    // 3. Fetch hover/confusion zones
    const hoverEvents = await Event.find({
        websiteId,
        eventType: 'hover',
        'eventData.pageUrl': pageUrl
    })
        .select('eventData.element eventData.timeSpent')
        .lean();

    const confusionZonesMap = {};
    hoverEvents.forEach(event => {
        const element = event.eventData.element;
        if (!confusionZonesMap[element]) {
            confusionZonesMap[element] = {
                element,
                totalHoverTime: 0,
                count: 0
            };
        }
        confusionZonesMap[element].totalHoverTime += event.eventData.timeSpent || 0;
        confusionZonesMap[element].count++;
    });

    const confusionZonesData = Object.values(confusionZonesMap)
        .sort((a, b) => b.totalHoverTime - a.totalHoverTime)
        .slice(0, 10) // Top 10 confusion zones
        .map(zone => ({
            element: zone.element,
            avgHoverTime: parseFloat((zone.totalHoverTime / zone.count).toFixed(2)),
            confusionScore: parseFloat(Math.min((zone.totalHoverTime / zone.count) / 1000, 1).toFixed(2)) // Normalize score
        }));


    res.json({
        success: true,
        data: {
            clicks: clickData,
            scrollDepth: formattedScrollData,
            confusionZones: confusionZonesData
        }
    });
});


module.exports = {
    getHeatmapData
};
