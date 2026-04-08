/**
 * @fileoverview Main application entry point.
 * This file sets up the Express application, configures middleware,
 * connects to the database, and defines the main routes.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

// Load and validate env vars early
import './config/env';

import { prisma, connectDB } from './config/database'; // Import prisma and connectDB
import AppError from './utils/AppError';
import { sendResponse } from './utils/responseHandler';

// Import routes
import identityRoutes from './routes/identity.routes';
import behaviorRoutes from './routes/behavior.routes';
import emotionRoutes from './routes/emotion.routes';
import abandonmentRoutes from './routes/abandonment.routes';
import deviceRoutes from './routes/device.routes';
import discountRoutes from './routes/discount.routes';
import fraudRoutes from './routes/fraud.routes';
import voiceRoutes from './routes/voice.routes';
import contentRoutes from './routes/content.routes';
import authRoutes from './routes/auth.routes';
import heatmapRoutes from './routes/heatmap.routes';
import websitesRoutes from './routes/websites.routes';
import dashboardRoutes from './routes/dashboard.routes';
import eventsRoutes from './routes/events.routes';
import experimentsRoutes from './routes/experiments.routes';
import personasRoutes from './routes/personas.routes';
import usersRoutes from './routes/users.routes';
import sdkRoutes from './routes/sdk.routes';

// Import middleware
import { protect as auth } from './middleware/auth';
import rateLimiter from './middleware/rateLimiter';
import errorHandler from './middleware/errorHandler';

const app = express();

// Connect to databases
connectDB();

// Middleware
app.use(cookieParser());
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(rateLimiter);

// Health check
app.get('/health', (req: Request, res: Response) => {
  sendResponse(res, 200, {
    status: 'up',
    timestamp: new Date()
  }, 'BEHAVEIQ API is running');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/identity', auth, identityRoutes);
app.use('/api/behavior', auth, behaviorRoutes);
app.use('/api/emotion', auth, emotionRoutes);
app.use('/api/abandonment', auth, abandonmentRoutes);
app.use('/api/device', auth, deviceRoutes);
app.use('/api/discount', auth, discountRoutes);
app.use('/api/fraud', auth, fraudRoutes);
app.use('/api/voice', auth, voiceRoutes);
app.use('/api/content', auth, contentRoutes);
app.use('/api/heatmaps', auth, heatmapRoutes);
app.use('/api/websites', auth, websitesRoutes);
app.use('/api/dashboard', auth, dashboardRoutes);
app.use('/api/events', auth, eventsRoutes);
app.use('/api/experiments', auth, experimentsRoutes);
app.use('/api/personas', auth, personasRoutes);
app.use('/api/users', auth, usersRoutes);
app.use('/api/sdk', sdkRoutes);

app.get('/api', (req: Request, res: Response) => {
  sendResponse(res, 200, null, 'Welcome to the BEHAVEIQ API');
});

// 404 handler
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
