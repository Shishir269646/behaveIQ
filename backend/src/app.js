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
const sdkRoutes = require('./routes/sdk'); // ADDED: Import SDK routes

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