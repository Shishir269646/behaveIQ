"use strict";
/**
 * @fileoverview Environment variables configuration.
 * This file loads and manages environment variables for the application.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEMO_API_KEY = exports.SDK_CDN_URL = exports.SDK_BASE_URL = exports.ML_SERVICE_URL = exports.UPSTASH_REDIS_REST_TOKEN = exports.UPSTASH_REDIS_REST_URL = exports.JWT_EXPIRE = exports.JWT_SECRET = exports.DATABASE_URL = exports.PORT = exports.NODE_ENV = void 0;
const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN'
];
const missingVars = requiredEnvVars.filter(key => !process.env[key]);
if (missingVars.length > 0) {
    console.warn(`⚠️  Missing required environment variables: ${missingVars.join(', ')}`);
}
const config = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 5000,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRE: process.env.JWT_EXPIRE || '30d',
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://localhost:8000',
    SDK_BASE_URL: process.env.SDK_BASE_URL,
    SDK_CDN_URL: process.env.SDK_CDN_URL,
    DEMO_API_KEY: process.env.DEMO_API_KEY
};
exports.NODE_ENV = config.NODE_ENV, exports.PORT = config.PORT, exports.DATABASE_URL = config.DATABASE_URL, exports.JWT_SECRET = config.JWT_SECRET, exports.JWT_EXPIRE = config.JWT_EXPIRE, exports.UPSTASH_REDIS_REST_URL = config.UPSTASH_REDIS_REST_URL, exports.UPSTASH_REDIS_REST_TOKEN = config.UPSTASH_REDIS_REST_TOKEN, exports.ML_SERVICE_URL = config.ML_SERVICE_URL, exports.SDK_BASE_URL = config.SDK_BASE_URL, exports.SDK_CDN_URL = config.SDK_CDN_URL, exports.DEMO_API_KEY = config.DEMO_API_KEY;
exports.default = config;
