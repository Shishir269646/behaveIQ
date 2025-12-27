// @/hooks/useDiscounts.ts
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface Discount {
    id: string;
    name: string;
    type: string; // e.g., "First-time Buyer", "Seasonal"
    value: string; // e.g., "15% OFF", "$20 OFF"
    status: "Active" | "Expired" | "Draft";
    usage: number;
}

export const useDiscounts = () => {
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await api.get<Discount[]>('/discounts');
                setDiscounts(response.data);
            } catch (err: any) {
                setError(err.response?.data?.message || err.message || "Failed to fetch discounts.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    return { discounts, isLoading, error };
};
