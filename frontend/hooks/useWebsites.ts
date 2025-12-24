
import { useStore } from '../store';

export const useWebsites = () => {
  const websites = useStore((state) => state.websites);
  const website = useStore((state) => state.website);
  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);
  const success = useStore((state) => state.success);
  const fetchWebsites = useStore((state) => state.fetchWebsites);
  const fetchWebsiteById = useStore((state) => state.fetchWebsiteById);
  const createWebsite = useStore((state) => state.createWebsite as (websiteData: any, defaultMessage?: string) => Promise<void>);
  const updateWebsite = useStore((state) => state.updateWebsite);
  const deleteWebsite = useStore((state) => state.deleteWebsite);
  const clearSuccess = useStore((state) => state.clearSuccess);

  return {
    websites,
    website,
    loading,
    error,
    success,
    fetchWebsites,
    fetchWebsiteById,
    createWebsite,
    updateWebsite,
    deleteWebsite,
    clearSuccess,
  };
};
