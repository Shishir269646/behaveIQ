import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './useAuth';

interface HeatmapPoint {
    x: number;
    y: number;
    value: number;
}

interface UseHeatmapReturn {
    data: HeatmapPoint[];
    loading: boolean;
    error: string | null;
    success: string | null;
    fetchHeatmapData: (websiteId: string, pageUrl: string) => Promise<void>;
    clearSuccess: () => void;
}

export const useHeatmap = (): UseHeatmapReturn => {
    const [data, setData] = useState<HeatmapPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const { token } = useAuth();

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
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/heatmap`,
                {
                    params: {
                        websiteId,
                        pageUrl: encodeURIComponent(pageUrl),
                    },
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.success) {
                setData(response.data.data);
                setSuccess('Heatmap data fetched successfully!');
            } else {
                setError(response.data.message || 'Failed to fetch heatmap data.');
            }
            return response;
        });
    }, [token, handleRequest]);

    const clearSuccess = useCallback(() => setSuccess(null), []);

    return { data, loading, error, success, fetchHeatmapData, clearSuccess };
};

