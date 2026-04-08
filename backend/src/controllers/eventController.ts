import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../utils/helpers';
import { sendResponse } from '../utils/responseHandler';
import AppError from '../utils/AppError';
import { AuthenticatedRequest } from '../types';

/**
 * Get events
 */
export const getEvents = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { websiteId, eventType, limit = '10', page = '1', timeRange = '7d' } = req.query;

    if (!websiteId) {
        throw new AppError('websiteId query parameter is required.', 400);
    }

    if (!req.user?.id) throw new AppError('Not authorized', 401);

    // Verify ownership
    const website = await prisma.website.findUnique({
        where: { id: websiteId as string, userId: req.user.id }
    });

    if (!website) {
        throw new AppError('Website not found or not authorized', 404);
    }

    const whereClause: any = { websiteId: website.id };
    if (eventType) whereClause.eventType = eventType;

    const days = parseInt(timeRange as string) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    whereClause.timestamp = { gte: startDate };

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const events = await prisma.event.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        skip: skip,
        take: parseInt(limit as string),
        select: {
            id: true,
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
        page: parseInt(page as string),
        pages: Math.ceil(totalEvents / parseInt(limit as string))
    });
});

/**
 * Get event statistics
 */
export const getEventStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { websiteId } = req.query;
    if (!req.user?.id) throw new AppError('Not authorized', 401);

    // Verify ownership
    const website = await prisma.website.findUnique({
        where: { id: websiteId as string, userId: req.user.id }
    });

    if (!website) {
        throw new AppError('Website not found or not authorized', 404);
    }

    const stats = await prisma.event.groupBy({
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

    sendResponse(res, 200, { stats: formattedStats });
});
