
import { useStore } from '../store';

export const useWebsites = () => {
  const websites = useStore((state) => state.websites);
  const website = useStore((state) => state.website);
  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);
  const fetchWebsites = useStore((state) => state.fetchWebsites);
  const fetchWebsiteById = useStore((state) => state.fetchWebsiteById);
  const createWebsite = useStore((state) => state.createWebsite);
  const updateWebsite = useStore((state) => state.updateWebsite);
  const deleteWebsite = useStore((state) => state.deleteWebsite);

  return {
    websites,
    website,
    loading,
    error,
    fetchWebsites,
    fetchWebsiteById,
    createWebsite,
    updateWebsite,
    deleteWebsite,
  };
};
