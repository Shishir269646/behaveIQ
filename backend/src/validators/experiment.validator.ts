import { z } from 'zod';
import { ExperimentStatus, VariationContentType } from '@prisma/client';

// Common schemas for IDs and status
export const experimentIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid experiment ID format' }),
  }),
});

export const websiteIdQuerySchema = z.object({
  query: z.object({
    websiteId: z.string().uuid({ message: 'Invalid website ID format' }),
  }),
});

export const statusQuerySchema = z.object({
  query: z.object({
    status: z.nativeEnum(ExperimentStatus, { message: 'Invalid experiment status' }).optional(),
  }),
});

// Schema for variations
const variationSchema = z.object({
  name: z.string().min(1, { message: 'Variation name is required' }),
  isControl: z.boolean().default(false),
  selector: z.string().min(1, { message: 'Selector is required for variation' }).optional(), // Optional as control might not have one
  content: z.string().min(1, { message: 'Content is required for variation' }).optional(), // Optional as control might not have one
  contentType: z.nativeEnum(VariationContentType, { message: 'Invalid content type' }).default('text'),
  trafficPercentage: z.number().int().min(0).max(100).default(50),
});

// Schema for experiment settings
const experimentSettingsSchema = z.object({
  targetUrl: z.string().url({ message: 'Invalid target URL format' }).optional(),
  conversionGoal: z.string().min(1, { message: 'Conversion goal is required' }).optional(),
  minSampleSize: z.number().int().min(1, { message: 'Min sample size must be at least 1' }).default(100),
  minConfidence: z.number().min(0).max(100).default(95),
  maxDuration: z.number().int().min(1, { message: 'Max duration must be at least 1 day' }).default(30),
});


// Schema for getExperiments
export const getExperimentsSchema = z.object({
  query: websiteIdQuerySchema.shape.query.merge(statusQuerySchema.shape.query),
});

// Schema for createExperiment
export const createExperimentSchema = z.object({
  body: z.object({
    websiteId: z.string().uuid({ message: 'Invalid website ID format' }),
    name: z.string().min(3, { message: 'Experiment name must be at least 3 characters' }),
    description: z.string().optional(),
    variations: z.array(variationSchema).min(2, { message: 'At least 2 variations are required' }),
    settings: experimentSettingsSchema,
  }),
});

// Schema for getExperiment
export const getExperimentSchema = experimentIdParamSchema;

// Schema for updateExperimentStatus
export const updateExperimentStatusSchema = z.object({
  params: experimentIdParamSchema.shape.params,
  body: z.object({
    status: z.nativeEnum(ExperimentStatus, { message: 'Invalid experiment status' }),
  }),
});

// Schema for declareWinner
export const declareWinnerSchema = z.object({
  params: experimentIdParamSchema.shape.params,
  body: z.object({
    winningVariation: z.string().min(1, { message: 'Winning variation name is required' }),
  }),
});

// Schema for updateExperiment
export const updateExperimentSchema = z.object({
  params: experimentIdParamSchema.shape.params,
  body: z.object({
    name: z.string().min(3, { message: 'Experiment name must be at least 3 characters' }).optional(),
    description: z.string().optional(),
    variations: z.array(variationSchema).min(2, { message: 'At least 2 variations are required' }).optional(),
    settings: experimentSettingsSchema.optional(),
  }),
});

// Schema for deleteExperiment
export const deleteExperimentSchema = experimentIdParamSchema;
