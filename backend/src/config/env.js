/**
 * @fileoverview Environment variables configuration.
 * This file loads and manages environment variables for the application.
 */

const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN'
];

const missingVars = requiredEnvVars.filter(key => !process.env[key]);

if (missingVars.length > 0) {
    console.warn(`⚠️  Missing required environment variables: ${missingVars.join(', ')}`);
    // In production, you might want to throw an error:
    // throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

module.exports = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 5000,
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRE: process.env.JWT_EXPIRE || '30d',
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://localhost:8000',
    SDK_BASE_URL: process.env.SDK_BASE_URL,
    SDK_CDN_URL: process.env.SDK_CDN_URL,
    DEMO_API_KEY: process.env.DEMO_API_KEY
};