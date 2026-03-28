const { prisma } = require('../config/database'); // Import prisma client
const { asyncHandler } = require('../utils/helpers');

const getSessions = asyncHandler(async (req, res) => {
    const { websiteId } = req.params;

    const sessions = await prisma.session.findMany({
        where: { websiteId: websiteId }
    });

    res.status(200).json({
        success: true,
        count: sessions.length,
        data: sessions
    });
});

module.exports = {
    getSessions
};