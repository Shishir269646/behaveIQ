
import { useStore } from '../store';

export const useEvents = () => {
  const events = useStore((state) => state.events);
  const eventStats = useStore((state) => state.eventStats);
  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);
  const fetchEvents = useStore((state) => state.fetchEvents);
  const fetchEventStats = useStore((state) => state.fetchEventStats);

  return {
    events,
    eventStats,
    loading,
    error,
    fetchEvents,
    fetchEventStats,
  };
};
