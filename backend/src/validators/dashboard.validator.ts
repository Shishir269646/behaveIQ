import { z } from 'zod';

// Schema for common query parameters in dashboard requests
export const dashboardQuerySchema = z.object({
  query: z.object({
    websiteId: z.string().uuid({ message: 'Invalid websiteId format' }),
    timeRange: z.string().regex(/^\d+(d|w|m|y)$/, { message: 'Invalid timeRange format (e.g., 7d, 1w, 1m)' }).optional(),
    pageUrl: z.string().url({ message: 'Invalid pageUrl format' }).optional(),
  }),
});

// Specific schema for heatmap, as it requires pageUrl
export const heatmapQuerySchema = z.object({
  query: z.object({
    websiteId: z.string().uuid({ message: 'Invalid websiteId format' }),
    pageUrl: z.string().min(1, { message: 'pageUrl is required for heatmap data' }),
  }),
});

// Schema for real-time visitors (only websiteId needed)
export const realtimeVisitorsQuerySchema = z.object({
  query: z.object({
    websiteId: z.string().uuid({ message: 'Invalid websiteId format' }),
  }),
});

// Schema for insights (only websiteId needed)
export const insightsQuerySchema = z.object({
  query: z.object({
    websiteId: z.string().uuid({ message: 'Invalid websiteId format' }),
  }),
});

// Schema for conversion funnel (only websiteId needed)
export const conversionFunnelQuerySchema = z.object({
  query: z.object({
    websiteId: z.string().uuid({ message: 'Invalid websiteId format' }),
  }),
});

// Schema for top pages (websiteId and optional timeRange)
export const topPagesQuerySchema = z.object({
  query: z.object({
    websiteId: z.string().uuid({ message: 'Invalid websiteId format' }),
    timeRange: z.string().regex(/^\d+(d|w|m|y)$/, { message: 'Invalid timeRange format (e.g., 7d, 1w, 1m)' }).optional(),
  }),
});

// Schema for intent distribution (only websiteId needed)
export const intentDistributionQuerySchema = z.object({
  query: z.object({
    websiteId: z.string().uuid({ message: 'Invalid websiteId format' }),
  }),
});

// Schema for fraud summary (websiteId and optional timeRange)
export const fraudSummaryQuerySchema = z.object({
  query: z.object({
    websiteId: z.string().uuid({ message: 'Invalid websiteId format' }),
    timeRange: z.string().regex(/^\d+(d|w|m|y)$/, { message: 'Invalid timeRange format (e.g., 7d, 1w, 1m)' }).optional(),
  }),
});

// Schema for persona summary (only websiteId needed)
export const personaSummaryQuerySchema = z.object({
  query: z.object({
    websiteId: z.string().uuid({ message: 'Invalid websiteId format' }),
  }),
});

// Schema for personalization status (only websiteId needed)
export const personalizationStatusQuerySchema = z.object({
  query: z.object({
    websiteId: z.string().uuid({ message: 'Invalid websiteId format' }),
  }),
});

// Schema for heatmap summary (only websiteId needed)
export const heatmapSummaryQuerySchema = z.object({
  query: z.object({
    websiteId: z.string().uuid({ message: 'Invalid websiteId format' }),
  }),
});

// Schema for experiment summary (only websiteId needed)
export const experimentSummaryQuerySchema = z.object({
  query: z.object({
    websiteId: z.string().uuid({ message: 'Invalid websiteId format' }),
  }),
});

// Schema for content summary (only websiteId needed)
export const contentSummaryQuerySchema = z.object({
  query: z.object({
    websiteId: z.string().uuid({ message: 'Invalid websiteId format' }),
  }),
});

// Schema for abandonment summary (websiteId and optional timeRange)
export const abandonmentSummaryQuerySchema = z.object({
  query: z.object({
    websiteId: z.string().uuid({ message: 'Invalid websiteId format' }),
    timeRange: z.string().regex(/^\d+(d|w|m|y)$/, { message: 'Invalid timeRange format (e.g., 7d, 1w, 1m)' }).optional(),
  }),
});

// Schema for discount summary (only websiteId needed)
export const discountSummaryQuerySchema = z.object({
  query: z.object({
    websiteId: z.string().uuid({ message: 'Invalid websiteId format' }),
  }),
});
