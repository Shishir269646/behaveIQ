// @/store/slices/fraud.slice.ts
import { StateCreator } from 'zustand';
import { api } from '@/lib/api';
import { FraudEvent } from '@/types';

export interface FraudSlice {
  fraudEvents: FraudEvent[];
  loading: boolean;
  error: string | null;
  success: string | null;
  fetchFraudEvents: () => Promise<void>;
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

export const createFraudSlice: StateCreator<FraudSlice, [], [], FraudSlice> = (set) => ({
    fraudEvents: [],
    loading: false,
    error: null,
    success: null,
    fetchFraudEvents: async () => {
        const fraudEvents = await handleRequest(set, () => api.get('/fraud'));
        set({ fraudEvents });
    },
    clearSuccess: () => {
        set({ success: null, error: null });
    },
});
