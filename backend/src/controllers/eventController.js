const Event = require('../models/Event');
const Website = require('../models/Website');
const { asyncHandler } = require('../utils/helpers');

// @desc    Get events
// @route   GET /api/v1/events?websiteId=xxx&eventType=click&limit=100
exports.getEvents = asyncHandler(async (req, res) => {
    const { websiteId, eventType, limit = 100 } = req.query;

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

    const events = await Event.find(query)
        .sort('-timestamp')
        .limit(parseInt(limit))
        .select('eventType eventData timestamp');

    res.json({
        success: true,
        count: events.length,
        data: { events }
    });
});

// @desc    Get event statistics
// @route   GET /api/v1/events/stats?websiteId=xxx
exports.getEventStats = asyncHandler(async (req, res) => {
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