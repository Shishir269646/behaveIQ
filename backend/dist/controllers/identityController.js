"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.identify = void 0;
const uuid_1 = require("uuid");
const fingerprintService_1 = __importDefault(require("../services/fingerprintService"));
const database_1 = require("../config/database");
const AppError_1 = __importDefault(require("../utils/AppError"));
const helpers_1 = require("../utils/helpers");
/**
 * Identify user and create session
 */
exports.identify = (0, helpers_1.asyncHandler)(async (req, res) => {
    if (!req.website?.id) {
        throw new AppError_1.default('Forbidden: A valid API key linked to a registered website is required.', 403);
    }
    const { fingerprint, deviceInfo, fpComponents, location } = req.body;
    const websiteId = req.website.id;
    // Validate fingerprint
    const validation = fingerprintService_1.default.validateFingerprint(fpComponents);
    if (!validation.valid) {
        throw new AppError_1.default('Invalid fingerprint', 400);
    }
    // Generate session ID
    const sessionId = (0, uuid_1.v4)();
    // Identify or create user
    const user = await fingerprintService_1.default.identifyUser(fingerprint, {
        sessionId,
        fpComponents,
        location,
        websiteId,
        deviceInfo
    });
    // Create session and connect related data
    const session = await database_1.prisma.session.create({
        data: {
            userId: user.id,
            websiteId: websiteId,
            fingerprint: fingerprint,
            sessionId: sessionId,
            deviceInfo: {
                create: {
                    type: deviceInfo?.type || 'unknown',
                    os: deviceInfo?.os,
                    browser: deviceInfo?.browser,
                    userAgent: deviceInfo?.userAgent,
                }
            },
            locationInfo: {
                create: {
                    ip: location?.ip,
                    country: location?.country,
                    city: location?.city,
                    coordinates: location?.coordinates ? {
                        create: {
                            lat: location.coordinates.lat,
                            lng: location.coordinates.lng,
                        }
                    } : undefined
                }
            },
            startTime: new Date()
        },
        include: {
            persona: true,
            user: { include: { behavior: true } }
        }
    });
    res.cookie('biq_fp', fingerprint, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true
    });
    res.json({
        success: true,
        data: {
            userId: user.id,
            sessionId,
            persona: session.persona?.name || 'Unknown',
            isNewUser: user.behavior?.totalSessions === 0
        }
    });
});
