import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store';

interface UseWebsitePagesReturn {
    pages: string[];
    loadingPages: boolean;
    errorPages: string | null;
    fetchWebsitePages: (websiteId: string) => Promise<void>;
}

export const useWebsitePages = (): UseWebsitePagesReturn => {
    const [pages, setPages] = useState<string[]>([]);
    const [loadingPages, setLoadingPages] = useState(false);
    const [errorPages, setErrorPages] = useState<string | null>(null);
    const selectedWebsite = useAppStore((state) => state.website);

    const fetchWebsitePages = useCallback(async (websiteId: string) => {
        if (!websiteId) {
            setErrorPages("Website ID must be provided.");
            return;
        }

        setLoadingPages(true);
        setErrorPages(null);
        try {
            const response = await api.get(`/websites/${websiteId}/pages`);
            if (response.data.success) {
                setPages(response.data.data.pages);
            } else {
                setErrorPages(response.data.message || 'Failed to fetch website pages.');
            }
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'An unknown error occurred.';
            setErrorPages(message);
        } finally {
            setLoadingPages(false);
        }
    }, []);

    return { pages, loadingPages, errorPages, fetchWebsitePages };
};
