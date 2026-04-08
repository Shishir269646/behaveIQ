"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventStats = exports.getEvents = void 0;
const database_1 = require("../config/database");
const helpers_1 = require("../utils/helpers");
const responseHandler_1 = require("../utils/responseHandler");
const AppError_1 = __importDefault(require("../utils/AppError"));
/**
 * Get events
 */
exports.getEvents = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { websiteId, eventType, limit = '10', page = '1', timeRange = '7d' } = req.query;
    if (!websiteId) {
        throw new AppError_1.default('websiteId query parameter is required.', 400);
    }
    if (!req.user?.id)
        throw new AppError_1.default('Not authorized', 401);
    // Verify ownership
    const website = await database_1.prisma.website.findUnique({
        where: { id: websiteId, userId: req.user.id }
    });
    if (!website) {
        throw new AppError_1.default('Website not found or not authorized', 404);
    }
    const whereClause = { websiteId: website.id };
    if (eventType)
        whereClause.eventType = eventType;
    const days = parseInt(timeRange) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    whereClause.timestamp = { gte: startDate };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const events = await database_1.prisma.event.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        skip: skip,
        take: parseInt(limit),
        select: {
            id: true,
            sessionId: true,
            websiteId: true,
            eventType: true,
            eventData: true,
            timestamp: true
        }
    });
    const totalEvents = await database_1.prisma.event.count({ where: whereClause });
    (0, responseHandler_1.sendResponse)(res, 200, {
        events,
        count: events.length,
        total: totalEvents,
        page: parseInt(page),
        pages: Math.ceil(totalEvents / parseInt(limit))
    });
});
/**
 * Get event statistics
 */
exports.getEventStats = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { websiteId } = req.query;
    if (!req.user?.id)
        throw new AppError_1.default('Not authorized', 401);
    // Verify ownership
    const website = await database_1.prisma.website.findUnique({
        where: { id: websiteId, userId: req.user.id }
    });
    if (!website) {
        throw new AppError_1.default('Website not found or not authorized', 404);
    }
    const stats = await database_1.prisma.event.groupBy({
        by: ['eventType'],
        where: { websiteId: website.id },
        _count: {
            eventType: true,
        },
    });
    const formattedStats = stats.map(s => ({
        _id: s.eventType,
        count: s._count.eventType,
    }));
    (0, responseHandler_1.sendResponse)(res, 200, { stats: formattedStats });
});
