
export interface User {
  _id: string;
  email: string;
  fullName: string;
  companyName?: string;
  plan: 'free' | 'starter' | 'growth' | 'enterprise';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Website {
  _id: string;
  userId: string;
  name: string;
  domain: string;
  apiKey: string;
  industry: string;
  status: 'learning' | 'active' | 'paused';
  settings: {
    learningPeriodHours: number;
    autoPersonalization: boolean;
    experimentMode: boolean;
    notificationEmail?: string;
  };
  learningStartedAt: Date;
  activatedAt?: Date;
  stats: {
    totalSessions: number;
    totalEvents: number;
    totalPersonas: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Persona {
  _id: string;
  websiteId: string;
  name: string;
  description?: string;
  clusterData: {
    clusterId: number;
    avgTimeSpent: number;
    avgScrollDepth: number;
    avgClickRate: number;
    avgPageViews: number;
    commonPages: string[];
    commonDevices: string[];
    behaviorPattern: {
      exploreMore: boolean;
      quickDecision: boolean;
      priceConscious: boolean;
      featureFocused: boolean;
    };
    characteristics: string[];
  };
  stats: {
    sessionCount: number;
    totalConversions: number;
    conversionRate: number;
    avgIntentScore: number;
    lastUpdated?: Date;
  };
  personalizationRules: {
    selector: string;
    content: string;
    contentType: 'text' | 'html' | 'image';
    variation: string;
    priority: number;
    isActive: boolean;
    performance: {
      impressions: number;
      conversions: number;
      conversionRate: number;
    };
    createdAt: Date;
  }[];
  isActive: boolean;
  isAutoDiscovered: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Experiment {
  _id: string;
  websiteId: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  variations: {
    name: string;
    isControl: boolean;
    selector?: string;
    content?: string;
    contentType: 'text' | 'html' | 'css';
    trafficPercentage: number;
    visitors: number;
    conversions: number;
    conversionRate: number;
  }[];
  results?: {
    winner?: string;
    confidence?: number;
    improvement?: number;
    declaredAt?: Date;
  };
  settings: {
    targetUrl?: string;
    conversionGoal?: string;
    minSampleSize: number;
    minConfidence: number;
    maxDuration: number;
  };
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  _id: string;
  sessionId: string;
  websiteId: string;
  eventType: 'pageview' | 'click' | 'scroll' | 'mousemove' | 'hover' | 'form_submit' | 'exit' | 'custom';
  eventData: {
    pageUrl?: string;
    pageTitle?: string;
    element?: string;
    elementText?: string;
    elementId?: string;
    elementClass?: string;
    x?: number;
    y?: number;
    scrollDepth?: number;
    scrollDirection?: string;
    timeSpent?: number;
    formId?: string;
    formFields?: any;
    customData?: any;
  };
  timestamp: Date;
}
