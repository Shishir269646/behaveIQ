import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../utils/helpers';

/**
 * Get sessions for a website
 */
export const getSessions = asyncHandler(async (req: Request, res: Response) => {
    const websiteId = req.params.websiteId as string;

    const sessions = await prisma.session.findMany({
        where: { websiteId: websiteId }
    });

    res.status(200).json({
        success: true,
        count: sessions.length,
        data: sessions
    });
});
