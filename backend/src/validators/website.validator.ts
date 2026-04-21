import { z } from 'zod';

const websiteBase = {
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  domain: z.string().url('Invalid domain URL'),
  industry: z.string().optional().default('general'),
  plan: z.enum(['free', 'pro', 'enterprise']).optional().default('free'),
};

const settingsSchema = z.object({
  learningPeriodHours: z.number().min(1).optional(),
  autoPersonalization: z.boolean().optional(),
  experimentMode: z.boolean().optional(),
  notificationEmail: z.string().email().optional(),
  emotionInterventions: z.array(z.object({
    emotion: z.string(),
    action: z.string(),
    message: z.string().optional(),
    data: z.record(z.any()).optional(),
    status: z.enum(['active', 'inactive']).optional().default('active'),
  })).optional(),
  fraudDetectionSettings: z.object({
    sensitivity: z.enum(['low', 'medium', 'high']).optional(),
    riskBasedActions: z.record(z.any()).optional(),
  }).optional(),
});

export const createWebsiteSchema = z.object({
  body: z.object({
    ...websiteBase,
    settings: settingsSchema.optional(),
  }),
});

export const updateWebsiteSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid Website ID') }),
  body: z.object({
    name: z.string().min(2).optional(),
    domain: z.string().url().optional(),
    status: z.enum(['active', 'inactive', 'archived']).optional(),
    settings: settingsSchema.deepPartial().optional(),
  }),
});

export const websiteIdSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid Website ID') }),
});
