const { getRedisClient } = require('../config/redis');

/**
 * Get cached data
 */
exports.getCached = async (key) => {
    try {
        const client = getRedisClient();
        return await client.get(key);
    } catch (error) {
        console.error('Redis get error:', error);
        return null;
    }
};

/**
 * Set cache with expiration (in seconds)
 */
exports.setCached = async (key, value, expiration = 300) => {
    try {
        const client = getRedisClient();
        await client.setEx(key, expiration, value);
        return true;
    } catch (error) {
        console.error('Redis set error:', error);
        return false;
    }
};

/**
 * Delete cached data
 */
exports.deleteCached = async (key) => {
    try {
        const client = getRedisClient();
        await client.del(key);
        return true;
    } catch (error) {
        console.error('Redis delete error:', error);
        return false;
    }
};

/**
 * Clear cache by pattern
 */
exports.clearCachePattern = async (pattern) => {
    try {
        const client = getRedisClient();
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
            await client.del(keys);
        }
        return true;
    } catch (error) {
        console.error('Redis clear pattern error:', error);
        return false;
    }
};
