
import { useAppStore } from '../store';

export const useWebsites = () => {
  const websites = useAppStore((state) => state.websites);
  const selectedWebsite = useAppStore((state) => state.website); // Use 'website' from store
  const loading = useAppStore((state) => state.loading);
  const error = useAppStore((state) => state.error);
  const success = useAppStore((state) => state.success);
  const fetchWebsites = useAppStore((state) => state.fetchWebsites);
  const fetchWebsiteById = useAppStore((state) => state.fetchWebsiteById);
  const createWebsite = useAppStore((state) => state.createWebsite);
  const updateWebsite = useAppStore((state) => state.updateWebsite);
  const deleteWebsite = useAppStore((state) => state.deleteWebsite);
  const selectWebsite = useAppStore((state) => state.selectWebsite); // Add selectWebsite
  const clearSuccess = useAppStore((state) => state.clearSuccess);

  return {
    websites,
    selectedWebsite, // Expose selectedWebsite
    loading,
    error,
    success,
    fetchWebsites,
    fetchWebsiteById,
    createWebsite,
    updateWebsite,
    deleteWebsite,
    selectWebsite, // Expose selectWebsite
    clearSuccess,
  };
};
