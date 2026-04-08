import { Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database';
import { asyncHandler } from '../utils/helpers';
import { AuthenticatedRequest } from '../types';

export const createSession = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { fingerprint, deviceInfo, location } = req.body;
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
        return res.status(400).json({
            success: false,
            error: 'API Key is missing.',
        });
    }

    const website = await prisma.website.findFirst({
        where: { apiKey },
    });

    if (!website) {
        return res.status(401).json({
            success: false,
            error: 'Invalid API Key.',
        });
    }

    req.website = website;

    let session = await prisma.session.findFirst({
        where: {
            fingerprint,
            websiteId: website.id,
        },
        orderBy: {
            startTime: 'desc',
        },
    });

    if (!session) {
        const sessionId = uuidv4();

        session = await prisma.session.create({
            data: {
                userId: null,
                websiteId: website.id,
                fingerprint,
                sessionId,
                deviceInfo: deviceInfo,
                locationInfo: location
                    ? {
                        create: {
                            ip: location.ip,
                            country: location.country,
                            city: location.city,
                            coordinates: location.coordinates
                                ? {
                                    create: {
                                        lat: location.coordinates.lat,
                                        lng: location.coordinates.lng,
                                    },
                                }
                                : undefined,
                        },
                    }
                    : undefined,
            },
            include: {
                locationInfo: true,
            },
        });

        res.cookie('biq_fp', fingerprint, {
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            httpOnly: true,
        });
    }

    req.session = session;
    next();
});
