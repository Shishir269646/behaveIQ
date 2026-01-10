// @/hooks/useDiscounts.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Discount } from '@/types'; // Import the comprehensive Discount interface
import { useAppStore } from '@/store'; // Import useAppStore

export const useDiscounts = () => {
    const [discounts, setDiscounts] = useState<Discount[]>([]);
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
            throw err;
        }
    }, []);

    const fetchDiscounts = useCallback(async () => {
        if (!selectedWebsite?._id) {
            setDiscounts([]);
            setIsLoading(false);
            return;
        }
        await handleRequest(async () => {
            const response = await api.get('/discounts', {
                params: { websiteId: selectedWebsite._id }
            });
            setDiscounts(response.data.data);
            setSuccess('Discounts fetched successfully!');
        });
    }, [selectedWebsite?._id, handleRequest]);

    const createDiscount = useCallback(async (discountData: Omit<Discount, '_id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
        if (!selectedWebsite?._id) {
            setError("No website selected.");
            return;
        }
        await handleRequest(async () => {
            const response = await api.post('/discounts', { ...discountData, websiteId: selectedWebsite._id });
            const { discount } = response.data.data;
            setDiscounts((prev) => [...prev, discount]);
            setSuccess('Discount created successfully!');
        });
    }, [selectedWebsite?._id, handleRequest]);

    const updateDiscount = useCallback(async (id: string, discountData: Partial<Discount>) => {
        await handleRequest(async () => {
            const response = await api.patch(`/discounts/${id}`, discountData);
            const { discount } = response.data.data;
            setDiscounts((prev) => prev.map((disc) => (disc._id === id ? discount : disc)));
            setSuccess('Discount updated successfully!');
        });
    }, [handleRequest]);

    const deleteDiscount = useCallback(async (id: string) => {
        await handleRequest(async () => {
            await api.delete(`/discounts/${id}`);
            setDiscounts((prev) => prev.filter((disc) => disc._id !== id));
            setSuccess('Discount deleted successfully!');
        });
    }, [handleRequest]);

    useEffect(() => {
        fetchDiscounts();
    }, [fetchDiscounts]);

    const clearSuccess = useCallback(() => setSuccess(null), []);

    return {
        discounts,
        isLoading,
        error,
        success,
        fetchDiscounts,
        createDiscount,
        updateDiscount,
        deleteDiscount,
        clearSuccess,
    };
};
