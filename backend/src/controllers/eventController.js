const Event = require('../models/Event');
const Website = require('../models/Website');
const { asyncHandler } = require('../utils/helpers');

//   Get events

const getEvents = asyncHandler(async (req, res) => {
    console.log('--- getEvents called ---');
    const { websiteId, eventType, limit = 10, page = 1, timeRange = '7d' } = req.query;

    if (!websiteId) {
        return res.status(400).json({
            success: false,
            message: 'websiteId query parameter is required.'
        });
    }

    // Verify ownership
    const website = await Website.findOne({
        _id: websiteId,
        userId: req.user._id
    });

    if (!website) {
        return res.status(404).json({
            success: false,
            message: 'Website not found'
        });
    }

    const query = { websiteId };
    if (eventType) query.eventType = eventType;

    // Time range filtering
    const days = parseInt(timeRange) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    query.timestamp = { $gte: startDate };

    console.log('Event query:', query);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const events = await Event.find(query)
        .sort('-timestamp')
        .skip(skip)
        .limit(parseInt(limit))
        .select('eventType eventData timestamp');

    const totalEvents = await Event.countDocuments(query);

    res.json({
        success: true,
        count: events.length,
        total: totalEvents, // Return total count
        page: parseInt(page),
        pages: Math.ceil(totalEvents / parseInt(limit)),
        data: { events }
    });
});

//  Get event statistics

const getEventStats = asyncHandler(async (req, res) => {
    const { websiteId } = req.query;

    // Verify ownership
    const website = await Website.findOne({
        _id: websiteId,
        userId: req.user._id
    });

    if (!website) {
        return res.status(404).json({
            success: false,
            message: 'Website not found'
        });
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

    res.json({
        success: true,
        data: { stats }
    });
});


module.exports = {
    getEvents,
    getEventStats
};