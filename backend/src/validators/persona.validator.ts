import { z } from 'zod';

export const createPersonaSchema = z.object({
  params: z.object({
    websiteId: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updatePersonaSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const discoverPersonasSchema = z.object({
  body: z.object({
    minSessions: z.number().int().min(1).optional(),
  }),
});

export const createPersonalizationRuleSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    selector: z.string().min(1),
    content: z.string().min(1),
    contentType: z.enum(['text', 'html', 'image', 'component']).optional(),
    variation: z.string().optional(),
    priority: z.number().int().optional(),
  }),
});
