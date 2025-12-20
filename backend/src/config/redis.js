const redis = require('redis');

let redisClient;

exports.connectRedis = async () => {
    try {
        redisClient = redis.createClient({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        return new Error('Redis reconnection failed');
                    }
                    return retries * 1000;
                }
            }
        });

        redisClient.on('error', (err) => {
            console.error('❌ Redis Client Error:', err);
        });

        redisClient.on('connect', () => {
            console.log('✅ Redis Connected');
        });

        await redisClient.connect();

    } catch (error) {
        console.error(`❌ Redis connection failed: ${error.message}`);
    }
};

exports.getRedisClient = () => {
    if (!redisClient) {
        throw new Error('Redis client not initialized');
    }
    return redisClient;
};