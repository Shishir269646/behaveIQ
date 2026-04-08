"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessions = void 0;
const database_1 = require("../config/database");
const helpers_1 = require("../utils/helpers");
/**
 * Get sessions for a website
 */
exports.getSessions = (0, helpers_1.asyncHandler)(async (req, res) => {
    const websiteId = req.params.websiteId;
    const sessions = await database_1.prisma.session.findMany({
        where: { websiteId: websiteId }
    });
    res.status(200).json({
        success: true,
        count: sessions.length,
        data: sessions
    });
});
