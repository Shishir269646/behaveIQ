// @/hooks/useExperiments.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Experiment } from '@/types'; // Import the comprehensive Experiment interface
import { useAppStore } from '@/store'; // Import useAppStore

export const useExperiments = () => {
    const [experiments, setExperiments] = useState<Experiment[]>([]);
    const [experiment, setExperiment] = useState<Experiment | null>(null); // For single experiment view
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const selectedWebsite = useAppStore((state) => state.website); // Get selectedWebsite

    const handleRequest = useCallback(async (request: () => Promise<any>) => {
        setIsLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await request();
            setIsLoading(false);
            return response;
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'An unknown error occurred.';
            setError(message);
            setIsLoading(false);
            throw err; // Re-throw to allow component to handle specific errors
        }
    }, []);

    const fetchExperiments = useCallback(async () => {
        if (!selectedWebsite?._id) {
            setExperiments([]);
            setIsLoading(false);
            return;
        }
        await handleRequest(async () => {
            const response = await api.get('/experiments', {
                params: { websiteId: selectedWebsite._id }
            });
            setExperiments(response.data.data.experiments);
            setSuccess('Experiments fetched successfully!');
        });
    }, [selectedWebsite?._id, handleRequest]);

    const createExperiment = useCallback(async (experimentData: Omit<Experiment, '_id' | 'createdAt' | 'updatedAt' | 'variations' | 'results'> & { variations: any[] }) => {
        if (!selectedWebsite?._id) {
            setError("No website selected.");
            return;
        }
        await handleRequest(async () => {
            const response = await api.post('/experiments', { ...experimentData, websiteId: selectedWebsite._id });
            const { experiment } = response.data.data;
            setExperiments((prev) => [...prev, experiment]);
            setSuccess('Experiment created successfully!');
        });
    }, [selectedWebsite?._id, handleRequest]);

    const fetchExperimentById = useCallback(async (id: string) => {
        await handleRequest(async () => {
            const response = await api.get(`/experiments/${id}`);
            const { experiment } = response.data.data;
            setExperiment(experiment);
            setSuccess('Experiment fetched successfully!');
        });
    }, [handleRequest]);

    const updateExperimentStatus = useCallback(async (id: string, status: Experiment['status']) => {
        await handleRequest(async () => {
            const response = await api.patch(`/experiments/${id}/status`, { status });
            const { experiment } = response.data.data;
            setExperiments((prev) => prev.map((exp) => (exp._id === id ? experiment : exp)));
            setExperiment(experiment); // Update if this is the currently viewed experiment
            setSuccess('Experiment status updated successfully!');
        });
    }, [handleRequest]);

    const declareWinner = useCallback(async (id: string, winningVariation: string) => {
        await handleRequest(async () => {
            const response = await api.post(`/experiments/${id}/declare-winner`, { winningVariation });
            const { experiment } = response.data.data;
            setExperiments((prev) => prev.map((exp) => (exp._id === id ? experiment : exp)));
            setExperiment(experiment); // Update if this is the currently viewed experiment
            setSuccess('Winner declared successfully!');
        });
    }, [handleRequest]);

    useEffect(() => {
        fetchExperiments();
    }, [fetchExperiments]);

    const clearSuccess = useCallback(() => setSuccess(null), []);

    return {
        experiments,
        experiment,
        isLoading,
        error,
        success,
        fetchExperiments,
        createExperiment,
        fetchExperimentById,
        updateExperimentStatus,
        declareWinner,
        clearSuccess,
    };
};