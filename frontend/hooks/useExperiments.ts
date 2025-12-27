// @/hooks/useExperiments.ts
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface Experiment {
    id: string;
    name: string;
    status: "Running" | "Completed" | "Draft";
    conversionLift: string; // e.g., "+5.2%"
    progress: number; // 0-100
    winner: string; // e.g., "Variant B", "Control", "N/A"
}

export const useExperiments = () => {
    const [experiments, setExperiments] = useState<Experiment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await api.get<Experiment[]>('/experiments');
                setExperiments(response.data);
            } catch (err: any) {
                setError(err.response?.data?.message || err.message || "Failed to fetch experiments.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    return { experiments, isLoading, error };
};