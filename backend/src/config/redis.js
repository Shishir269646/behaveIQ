const Redis = require('ioredis');

let redisErrorLogged = false; // Add this flag

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Allow indefinite retries for commands
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('connect', () => {
  console.log('✅ Redis Connected');
  redisErrorLogged = false; // Reset flag on successful connection
});

redis.on('error', (err) => {
  if (err.code === 'ECONNREFUSED' && !redisErrorLogged) {
    console.error('❌ Redis Connection Error: Could not connect to Redis server. Please ensure Redis is running.');
    redisErrorLogged = true; // Set flag after logging the specific error once
  } else if (err.code !== 'ECONNREFUSED') {
    // Log other types of Redis errors normally
    console.error('❌ Redis Error:', err);
  }
});

module.exports = redis;