// @/hooks/useEmotionTrends.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store'; // ADDED

export interface EmotionTrend {
    date: string;
    [emotion: string]: number | string;
}

export interface EmotionTrendData {
    trends: EmotionTrend[];
}

export const useEmotionTrends = (timeRange: string = '7d') => {
    const [data, setData] = useState<EmotionTrendData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const selectedWebsite = useAppStore((state) => state.website); // ADDED

    const fetchData = useCallback(async () => {
        if (!selectedWebsite?._id) { // ADDED
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get<{ trends: EmotionTrend[] }>(`/emotion/trends?websiteId=${selectedWebsite._id}&timeRange=${timeRange}`); // MODIFIED
            setData({ trends: response.data.trends });
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Failed to fetch emotion trends data.");
        } finally {
            setIsLoading(false);
        }
    }, [timeRange, selectedWebsite?._id]); // MODIFIED

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, isLoading, error, refetch: fetchData };
};