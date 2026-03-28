const { prisma } = require('../config/database'); // Import prisma client
const { asyncHandler } = require('../utils/helpers');
const { sendResponse } = require('../utils/responseHandler');
const AppError = require('../utils/AppError');

const getHeatmapData = asyncHandler(async (req, res) => {
    const { websiteId, pageUrl } = req.query;

    if (!websiteId || !pageUrl) {
        throw new AppError('Website ID and Page URL are required.', 400);
    }

    const decodedPageUrl = decodeURIComponent(pageUrl);

    // Ownership check
    const website = await prisma.website.findUnique({
        where: { id: websiteId, userId: req.user.id }
    });

    console.log("website", website);

    if (!website) {
        throw new AppError('Website not found or not authorized', 403);
    }

    // Fetch click heatmap data
    const clicks = await prisma.click.findMany({
        where: {
            websiteId: website.id,
            pageUrl: decodedPageUrl
        },
        select: {
            x: true,
            y: true,
            element: true
        }
    });

    const clickData = clicks.map(click => ({
        x: click.x,
        y: click.y,
        value: 1 // Assuming each click has a value of 1 for heatmap intensity
    }));

    // Scroll & hover future extension placeholder
    // If scroll and hover data are stored in Event model and linked to Session,
    // further queries will be needed here, similar to how clicks are fetched.
    const scrollDepth = {
        avgScrollDepth: 0,
        maxScrollDepth: 0
    };

    const confusionZones = [];

    // Disable caching
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