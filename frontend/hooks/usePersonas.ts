// @/hooks/usePersonas.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Persona } from '@/types'; // Import Persona from types
import { useAppStore } from '@/store'; // Import useAppStore

export const usePersonas = () => {
    const [personas, setPersonas] = useState<Persona[]>([]); // Changed to Persona[]
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const selectedWebsite = useAppStore((state) => state.website); // Get selectedWebsite

    const fetchData = useCallback(async (websiteId: string) => {
        setIsLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await api.get<{ data: { personas: Persona[] } }>('/personas', {
                params: { websiteId }
            });
            setPersonas(response.data.data.personas);
            setSuccess('Personas fetched successfully!');
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Failed to fetch persona data.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const discoverPersonas = useCallback(async (websiteId: string) => {
        setIsLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await api.post('/personas/discover', { websiteId });
            setSuccess('Persona discovery initiated!');
            // Re-fetch personas after discovery
            fetchData(websiteId);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Failed to initiate persona discovery.");
        } finally {
            setIsLoading(false);
        }
    }, [fetchData]);

    useEffect(() => {
        if (selectedWebsite?._id) {
            fetchData(selectedWebsite._id);
        } else {
            setPersonas([]);
            setIsLoading(false);
        }
    }, [selectedWebsite?._id, fetchData]);

    const clearSuccess = useCallback(() => setSuccess(null), []);

    return { personas, isLoading, error, success, fetchData, discoverPersonas, clearSuccess };
};