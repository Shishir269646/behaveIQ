import crypto from 'crypto';
import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Generate unique API key
 */
export const generateApiKey = (): string => {
  return 'biq_' + crypto.randomBytes(32).toString('hex');
};

/**
 * Generate unique session ID
 */
export const generateSessionId = (): string => {
  return crypto.randomBytes(16).toString('hex');
};

/**
 * Calculate time difference in hours
 */
export const hoursDifference = (date1: Date, date2: Date): number => {
  const diff = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diff / (1000 * 60 * 60));
};

/**
 * Async handler wrapper to eliminate try-catch blocks in controllers
 */
export const asyncHandler = (fn: (req: any, res: Response, next: NextFunction) => Promise<any>): RequestHandler => 
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
