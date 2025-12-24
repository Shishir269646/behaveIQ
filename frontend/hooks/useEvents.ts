
import { useStore } from '../store';

export const useEvents = () => {
  const events = useStore((state) => state.events);
  const eventStats = useStore((state) => state.eventStats);
  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);
  const success = useStore((state) => state.success);
  const fetchEvents = useStore((state) => state.fetchEvents);
  const fetchEventStats = useStore((state) => state.fetchEventStats);
  const clearSuccess = useStore((state) => state.clearSuccess);

  return {
    events,
    eventStats,
    loading,
    error,
    success,
    fetchEvents,
    fetchEventStats,
    clearSuccess,
  };
};
