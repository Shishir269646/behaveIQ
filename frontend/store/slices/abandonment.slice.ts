// @/store/slices/abandonment.slice.ts
import { StateCreator } from 'zustand';
import { api } from '@/lib/api';
import { AbandonmentData } from '@/types';

export interface AbandonmentSlice {
  data: AbandonmentData | null;
  loading: boolean;
  error: string | null;
  success: string | null;
  fetchData: (timeRange: string) => Promise<void>;
  clearSuccess: () => void;
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

export const createAbandonmentSlice: StateCreator<AbandonmentSlice, [], [], AbandonmentSlice> = (set) => ({
    data: null,
    loading: false,
    error: null,
    success: null,
    fetchData: async (timeRange: string) => {
        const data = await handleRequest(set, () => api.get(`/abandonment/stats?timeRange=${timeRange}`));
        set({ data });
    },
    clearSuccess: () => {
        set({ success: null, error: null });
    },
});
