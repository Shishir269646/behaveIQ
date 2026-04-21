import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { JWT_SECRET } from '../config/env';
import { UnauthorizedError, ForbiddenError } from '../utils/AppError';
import { asyncHandler } from '../utils/helpers';

/**
 * Interface for the decoded JWT payload
 */
interface JwtPayload {
  id: string;
  role: string;
}

/**
 * Handle JWT Authentication for Dashboard/Admin
 */
const handleJwtAuth = async (req: Request, token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, fullName: true, role: true, plan: true }
    });

    if (!user) throw new UnauthorizedError('User from JWT not found');

    (req as any).user = user;
    (req as any).website = await prisma.website.findFirst({ where: { userId: user.id } });
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token');
  }
};

/**
 * Handle API Key Authentication for SDK
 */
const handleApiKeyAuth = async (req: Request, apiKey: string) => {
  const website = await prisma.website.findUnique({ where: { apiKey } });

  if (!website) {
    const isPublic = ['/api/behavior', '/api/emotion', '/api/sdk'].some(p => req.originalUrl.startsWith(p));
    if (isPublic) return;
    throw new UnauthorizedError('Invalid API Key');
  }

  if (website.isDemo && website.demoExpiresAt && website.demoExpiresAt < new Date()) {
    throw new ForbiddenError('Demo period has expired');
  }

  const user = await prisma.user.findUnique({
    where: { id: website.userId },
    select: { id: true, email: true, fullName: true, role: true }
  });

  if (!user) throw new UnauthorizedError('Owner not found');

  (req as any).user = user;
  (req as any).website = website;
};

/**
 * Main Authentication Middleware
 */
export const protect = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'] as string;

  if (authHeader?.startsWith('Bearer')) {
    await handleJwtAuth(req, authHeader.split(' ')[1]);
    return next();
  }

  if (apiKey) {
    await handleApiKeyAuth(req, apiKey);
    return next();
  }

  // Allow public access for SDK routes if no credentials provided
  if (['/api/behavior', '/api/emotion', '/api/sdk'].some(p => req.originalUrl.startsWith(p))) {
    return next();
  }

  throw new UnauthorizedError('Not authorized to access this route');
});

/**
 * Role-based Authorization Middleware
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      throw new ForbiddenError(`Role ${user?.role || 'guest'} is not authorized`);
    }
    next();
  };
};
