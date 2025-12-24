
import { useStore } from '../store';

export const useDashboard = () => {
  const overview = useStore((state) => state.overview);
  const realtime = useStore((state) => state.realtime);
  const heatmap = useStore((state) => state.heatmap);
  const insights = useStore((state) => state.insights);
  const funnel = useStore((state) => state.funnel);
  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);
  const success = useStore((state) => state.success);
  const fetchOverview = useStore((state) => state.fetchOverview);
  const fetchRealtime = useStore((state) => state.fetchRealtime);
  const fetchHeatmap = useStore((state) => state.fetchHeatmap);
  const fetchInsights = useStore((state) => state.fetchInsights);
  const fetchConversionFunnel = useStore((state) => state.fetchConversionFunnel);
  const clearSuccess = useStore((state) => state.clearSuccess);

  return {
    overview,
    realtime,
    heatmap,
    insights,
    funnel,
    loading,
    error,
    success,
    fetchOverview,
    fetchRealtime,
    fetchHeatmap,
    fetchInsights,
    fetchConversionFunnel,
    clearSuccess,
  };
};
