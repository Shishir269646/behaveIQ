import { z } from 'zod';

// Schema for getFraudEvents query parameters
export const getFraudEventsQuerySchema = z.object({
  query: z.object({
    userId: z.string().uuid({ message: 'Invalid userId format' }).optional(),
    riskLevel: z.enum(['low', 'medium', 'high', 'critical'], { message: 'Invalid riskLevel. Must be one of low, medium, high, critical.' }).optional(),
  }),
});

// Schema for checkFraud request body
export const checkFraudBodySchema = z.object({
  body: z.object({
    userId: z.string().uuid({ message: 'Invalid userId format' }).optional(), // Optional, as some checks might not require a registered user
    sessionData: z.object({
      checkoutTime: z.number().int().min(0, { message: 'checkoutTime must be a non-negative integer' }),
      email: z.string().email({ message: 'Invalid email format' }).optional(),
      mouseMovements: z.number().int().min(0, { message: 'mouseMovements must be a non-negative integer' }),
      // Add other relevant session data fields as needed for fraud checks
    }).optional(),
  }),
});
