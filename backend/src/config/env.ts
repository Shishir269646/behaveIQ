/**
 * @fileoverview Environment variables configuration.
 * This file loads and manages environment variables for the application.
 */

interface EnvConfig {
  NODE_ENV: string;
  PORT: number | string;
  DATABASE_URL: string | undefined;
  JWT_SECRET: string | undefined;
  JWT_EXPIRE: string;
  UPSTASH_REDIS_REST_URL: string | undefined;
  UPSTASH_REDIS_REST_TOKEN: string | undefined;
  ML_SERVICE_URL: string;
  SDK_BASE_URL: string | undefined;
  SDK_CDN_URL: string | undefined;
  DEMO_API_KEY: string | undefined;
}

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

const config: EnvConfig = {
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

export const {
  NODE_ENV,
  PORT,
  DATABASE_URL,
  JWT_SECRET,
  JWT_EXPIRE,
  UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN,
  ML_SERVICE_URL,
  SDK_BASE_URL,
  SDK_CDN_URL,
  DEMO_API_KEY
} = config;

export default config;
