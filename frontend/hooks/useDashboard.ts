import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store';

// Define types for the dashboard data
export interface Session {
    id: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
    persona: string;
    status: 'Active' | 'Abandoned' | 'Converted';
    intentScore: number;
    events: Event[];
}

// Ensure Event is imported from '@/types'
import { Event } from "@/types";

export interface PersonaStat {
    name: string;
    description: string;
    userCount: number;
    conversionRate?: number; // Added
    confidence?: number; // Added
}

export interface DashboardStats {
    totalVisitors: { value: number; change: number };
    totalSessions: { value: number; change: number };
    totalConversions: { value: number; change: number };
    avgIntentScore: { value: number; change: number };
}

export interface TrendData {
    _id: string;
    sessions: number;
    conversions: number;
}

export interface IntentDistribution {
    low: number;
    medium: number;
    high: number;
}

export interface Insight {
    type: string;
    priority: string;
    message: string;
    action: string;
    data: any;
}

export interface DashboardData {
    stats: DashboardStats;
    recentSessions: Session[];
    topPersonas: PersonaStat[];
    trendData: TrendData[];
    intentDistribution: IntentDistribution;
    insights: Insight[];
    personaSummary?: PersonaSummary; // New
    personalizationStatus?: PersonalizationStatus; // New
    heatmapSummary?: HeatmapSummary; // New
    experimentSummary?: ExperimentSummary; // New
    contentSummary?: ContentSummary; // New
    abandonmentSummary?: AbandonmentSummary; // New
    discountSummary?: DiscountSummary; // New
    fraudSummary?: FraudSummary; // New
}

// New interfaces for DashboardData
export interface PersonaSummary {
    totalPersonas: number;
    newPersonasLast30Days: number;
}

export interface PersonalizationStatus {
    enabled: boolean;
}

export interface HeatmapSummary {
    hasRecentData: boolean;
    lastGenerated: string | null; // Date string
}

export interface ExperimentSummary {
    activeExperiments: number;
    totalExperiments: number;
}

export interface ContentSummary {
    totalContentGenerated: number;
    lastContentGenerated: string | null; // Date string
}

export interface AbandonmentSummary {
    abandonmentRate: number; // percentage
    interventionsTriggeredLast30Days: number;
}

export interface DiscountSummary {
    totalDiscountsOffered: number;
    avgDiscountValue: number; // in currency
}

export interface FraudSummary {
    fraudIncidentsLast30Days: number;
    totalFraudScores: number;
}


export const useDashboard = (timeRange: string = '7d') => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const selectedWebsite = useAppStore((state) => state.website);


    const fetchData = useCallback(async () => {
        if (!selectedWebsite?._id) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            // Fetch data from all endpoints concurrently
            const [
                overviewRes,
                insightsRes,
                intentDistRes,
                personaSummaryRes, // New
                personalizationStatusRes, // New
                heatmapSummaryRes, // New
                experimentSummaryRes, // New
                contentSummaryRes, // New
                abandonmentSummaryRes, // New
                discountSummaryRes, // New
                fraudSummaryRes, // New
            ] = await Promise.all([
                api.get(`/dashboard/overview?websiteId=${selectedWebsite._id}&timeRange=${timeRange}`),
                api.get(`/dashboard/insights?websiteId=${selectedWebsite._id}`),
                api.get(`/dashboard/intent-distribution?websiteId=${selectedWebsite._id}`),
                api.get(`/dashboard/summary/personas?websiteId=${selectedWebsite._id}&timeRange=${timeRange}`), // New endpoint
                api.get(`/dashboard/summary/personalization?websiteId=${selectedWebsite._id}`), // New endpoint
                api.get(`/dashboard/summary/heatmaps?websiteId=${selectedWebsite._id}&timeRange=${timeRange}`), // New endpoint
                api.get(`/dashboard/summary/experiments?websiteId=${selectedWebsite._id}&timeRange=${timeRange}`), // New endpoint
                api.get(`/dashboard/summary/content?websiteId=${selectedWebsite._id}&timeRange=${timeRange}`), // New endpoint
                api.get(`/dashboard/summary/abandonment?websiteId=${selectedWebsite._id}&timeRange=${timeRange}`), // New endpoint
                api.get(`/dashboard/summary/discounts?websiteId=${selectedWebsite._id}&timeRange=${timeRange}`), // New endpoint
                api.get(`/dashboard/summary/fraud?websiteId=${selectedWebsite._id}&timeRange=${timeRange}`), // New endpoint
            ]);

            const { overview } = overviewRes.data.data;

            setData({
                stats: {
                    totalVisitors: { value: overview.totalVisitors, change: 0 },
                    totalSessions: { value: overview.totalSessions, change: 0 },
                    totalConversions: { value: overview.totalConversions, change: 0 },
                    avgIntentScore: { value: overview.avgIntentScore, change: 0 },
                },
                recentSessions: overview.recentSessions,
                topPersonas: overview.topPersonas.map((p: any) => ({
                    name: p.name,
                    description: `Conversion Rate: ${p.stats.conversionRate?.toFixed(2) || 0}%`,
                    userCount: p.stats.sessionCount,
                    conversionRate: p.stats.conversionRate,
                    confidence: p.stats.confidence || 0,
                })),
                trendData: overview.trendData,
                intentDistribution: intentDistRes.data.data.intentDistribution, // Corrected
                insights: insightsRes.data.data.insights, // Corrected
                personaSummary: personaSummaryRes.data.data,
                personalizationStatus: personalizationStatusRes.data.data,
                heatmapSummary: heatmapSummaryRes.data.data,
                experimentSummary: experimentSummaryRes.data.data,
                contentSummary: contentSummaryRes.data.data,
                abandonmentSummary: abandonmentSummaryRes.data.data,
                discountSummary: discountSummaryRes.data.data,
                fraudSummary: fraudSummaryRes.data.data,
            });

        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Failed to fetch dashboard data.");
        } finally {
            setIsLoading(false);
        }
    }, [timeRange, selectedWebsite?._id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, isLoading, error, refetch: fetchData };
};