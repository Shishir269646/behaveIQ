import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import AppError from '../utils/AppError';
import { NODE_ENV } from '../config/env';

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  console.error('Error:', err);

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') { // Unique constraint violation
      const field = (err.meta?.target as string[])?.join(', ') || 'field';
      const message = `Duplicate value for ${field}. Please use another value.`;
      error = new AppError(message, 400);
    } else if (err.code === 'P2025') { // Record not found
      const message = (err.meta?.cause as string) || 'Resource not found.';
      error = new AppError(message, 404);
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again!';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Your token has expired! Please log in again.';
    error = new AppError(message, 401);
  }

  // Handle express-validator errors (array format)
  if (err.array && typeof err.array === 'function') {
      const message = err.array().map((e: any) => e.msg).join(', ');
      error = new AppError(message, 400);
  }

  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: error.message || 'Server Error',
    stack: NODE_ENV === 'development' ? err.stack : undefined
  });
};

export default errorHandler;
