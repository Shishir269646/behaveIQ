// @/hooks/useTopPages.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store'; // ADDED

export interface PageView {
    page: string;
    views: number;
}

export interface TopPagesData {
    pages: PageView[];
}

export const useTopPages = (timeRange: string = '7d') => {
    const [data, setData] = useState<TopPagesData | null>(null);
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
            const response = await api.get(`/dashboard/top-pages?websiteId=${selectedWebsite._id}&timeRange=${timeRange}`); // MODIFIED
            setData(response.data.data);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Failed to fetch top pages data.");
        } finally {
            setIsLoading(false);
        }
    }, [timeRange, selectedWebsite?._id]); // MODIFIED

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, isLoading, error, refetch: fetchData };
};