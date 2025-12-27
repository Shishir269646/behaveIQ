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

// Import middleware
const auth = require('./middleware/auth');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Connect to databases
connectDB();

// Middleware
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
app.use('/api/identity', auth, identityRoutes);
app.use('/api/behavior', auth, behaviorRoutes);
app.use('/api/emotion', auth, emotionRoutes);
app.use('/api/abandonment', auth, abandonmentRoutes);
app.use('/api/device', auth, deviceRoutes);
app.use('/api/discount', auth, discountRoutes);
app.use('/api/fraud', auth, fraudRoutes);
app.use('/api/voice', auth, voiceRoutes);
app.use('/api/content', auth, contentRoutes);

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