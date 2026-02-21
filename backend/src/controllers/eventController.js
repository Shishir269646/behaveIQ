const Event = require('../models/Event');
const Website = require('../models/Website');
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
    const website = await Website.findOne({
        _id: websiteId,
        userId: req.user._id
    }).lean();

    if (!website) {
        throw new AppError('Website not found or not authorized', 404);
    }

    const query = { websiteId };
    if (eventType) query.eventType = eventType;

    // Time range filtering
    const days = parseInt(timeRange) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    query.timestamp = { $gte: startDate };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const events = await Event.find(query)
        .sort('-timestamp')
        .skip(skip)
        .limit(parseInt(limit))
        .select('eventType eventData timestamp')
        .lean(); // Use lean() for performance

    const totalEvents = await Event.countDocuments(query);

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
    const website = await Website.findOne({
        _id: websiteId,
        userId: req.user._id
    }).lean();

    if (!website) {
        throw new AppError('Website not found or not authorized', 404);
    }

    const stats = await Event.aggregate([
        { $match: { websiteId: website._id } },
        {
            $group: {
                _id: '$eventType',
                count: { $sum: 1 }
            }
        }
    ]);

    sendResponse(res, 200, { stats });
});

module.exports = {
    getEvents,
    getEventStats
};