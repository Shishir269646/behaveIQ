import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

import { DeviceInfo } from '@/types';

export const useUserDevices = (userId: string | undefined) => {
    const [devices, setDevices] = useState<DeviceInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDevices = useCallback(async () => {
        if (!userId) {
            setDevices([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get(`/device/user/${userId}`);
            setDevices(response.data.data);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Failed to fetch user devices.");
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchDevices();
    }, [fetchDevices]);

    return { devices, isLoading, error, fetchDevices };
};
