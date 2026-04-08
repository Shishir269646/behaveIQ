import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fingerprintService from '../services/fingerprintService';
import { prisma } from '../config/database';
import AppError from '../utils/AppError';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../utils/helpers';

/**
 * Identify user and create session
 */
export const identify = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.website?.id) {
      throw new AppError('Forbidden: A valid API key linked to a registered website is required.', 403);
    }

    const { fingerprint, deviceInfo, fpComponents, location } = req.body;
    const websiteId = req.website.id;

    // Validate fingerprint
    const validation = fingerprintService.validateFingerprint(fpComponents);
    if (!validation.valid) {
      throw new AppError('Invalid fingerprint', 400);
    }

    // Generate session ID
    const sessionId = uuidv4();

    // Identify or create user
    const user = await fingerprintService.identifyUser(fingerprint, {
      sessionId,
      fpComponents,
      location,
      websiteId,
      deviceInfo
    });

    // Create session and connect related data
    const session = await prisma.session.create({
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
        isNewUser: (user as any).behavior?.totalSessions === 0
      }
    });
});
