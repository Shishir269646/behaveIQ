import { useState, useCallback } from 'react';
import { api } from '@/lib/api'; // Use api instance
import { useAppStore } from '@/store';

export interface HeatmapPoint {
    x: number;
    y: number;
    value: number;
}

export interface ScrollDepthData {
    avgScrollDepth: number;
    maxScrollDepth: number;
}

export interface ConfusionZoneData {
    element: string;
    avgHoverTime: string;
    confusionScore: string;
}

export interface HeatmapResponseData {
    pageUrl: string;
    clicks: HeatmapPoint[];
    scrollDepth: ScrollDepthData;
    confusionZones: ConfusionZoneData[];
}

interface UseHeatmapReturn {
    data: HeatmapResponseData | null; // Changed to full response data
    loading: boolean;
    error: string | null;
    success: string | null;
    fetchHeatmapData: (websiteId: string, pageUrl: string) => Promise<void>;
    clearSuccess: () => void;
}

export const useHeatmap = (): UseHeatmapReturn => {
    const [data, setData] = useState<HeatmapResponseData | null>(null); // Changed to full response data
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const selectedWebsite = useAppStore((state) => state.website); // Get selectedWebsite

    const handleRequest = useCallback(async (request: () => Promise<any>) => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await request();
            setLoading(false);
            return response;
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'An unknown error occurred.';
            setError(message);
            setLoading(false);
            return null;
        }
    }, []);

    const fetchHeatmapData = useCallback(async (websiteId: string, pageUrl: string) => {
        if (!websiteId || !pageUrl) {
            setError("Website and Page URL must be provided.");
            return;
        }

        await handleRequest(async () => {
            const response = await api.get( // Use api instance
                `/dashboard/heatmap`,
                {
                    params: {
                        websiteId,
                        pageUrl: encodeURIComponent(pageUrl),
                    },
                }
            );

            if (response.data.success) {
                setData(response.data.data); // Set the full data object
                setSuccess('Heatmap data fetched successfully!');
            } else {
                setError(response.data.message || 'Failed to fetch heatmap data.');
            }
            return response;
        });
    }, [handleRequest]);

    const clearSuccess = useCallback(() => setSuccess(null), []);

    return { data, loading, error, success, fetchHeatmapData, clearSuccess };
};
