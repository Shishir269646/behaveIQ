
export interface User {
  _id: string;
  email: string;
  fullName: string;
  avatar?: string;
  companyName?: string;
  plan: 'free' | 'pro' | 'premium' | 'enterprise'; // Synchronized with backend
  role: 'user' | 'admin'; // Added role field
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  settings?: { // New settings field
    twoFactorEnabled?: boolean;
    emailNotificationsEnabled?: boolean;
    pushNotificationsEnabled?: boolean;
  };
}

export interface Website {
  _id: string;
  userId: string;
  name: string;
  domain: string; // Renamed from url
  apiKey: string;
  industry: string;
  status: 'learning' | 'active' | 'paused';
      settings: {
          learningPeriodHours: number;
          autoPersonalization: boolean;
          experimentMode: boolean;
          notificationEmail?: string;
          emotionInterventions?: { // New property
              emotion: 'frustrated' | 'confused' | 'excited' | 'neutral' | 'considering';
              action: 'show_help_chat' | 'show_guide' | 'show_social_proof' | 'show_comparison' | 'none';
              message?: string;
              data?: any; // e.g., for discount offers
          }[];
          fraudDetectionSettings?: { // New property
              sensitivity: 'low' | 'medium' | 'high';
              riskBasedActions: {
                  requirePhoneVerification: boolean;
                  requireEmailVerification: boolean;
                  disableCOD: boolean;
                  showCaptcha: boolean;
                  manualReview: boolean;
                  limitOrderValue?: number;
              };
          };
      };  learningStartedAt: Date;
  activatedAt?: Date;
  stats: {
    totalSessions: number;
    totalEvents: number;
    totalPersonas: number;
    intentDistribution?: IntentDistribution;
  };
  createdAt: Date;
  updatedAt: Date;
  sdkScript: string;
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
    confidence: number;
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

export interface Discount {
  _id: string;
  userId: string;
  websiteId: string; // Added websiteId
  code: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  reasons: {
    factor: string;
    value: number;
  }[];
  applicableTo: {
    products?: string[];
    categories?: string[];
    minAmount?: number;
  };
  status: 'active' | 'used' | 'expired';
  usedAt?: Date;
  orderId?: string;
  createdAt: Date;
  expiresAt: string;
}

export interface AppEvent {
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

export interface PageView {
    page: string;
    views: number;
}

export interface TopPagesData {
    pages: PageView[];
}

export interface DeviceInfo {
    fingerprint: string;
    type: string; // mobile, desktop, tablet
    firstSeen: string;
    lastSeen: string;
    stitchedWith: {
        fingerprint: string;
        confidence: number;
        stitchedAt: string;
    }[];
}



export interface FraudEvent {
    id: string;
    risk: "High" | "Medium" | "Low";
    score: number;
    reason: string;
    status: "Blocked" | "Requires Review" | "Allowed";
    timestamp: string;
}

export interface HeatmapPoint {
    x: number;
    y: number;
    value: number;
}

export interface ScrollDepthData {
    avgScrollDepth: number;
    maxScrollDepth: number;
}

export interface ConfusionZoneData {
    element: string;
    avgHoverTime: string;
    confusionScore: string;
}

export interface HeatmapResponseData {
    pageUrl: string;
    clicks: HeatmapPoint[];
    scrollDepth: ScrollDepthData;
    confusionZones: ConfusionZoneData[];
}

export interface ActiveSession {
    sessionId: string;
    personaType: string;
    intentScore: number;
    currentPage: string;
    duration: number;
}

export interface RecentPageView {
    page: string;
    timestamp: string;
}

export interface RealtimeData {
    activeVisitors: number;
    activeSessions: ActiveSession[];
    recentPageViews: RecentPageView[];
}

export interface InterventionPerformance {
  type: string;
  shown: number;
  clicked: number;
  converted: number;
  effectiveness: number;
}

export interface RiskTrend {
  date: string;
  risk: number;
}

export interface AbandonmentData {
  overallRisk: number;
  interventionsTriggered: number;
  recoveryRate: number;
  interventionPerformance: InterventionPerformance[];
  riskTrends: RiskTrend[];
}

export interface Session {
  _id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  persona: string;
  status: string;
  intentScore: {
    initial: number;
    final: number;
    peak: number;
    changes: { score: number, timestamp: Date }[];
  };
  emotion: {
    current: string;
    changes: {
      from: string;
      to: string;
      timestamp: Date;
      trigger: string;
    }[];
  };
  events?: AppEvent[];
}

export interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: Event) => void;
    onend: () => void;
}

export interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult;
    length: number;
    item(index: number): SpeechRecognitionResult;
}
export interface SpeechRecognitionResult {
    [index: number]: SpeechRecognitionAlternative;
    length: number;
    final: boolean;
    item(index: number): SpeechRecognitionAlternative;
}
export interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: SpeechRecognitionErrorCode;
  message: string;
}

export type SpeechRecognitionErrorCode =
  | "no-speech"
  | "aborted"
  | "audio-capture"
  | "network"
  | "not-allowed"
  | "service-not-allowed"
  | "bad-grammar"
  | "language-not-supported";



export interface Insight {
  type: 'opportunity' | 'action_needed' | 'warning';
  priority: 'high' | 'medium' | 'low';
  message: string;
  action?: string;
  data?: any;
}

export interface IntentDistribution {
  low: number;
  medium: number;
  high: number;
}

export interface PersonaChartData {
  name: string;
  sessionCount: number;
}

export interface TrendData {
  date: string;
  sessions: number;
  conversions: number;
}

export interface OverviewData {
  totalVisitors: {
    value: number;
    change: number;
  };
  totalSessions: {
    value: number;
    change: number;
  };
  totalConversions: {
    value: number;
    change: number;
  };
  avgIntentScore: {
    value: number;
    change: number;
  };
}

