// @/store/slices/dashboard.slice.ts
import { StateCreator } from 'zustand';
import { api } from '@/lib/api';
import { OverviewData, TrendData, Persona, Session } from '@/types';

export interface DashboardSlice {
  overview: OverviewData | null;
  topPersonas: Persona[];
  trendData: TrendData[];
  recentSessions: Session[];
  loading: boolean;
  error: string | null;
  fetchDashboardData: (websiteId: string, timeRange: string) => Promise<void>;
}

const handleRequest = async (set: any, request: () => Promise<any>) => {
    set({ loading: true, error: null });
    try {
      const response = await request();
      set({ loading: false });
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      set({ error: message, loading: false });
      throw error;
    }
};

export const createDashboardSlice: StateCreator<DashboardSlice, [], [], DashboardSlice> = (set) => ({
    overview: null,
    topPersonas: [],
    trendData: [],
    recentSessions: [],
    loading: false,
    error: null,
    fetchDashboardData: async (websiteId: string, timeRange: string) => {
        const data = await handleRequest(set, () => api.get(`/dashboard/overview?websiteId=${websiteId}&timeRange=${timeRange}`));
        set({
            overview: data.overview,
            topPersonas: data.topPersonas,
            trendData: data.trendData,
            recentSessions: data.recentSessions,
        });
    },
});
