// @/hooks/useFraud.ts
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

import { FraudEvent } from '@/types';

export const useFraud = () => {
    const [fraudEvents, setFraudEvents] = useState<FraudEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await api.get<FraudEvent[]>('/fraud');
                setFraudEvents(response.data.data);
            } catch (err: any) {
                setError(err.response?.data?.message || err.message || "Failed to fetch fraud events.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    return { fraudEvents, isLoading, error };
};
