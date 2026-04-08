import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/helpers';
import { prisma } from '../config/database';
import { JWT_SECRET } from '../config/env';

/**
 * ------------------------------------
 * JWT Authentication (Dashboard / Admin)
 * ------------------------------------
 */
const handleJwtAuth = async (req: Request, res: Response, next: NextFunction, token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as { id: string; role: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        companyName: true,
        plan: true,
        settings: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User from JWT not found'
      });
    }

    (req as any).user = user;
    (req as any).website = await prisma.website.findFirst({ where: { userId: user.id } });

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

/**
 * ------------------------------------
 * API Key Authentication (SDK / Public APIs)
 * ------------------------------------
 */
const handleApiKeyAuth = async (req: Request, res: Response, next: NextFunction, apiKey: string) => {
  const website = await prisma.website.findUnique({ where: { apiKey } });

  /**
   * Allow anonymous tracking for SDK endpoints
   */
  if (!website) {
    const isAnonymousAllowed =
      req.originalUrl.startsWith('/api/behavior') ||
      req.originalUrl.startsWith('/api/emotion') ||
      req.originalUrl.startsWith('/api/sdk');

    if (isAnonymousAllowed) {
      (req as any).website = null;
      (req as any).user = null;
      return next();
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid API Key'
    });
  }

  /**
   * Demo Website Handling
   */
  if (website.isDemo) {
    if (website.demoExpiresAt && website.demoExpiresAt < new Date()) {
      return res.status(403).json({
        success: false,
        message: 'Demo period has expired'
      });
    }

    (req as any).website = website;
    (req as any).user = await prisma.user.findFirst({ where: { email: 'guest@behaveiq.com' } });
    return next();
  }

  /**
   * Normal SaaS Customer
   */
  const user = await prisma.user.findUnique({
    where: { id: website.userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
    }
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'User associated with this website not found'
    });
  }

  (req as any).website = website;
  (req as any).user = user;
  return next();
};

/**
 * ------------------------------------
 * Anonymous Access (SDK Tracking Only)
 * ------------------------------------
 */
const handleAnonymousAuth = (req: Request, res: Response, next: NextFunction) => {
  const isSdkTrackingPath =
    req.originalUrl.startsWith('/api/behavior') ||
    req.originalUrl.startsWith('/api/emotion') ||
    req.originalUrl.startsWith('/api/sdk');

  if (isSdkTrackingPath) {
    (req as any).website = null;
    (req as any).user = null;
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Not authorized to access this route'
  });
};

/**
 * ------------------------------------
 * Protect Middleware (Main Entry)
 * ------------------------------------
 */
export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // 1️⃣ JWT Auth
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    const token = req.headers.authorization.split(' ')[1];
    if (token) {
      return handleJwtAuth(req, res, next, token);
    }
  }

  // 2️⃣ API Key Auth
  const apiKey = req.headers['x-api-key'] as string;
  if (apiKey) {
    return handleApiKeyAuth(req, res, next, apiKey);
  }

  // 3️⃣ Anonymous SDK
  return handleAnonymousAuth(req, res, next);
});

/**
 * ------------------------------------
 * Role-based Authorization
 * ------------------------------------
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${user ? user.role : 'guest'} is not authorized`
      });
    }
    next();
  };
};
