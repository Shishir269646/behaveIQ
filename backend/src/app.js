/**
 * @fileoverview Main application entry point.
 * This file sets up the Express application, configures middleware,
 * connects to the database, and defines the main routes.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Load and validate env vars early
require('./config/env');

const connectDB = require('./config/database');
const AppError = require('./utils/AppError');
const { sendResponse } = require('./utils/responseHandler');

// Import routes
const identityRoutes = require('./routes/identity.routes');
const behaviorRoutes = require('./routes/behavior.routes');
const emotionRoutes = require('./routes/emotion.routes');
const abandonmentRoutes = require('./routes/abandonment.routes');
const deviceRoutes = require('./routes/device.routes');
const discountRoutes = require('./routes/discount.routes');
const fraudRoutes = require('./routes/fraud.routes');
const voiceRoutes = require('./routes/voice.routes');
const contentRoutes = require('./routes/content.routes');
const authRoutes = require('./routes/auth');
const heatmapRoutes = require('./routes/heatmap');
const websitesRoutes = require('./routes/websites');
const dashboardRoutes = require('./routes/dashboard');
const eventsRoutes = require('./routes/events');
const experimentsRoutes = require('./routes/experiments');
const personasRoutes = require('./routes/personas');
const usersRoutes = require('./routes/users');
const sdkRoutes = require('./routes/sdk');

// Import middleware
const { protect: auth } = require('./middleware/auth');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

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
app.get('/health', (req, res) => {
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

app.get('/api', (req, res) => {
  sendResponse(res, 200, null, 'Welcome to the BEHAVEIQ API');
});

// 404 handler
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 BEHAVEIQ Backend running on port ${PORT}`);
});

module.exports = app;