export interface AnalyticsOverview {
    totalVisitors: number
    totalEvents: number
    totalConversions: number
    conversionRate: string
}

export interface EventsByType {
    _id: string
    count: number
}

export interface DailyStat {
    date: string
    events: number
    visitors: number
}

export interface TopPage {
    path: string
    views: number
    uniqueVisitors: number
}

export interface DeviceStat {
    _id: string
    count: number
}

export interface SiteAnalytics {
    overview: AnalyticsOverview
    eventsByType: EventsByType[]
    dailyStats: DailyStat[]
    topPages: TopPage[]
    deviceStats: DeviceStat[]
}

export interface VariantPerformance {
    variant: string
    name: string
    impressions: number
    conversions: number
    conversionRate: string
}

export interface FunnelStep {
    step: number
    path: string
    reached: number
    fromPrevious: number
    dropOff: number
    dropOffRate: string
}