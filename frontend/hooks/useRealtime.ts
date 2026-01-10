// @/hooks/useRealtime.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store'; // ADDED

import { ActiveSession, RecentPageView, RealtimeData } from '@/types';

export const useRealtime = (refreshInterval: number = 5000) => {
    const [data, setData] = useState<RealtimeData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const selectedWebsite = useAppStore((state) => state.website); // ADDED

    const fetchData = useCallback(async () => { // MODIFIED with useCallback
        if (!selectedWebsite?._id) { // ADDED
            setIsLoading(false);
            return;
        }

        // Only set loading on the initial fetch
        if (!data) {
            setIsLoading(true);
        }
        setError(null);
        try {
            const response = await api.get(`/dashboard/realtime?websiteId=${selectedWebsite._id}`); // MODIFIED
            setData(response.data.data);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Failed to fetch real-time data.");
        } finally {
            setIsLoading(false);
        }
    }, [refreshInterval, selectedWebsite?._id]); // MODIFIED dependencies for useCallback

    useEffect(() => {
        fetchData(); // Initial fetch
        const intervalId = setInterval(fetchData, refreshInterval);

        return () => clearInterval(intervalId); // Cleanup on unmount
    }, [fetchData, refreshInterval]); // MODIFIED dependencies for useEffect

    return { data, isLoading, error };
};