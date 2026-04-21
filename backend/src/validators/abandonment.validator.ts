import { z } from 'zod';
import { SessionOutcome } from '@prisma/client';

// Schema for predictRisk
export const predictRiskSchema = z.object({
  body: z.object({
    userId: z.string().uuid({ message: 'Invalid userId format' }).optional(),
    sessionId: z.string().min(1, { message: 'sessionId is required' }),
    websiteId: z.string().uuid({ message: 'Invalid websiteId format' }),
  }),
});

// Schema for trackInterventionResponse
export const trackInterventionResponseSchema = z.object({
  body: z.object({
    interventionId: z.string().uuid({ message: 'Invalid interventionId format' }),
    response: z.string().min(1, { message: 'Response is required' }), // e.g., 'shown', 'clicked', 'ignored'
    outcome: z.nativeEnum(SessionOutcome, { message: 'Invalid session outcome' }).optional(), // e.g., 'purchase', 'cart_abandon'
  }),
});

// Schema for getAbandonmentStats
export const getAbandonmentStatsSchema = z.object({
  query: z.object({
    websiteId: z.string().uuid({ message: 'Invalid websiteId format' }),
    timeRange: z.string().regex(/^\d+(d|w|m|y)$/, { message: 'Invalid timeRange format (e.g., 7d, 1w, 1m)' }).optional(),
  }),
});
