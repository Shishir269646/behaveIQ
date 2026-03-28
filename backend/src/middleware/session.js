const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const prisma = new PrismaClient();
const { asyncHandler } = require('../utils/helpers');

const createSession = asyncHandler(async (req, res, next) => {
    const { fingerprint, deviceInfo, fpComponents, location } = req.body;
    const apiKey = req.headers['x-api-key']; // Get API key from header

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

    // Now req.website is available for subsequent middleware/controllers
    req.website = website;

    let session = await prisma.session.findFirst({
        where: {
            fingerprint,
            websiteId: website.id,
        },
        orderBy: {
            startTime: 'desc', // Prisma equivalent of sort({ createdAt: -1 })
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
                // fpComponents and locationInfo are relations in Prisma
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

module.exports = {
    createSession,
};