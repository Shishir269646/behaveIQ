const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./config/database');
const redis = require('./config/redis');

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
const experimentsRoutes = require('./routes/experiments'); // ADDED: Import experiments routes

const personasRoutes = require('./routes/personas'); // ADDED: Import personas routes
const usersRoutes = require('./routes/users'); // ADDED: Import user routes

// Import middleware
const { protect: auth } = require('./middleware/auth');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Connect to databases
connectDB();

// Middleware
const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'BEHAVEIQ API is running',
    timestamp: new Date()
  });
});

// API Routes (with auth middleware)
app.use('/api/auth', authRoutes); console.log('Routes mounted: /api/auth');
app.use('/api/identity', identityRoutes); console.log('Routes mounted: /api/identity');
app.use('/api/behavior', auth, behaviorRoutes); console.log('Routes mounted: /api/behavior');
app.use('/api/emotion', auth, emotionRoutes); console.log('Routes mounted: /api/emotion');
app.use('/api/abandonment', auth, abandonmentRoutes); console.log('Routes mounted: /api/abandonment');
app.use('/api/device', auth, deviceRoutes); console.log('Routes mounted: /api/device');
app.use('/api/discount', auth, discountRoutes); console.log('Routes mounted: /api/discount');
app.use('/api/fraud', auth, fraudRoutes); console.log('Routes mounted: /api/fraud');
app.use('/api/voice', auth, voiceRoutes); console.log('Routes mounted: /api/voice');
app.use('/api/content', auth, contentRoutes); console.log('Routes mounted: /api/content');
app.use('/api/dashboard/heatmap', auth, heatmapRoutes); console.log('Routes mounted: /api/dashboard/heatmap');
app.use('/api/websites', auth, websitesRoutes); console.log('Routes mounted: /api/websites');
app.use('/api/dashboard', auth, dashboardRoutes); console.log('Routes mounted: /api/dashboard');
app.use('/api/events', auth, eventsRoutes); console.log('Routes mounted: /api/events');
app.use('/api/experiments', auth, experimentsRoutes); console.log('Routes mounted: /api/experiments'); // ADDED
app.use('/api/personas', auth, personasRoutes); console.log('Routes mounted: /api/personas'); // ADDED
app.use('/api/users', usersRoutes); console.log('Routes mounted: /api/users'); // ADDED
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the BEHAVEIQ API',
    timestamp: new Date()
  });
});

// Error handler (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 BEHAVEIQ Backend running on port ${PORT}`);
});

module.exports = app;