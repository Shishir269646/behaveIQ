import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store';

export interface AbandonmentStat {
    date: string;
    riskScore: number;
    interventions: number;
    conversions: number;
}

export interface InterventionPerformance {
    type: string;
    shown: number;
    clicked: number;
    converted: number;
    effectiveness: number; // percentage
}

export interface AbandonmentData {
    riskTrends: AbandonmentStat[];
    overallRisk: number;
    interventionsTriggered: number;
    recoveryRate: number; // percentage
    interventionPerformance: InterventionPerformance[];
}

export const useAbandonment = (timeRange: string = '7d') => {
    const [data, setData] = useState<AbandonmentData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const selectedWebsite = useAppStore((state) => state.website);

    const fetchData = useCallback(async () => {
        if (!selectedWebsite?._id) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);
        try {
            // Assuming a new backend endpoint for abandonment stats
            const response = await api.get(`/abandonment/stats?websiteId=${selectedWebsite._id}&timeRange=${timeRange}`);
            setData(response.data.data);
            setSuccess('Abandonment data fetched successfully!');
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Failed to fetch abandonment data.");
        } finally {
            setIsLoading(false);
        }
    }, [timeRange, selectedWebsite?._id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const clearSuccess = useCallback(() => setSuccess(null), []);

    return { data, isLoading, error, success, fetchData, clearSuccess };
};
