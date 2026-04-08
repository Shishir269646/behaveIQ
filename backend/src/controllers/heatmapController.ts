import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../utils/helpers';
import AppError from '../utils/AppError';
import { AuthenticatedRequest } from '../types';

/**
 * Get heatmap data for a page
 */
export const getHeatmapData = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { websiteId, pageUrl } = req.query;

    if (!websiteId || !pageUrl) {
        throw new AppError('Website ID and Page URL are required.', 400);
    }

    if (!req.user?.id) throw new AppError('Not authorized', 401);

    const decodedPageUrl = decodeURIComponent(pageUrl as string);

    // Ownership check
    const website = await prisma.website.findUnique({
        where: { id: websiteId as string, userId: req.user.id }
    });

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
        value: 1
    }));

    const scrollDepth = {
        avgScrollDepth: 0,
        maxScrollDepth: 0
    };

    const confusionZones: any[] = [];

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
