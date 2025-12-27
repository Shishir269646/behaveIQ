// @/hooks/useRealtime.ts
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

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

export const useRealtime = (refreshInterval: number = 5000) => {
    const [data, setData] = useState<RealtimeData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        // Only set loading on the initial fetch
        if (!data) {
            setIsLoading(true);
        }
        setError(null);
        try {
            const response = await api.get('/dashboard/realtime');
            setData(response.data.data);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Failed to fetch real-time data.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData(); // Initial fetch
        const intervalId = setInterval(fetchData, refreshInterval);

        return () => clearInterval(intervalId); // Cleanup on unmount
    }, [refreshInterval]);

    return { data, isLoading, error };
};