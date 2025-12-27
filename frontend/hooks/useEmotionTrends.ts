// @/hooks/useEmotionTrends.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

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

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get(`/emotions/trends?timeRange=${timeRange}`);
            setData(response.data.data);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Failed to fetch emotion trends data.");
        } finally {
            setIsLoading(false);
        }
    }, [timeRange]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, isLoading, error, refetch: fetchData };
};