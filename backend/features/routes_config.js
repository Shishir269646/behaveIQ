// src/config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;

// ================================================================

// src/config/redis.js
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('connect', () => {
  console.log('✅ Redis Connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis Error:', err);
});

module.exports = redis;

// ================================================================

// src/config/constants.js
module.exports = {
  PERSONA_TYPES: [
    'budget_buyer',
    'feature_explorer',
    'careful_researcher',
    'impulse_buyer',
    'casual_visitor'
  ],
  
  EMOTION_TYPES: [
    'frustrated',
    'confused',
    'excited',
    'neutral',
    'considering'
  ],

  INTENT_THRESHOLDS: {
    LOW: 30,
    MEDIUM: 60,
    HIGH: 80
  },

  FRAUD_RISK_LEVELS: {
    LOW: 40,
    MEDIUM: 60,
    HIGH: 80
  },

  CACHE_TTL: {
    USER: 3600,        // 1 hour
    SESSION: 1800,     // 30 minutes
    EMOTION: 300,      // 5 minutes
    INTENT: 600        // 10 minutes
  }
};

// ================================================================

// src/routes/identity.routes.js
const express = require('express');
const router = express.Router();
const identityController = require('../controllers/identityController');

router.post('/identify', identityController.identify);

module.exports = router;

// ================================================================

// src/routes/behavior.routes.js
const express = require('express');
const router = express.Router();
const behaviorController = require('../controllers/behaviorController');

router.post('/track', behaviorController.trackEvent);
router.get('/summary/:sessionId', behaviorController.getBehaviorSummary);

module.exports = router;

// ================================================================

// src/routes/emotion.routes.js
const express = require('express');
const router = express.Router();
const emotionController = require('../controllers/emotionController');

router.post('/detect', emotionController.detectEmotion);

module.exports = router;

// ================================================================

// src/routes/abandonment.routes.js
const express = require('express');
const router = express.Router();
const abandonmentController = require('../controllers/abandonmentController');

router.post('/predict', abandonmentController.predictRisk);
router.post('/intervention/response', abandonmentController.trackInterventionResponse);

module.exports = router;

// ================================================================

// src/routes/device.routes.js
const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

router.post('/stitch', deviceController.stitchDevices);
router.get('/user/:userId', deviceController.getUserDevices);

module.exports = router;

// ================================================================

// src/routes/discount.routes.js
const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discountController');

router.post('/calculate', discountController.calculateDiscount);
router.post('/apply', discountController.applyDiscount);
router.post('/mark-used', discountController.markAsUsed);

module.exports = router;

// ================================================================

// src/routes/fraud.routes.js
const express = require('express');
const router = express.Router();
const fraudController = require('../controllers/fraudController');

router.post('/check', fraudController.checkFraud);

module.exports = router;

// ================================================================

// src/routes/voice.routes.js
const express = require('express');
const router = express.Router();
const voiceController = require('../controllers/voiceController');

router.post('/search', voiceController.searchByVoice);

module.exports = router;

// ================================================================

// src/middleware/auth.js
const auth = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required'
      });
    }

    // Validate API key (implement your logic)
    if (apiKey !== process.env.API_KEY) {
      return res.status(403).json({
        success: false,
        error: 'Invalid API key'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

module.exports = auth;

// ================================================================

// src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  }
});

module.exports = limiter;

// ================================================================

// src/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;

// ================================================================

// src/app.js
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

// ================================================================

// .env.example
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/behaveiq

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ML Service
ML_SERVICE_URL=http://localhost:8000

# API Key (generate your own)
API_KEY=your-secret-api-key-here

# ================================================================

// package.json
{
  "name": "behaveiq-backend",
  "version": "1.0.0",
  "description": "BEHAVEIQ - AI-Powered Website Personalization Platform",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "ioredis": "^5.3.2",
    "axios": "^1.5.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.1",
    "express-rate-limit": "^6.10.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.4"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}