"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCachePattern = exports.deleteCached = exports.setCached = exports.getCached = void 0;
const redis_1 = __importDefault(require("../config/redis"));
/**
 * Get cached data
 */
const getCached = async (key) => {
    try {
        return await redis_1.default.get(key);
    }
    catch (error) {
        console.error('Redis get error:', error);
        return null;
    }
};
exports.getCached = getCached;
/**
 * Set cache with expiration (in seconds)
 */
const setCached = async (key, value, expiration = 300) => {
    try {
        await redis_1.default.set(key, value, { ex: expiration });
        return true;
    }
    catch (error) {
        console.error('Redis set error:', error);
        return false;
    }
};
exports.setCached = setCached;
/**
 * Delete cached data
 */
const deleteCached = async (key) => {
    try {
        await redis_1.default.del(key);
        return true;
    }
    catch (error) {
        console.error('Redis delete error:', error);
        return false;
    }
};
exports.deleteCached = deleteCached;
/**
 * Clear cache by pattern
 */
const clearCachePattern = async (pattern) => {
    try {
        // Note: Upstash Redis REST API doesn't support .keys() easily via this client 
        // normally we would use .keys() or scan.
        // For simplicity, if this is Upstash client, it might not support keys()
        // If it does:
        const keys = await redis_1.default.keys(pattern);
        if (keys && keys.length > 0) {
            await redis_1.default.del(...keys);
        }
        return true;
    }
    catch (error) {
        console.error('Redis clear pattern error:', error);
        return false;
    }
};
exports.clearCachePattern = clearCachePattern;
