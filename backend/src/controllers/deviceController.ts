import { Request, Response } from 'express';
import deviceStitchingService from '../services/deviceStitchingService';
import { prisma } from '../config/database';
import { asyncHandler } from '../utils/helpers';

/**
 * Stitch two devices together
 */
export const stitchDevices = asyncHandler(async (req: Request, res: Response) => {
    const { fingerprint1, fingerprint2 } = req.body;

    const result = await deviceStitchingService.stitchDevices(
      fingerprint1,
      fingerprint2
    );

    res.json({
      success: true,
      data: result
    });
});

/**
 * Get all devices for a user
 */
export const getUserDevices = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId as string;

    const devices = await prisma.userDevice.findMany({ where: { userId } });

    res.json({
      success: true,
      data: devices
    });
});
