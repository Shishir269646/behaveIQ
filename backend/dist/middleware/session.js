"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSession = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../config/database");
const helpers_1 = require("../utils/helpers");
exports.createSession = (0, helpers_1.asyncHandler)(async (req, res, next) => {
    const { fingerprint, deviceInfo, location } = req.body;
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return res.status(400).json({
            success: false,
            error: 'API Key is missing.',
        });
    }
    const website = await database_1.prisma.website.findFirst({
        where: { apiKey },
    });
    if (!website) {
        return res.status(401).json({
            success: false,
            error: 'Invalid API Key.',
        });
    }
    req.website = website;
    let session = await database_1.prisma.session.findFirst({
        where: {
            fingerprint,
            websiteId: website.id,
        },
        orderBy: {
            startTime: 'desc',
        },
    });
    if (!session) {
        const sessionId = (0, uuid_1.v4)();
        session = await database_1.prisma.session.create({
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
