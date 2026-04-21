import { z } from 'zod';

// Common schema for API key in query
export const apiKeyQuerySchema = z.object({
  query: z.object({
    apiKey: z.string().uuid({ message: 'Invalid API Key format' }), // Assuming API Key is a UUID for now
  }),
});

// Common schema for API key and sessionId in body
export const apiKeySessionBodySchema = z.object({
  body: z.object({
    apiKey: z.string().uuid({ message: 'Invalid API Key format' }),
    sessionId: z.string().min(1, { message: 'sessionId is required' }),
  }),
});

// Common schema for API key and sessionId in params
export const apiKeySessionParamsSchema = z.object({
  params: z.object({
    apiKey: z.string().uuid({ message: 'Invalid API Key format' }),
    sessionId: z.string().min(1, { message: 'sessionId is required' }),
  }),
});

// Schema for getSDKConfig
export const getSDKConfigSchema = apiKeyQuerySchema;

// Schema for identifyUser
export const identifyUserSchema = z.object({
  body: z.object({
    apiKey: z.string().uuid({ message: 'Invalid API Key format' }),
    externalId: z.string().min(1, { message: 'externalId is required' }).optional(),
    traits: z.record(z.any()).optional(), // Loose for now, can be refined
    fingerprint: z.string().min(1, { message: 'fingerprint is required' }),
  }),
});

// Schema for trackEvent
export const trackEventSchema = z.object({
  body: z.object({
    apiKey: z.string().uuid({ message: 'Invalid API Key format' }),
    sessionId: z.string().min(1, { message: 'sessionId is required' }),
    eventType: z.string().min(1, { message: 'eventType is required' }),
    eventData: z.record(z.any()).optional(),
    url: z.string().url({ message: 'Invalid URL format' }),
    timestamp: z.string().datetime({ message: 'Invalid timestamp format (ISO 8601)' }).transform((str) => new Date(str)),
    fingerprint: z.string().min(1, { message: 'fingerprint is required' }).optional(),
  }),
});

// Schema for sendHeartbeat
export const sendHeartbeatSchema = apiKeySessionBodySchema;

// Schema for getPersonalization
export const getPersonalizationSchema = apiKeySessionParamsSchema;

// Schema for calculateIntent
export const calculateIntentSchema = z.object({
  body: z.object({
    apiKey: z.string().uuid({ message: 'Invalid API Key format' }),
    sessionId: z.string().min(1, { message: 'sessionId is required' }),
    sessionData: z.record(z.any()).optional(), // Loose for now
  }),
});
