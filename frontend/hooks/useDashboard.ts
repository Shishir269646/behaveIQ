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
    intentDistribution: IntentDistribution; // Added
    insights: Insight[]; // Added
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
            const [overviewRes, insightsRes, intentDistRes] = await Promise.all([
                api.get(`/dashboard/overview?websiteId=${selectedWebsite._id}&timeRange=${timeRange}`),
                api.get(`/dashboard/insights?websiteId=${selectedWebsite._id}`),
                api.get(`/dashboard/intent-distribution?websiteId=${selectedWebsite._id}`), // Assuming this endpoint exists
            ]);

            const overviewData = overviewRes.data.data;
            const insightsData = insightsRes.data.data.insights;
            const intentDistributionData = intentDistRes.data.data.intentDistribution;

            // Create a unified DashboardData object
            const dashboardData: DashboardData = {
                stats: {
                    totalVisitors: { value: overviewData.overview.totalVisitors, change: 0 }, // Placeholder for change
                    totalSessions: { value: overviewData.overview.totalSessions, change: 0 },
                    totalConversions: { value: overviewData.overview.totalConversions, change: 0 },
                    avgIntentScore: { value: overviewData.overview.avgIntentScore, change: 0 },
                },
                recentSessions: overviewData.recentSessions,
                topPersonas: overviewData.topPersonas.map((p: any) => ({
                    name: p.name,
                    description: `Conversion Rate: ${p.stats.conversionRate?.toFixed(2) || 0}%`,
                    userCount: p.stats.sessionCount,
                    conversionRate: p.stats.conversionRate,
                    confidence: p.stats.confidence || 0, // Assuming confidence from backend
                })),
                trendData: overviewData.trendData,
                intentDistribution: intentDistributionData,
                insights: insightsData,
            };

            setData(dashboardData);

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