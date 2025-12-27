import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

// Define types for the dashboard data
export interface Session {
    id: string;
    user: {
        name: string;
        email: string;
    };
    persona: string;
    status: 'Active' | 'Abandoned' | 'Converted';
    intentScore: number;
}

export interface PersonaStat {
    name: string;
    description: string;
    userCount: number;
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

export interface DashboardData {
    stats: DashboardStats;
    recentSessions: Session[];
    topPersonas: PersonaStat[];
    trendData: TrendData[];
}

export const useDashboard = (timeRange: string = '7d') => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Fetch data from both endpoints concurrently
            const [overviewRes, sessionsRes] = await Promise.all([
                api.get(`/dashboard/overview?timeRange=${timeRange}`),
                api.get(`/dashboard/recent-sessions?timeRange=${timeRange}`)
            ]);

            const overviewData = overviewRes.data.data;
            const sessionsData = sessionsRes.data.data;

            // Create a unified DashboardData object
            const dashboardData: DashboardData = {
                stats: {
                    totalVisitors: { value: overviewData.overview.totalVisitors, change: 0 }, // Placeholder for change
                    totalSessions: { value: overviewData.overview.totalSessions, change: 0 },
                    totalConversions: { value: overviewData.overview.totalConversions, change: 0 },
                    avgIntentScore: { value: overviewData.overview.avgIntentScore, change: 0 },
                },
                recentSessions: sessionsData.recentSessions,
                topPersonas: overviewData.topPersonas.map((p: any) => ({
                    name: p.name,
                    description: `Conversion Rate: ${p.stats.conversionRate.toFixed(2)}%`,
                    userCount: p.stats.sessionCount
                })),
                trendData: overviewData.trendData
            };

            setData(dashboardData);

        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Failed to fetch dashboard data.");
        } finally {
            setIsLoading(false);
        }
    }, [timeRange]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, isLoading, error, refetch: fetchData };
};