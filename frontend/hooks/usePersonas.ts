// @/hooks/usePersonas.ts
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface Persona {
    name: string;
    description: string;
    confidence: number;
    userCount: number;
}

export interface PersonaData {
    budget: Persona[];
    feature: Persona[];
    researcher: Persona[];
    impulse: Persona[];
}

export const usePersonas = () => {
    const [data, setData] = useState<PersonaData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await api.get<PersonaData>('/personas');
                setData(response.data);
            } catch (err: any) {
                setError(err.response?.data?.message || err.message || "Failed to fetch persona data.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    return { data, isLoading, error };
};