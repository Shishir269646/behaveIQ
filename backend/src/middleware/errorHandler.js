const AppError = require('../utils/AppError');
const { Prisma } = require('@prisma/client');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  console.error('Error:', err);

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') { // Unique constraint violation
      const field = error.meta?.target || 'field';
      const message = `Duplicate value for ${field}. Please use another value.`;
      error = new AppError(message, 400);
    } else if (error.code === 'P2025') { // Record not found
      const message = error.meta?.cause || 'Resource not found.';
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
      const message = err.array().map(e => e.msg).join(', ');
      error = new AppError(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;