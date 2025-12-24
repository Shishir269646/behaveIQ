const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const errorHandler = require('./middleware/errorHandler');

// Import Routes
const authRoutes = require('./routes/auth');
const websiteRoutes = require('./routes/websites');
const eventRoutes = require('./routes/events');
const personaRoutes = require('./routes/personas');
const dashboardRoutes = require('./routes/dashboard');
const experimentRoutes = require('./routes/experiments');
const sdkRoutes = require('./routes/sdk');
const heatmapRoutes = require('./routes/heatmap');

const app = express();

// Connect to Database
connectDB();
connectRedis();

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Rate Limiting
const limiter = rateLimit({
    windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX || 1000000000000000000000000000000000000000000000000000000000000000, // Increased for testing/development
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body Parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/websites', websiteRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/personas', personaRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/experiments', experimentRoutes);
app.use('/api/v1/sdk', sdkRoutes);
app.use('/api/v1/heatmap', heatmapRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date(),
        service: 'BEHAVEIQ Backend'
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error Handler
app.use(errorHandler);

const { analyzeActiveExperiments } = require('./services/jobService');

// ... (rest of the file)

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║           🚀 BEHAVEIQ Backend Server                         ║
║           Running on PORT: ${PORT}                              ║
║           Environment: ${process.env.NODE_ENV}                        ║
╚════════════════════════════════════════════════════════════════╝
  `);

    // --- Auto-Pilot A/B Testing Job ---
    // Run the job immediately on start, then at a regular interval.
    console.log('🚀 Initializing Auto-Pilot A/B testing job...');
    analyzeActiveExperiments();

    const JOB_INTERVAL = process.env.JOB_INTERVAL_HOURS || 1; // Default to 1 hour
    setInterval(analyzeActiveExperiments, JOB_INTERVAL * 60 * 60 * 1000);

    console.log(`✅ Auto-Pilot job scheduled to run every ${JOB_INTERVAL} hour(s).`);
});

module.exports = server;