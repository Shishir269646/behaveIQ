// @/hooks/useConversionFunnel.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store'; // ADDED

export interface FunnelStep {
    step: string;
    visitors: number;
    dropoff: number;
    conversionRate: number;
}

export interface ConversionFunnelData {
    funnel: FunnelStep[];
}

export const useConversionFunnel = (timeRange: string = '7d') => {
    const [data, setData] = useState<ConversionFunnelData | null>(null);
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
            const response = await api.get<ConversionFunnelData>(`/dashboard/conversion-funnel?websiteId=${selectedWebsite._id}&timeRange=${timeRange}`); // MODIFIED
            setData(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Failed to fetch conversion funnel data.");
        } finally {
            setIsLoading(false);
        }
    }, [timeRange, selectedWebsite?._id]); // MODIFIED

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, isLoading, error, refetch: fetchData };
};