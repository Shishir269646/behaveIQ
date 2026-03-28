const { prisma } = require('../config/database'); // Import prisma client
const { asyncHandler } = require('../utils/helpers');
const { sendResponse } = require('../utils/responseHandler');
const AppError = require('../utils/AppError');

//   Get events
const getEvents = asyncHandler(async (req, res) => {
    const { websiteId, eventType, limit = 10, page = 1, timeRange = '7d' } = req.query;

    if (!websiteId) {
        throw new AppError('websiteId query parameter is required.', 400);
    }

    // Verify ownership
    const website = await prisma.website.findUnique({
        where: { id: websiteId, userId: req.user.id } // Use req.user.id
    });

    if (!website) {
        throw new AppError('Website not found or not authorized', 404);
    }

    const whereClause = { websiteId: website.id }; // Use website.id
    if (eventType) whereClause.eventType = eventType;

    // Time range filtering
    const days = parseInt(timeRange) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    whereClause.timestamp = { gte: startDate };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const events = await prisma.event.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        skip: skip,
        take: parseInt(limit),
        select: { // Select fields as needed
            id: true, // Prisma uses id
            sessionId: true,
            websiteId: true,
            eventType: true,
            eventData: true,
            timestamp: true
        }
    });

    const totalEvents = await prisma.event.count({ where: whereClause });

    sendResponse(res, 200, {
        events,
        count: events.length,
        total: totalEvents,
        page: parseInt(page),
        pages: Math.ceil(totalEvents / parseInt(limit))
    });
});

//  Get event statistics
const getEventStats = asyncHandler(async (req, res) => {
    const { websiteId } = req.query;

    // Verify ownership
    const website = await prisma.website.findUnique({
        where: { id: websiteId, userId: req.user.id } // Use req.user.id
    });

    if (!website) {
        throw new AppError('Website not found or not authorized', 404);
    }

    // Prisma's group by in aggregate.groupBy
    const stats = await prisma.event.groupBy({
        by: ['eventType'],
        where: { websiteId: website.id }, // Use website.id
        _count: {
            eventType: true,
        },
    });

    const formattedStats = stats.map(s => ({
        _id: s.eventType,
        count: s._count.eventType,
    }));

    sendResponse(res, 200, { stats: formattedStats });
});

module.exports = {
    getEvents,
    getEventStats
};