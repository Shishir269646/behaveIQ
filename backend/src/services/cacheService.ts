import redis from '../config/redis';

/**
 * Get cached data
 */
export const getCached = async (key: string): Promise<any> => {
    try {
        return await redis.get(key);
    } catch (error) {
        console.error('Redis get error:', error);
        return null;
    }
};

/**
 * Set cache with expiration (in seconds)
 */
export const setCached = async (key: string, value: any, expiration = 300): Promise<boolean> => {
    try {
        await redis.set(key, value, { ex: expiration });
        return true;
    } catch (error) {
        console.error('Redis set error:', error);
        return false;
    }
};

/**
 * Delete cached data
 */
export const deleteCached = async (key: string): Promise<boolean> => {
    try {
        await redis.del(key);
        return true;
    } catch (error) {
        console.error('Redis delete error:', error);
        return false;
    }
};

/**
 * Clear cache by pattern
 */
export const clearCachePattern = async (pattern: string): Promise<boolean> => {
    try {
        // Note: Upstash Redis REST API doesn't support .keys() easily via this client 
        // normally we would use .keys() or scan.
        // For simplicity, if this is Upstash client, it might not support keys()
        // If it does:
        const keys = await (redis as any).keys(pattern);
        if (keys && keys.length > 0) {
            await redis.del(...keys);
        }
        return true;
    } catch (error) {
        console.error('Redis clear pattern error:', error);
        return false;
    }
};
