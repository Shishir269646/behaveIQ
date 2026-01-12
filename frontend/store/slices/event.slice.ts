// @/store/slices/event.slice.ts
import { StateCreator } from 'zustand';
import { api } from '@/lib/api';
import { AppEvent } from '@/types';

export interface EventSlice {
  events: AppEvent[];
  loading: boolean;
  error: string | null;
  success: string | null;
  fetchEvents: () => Promise<void>;
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

export const createEventSlice: StateCreator<EventSlice, [], [], EventSlice> = (set, get) => ({
    events: [],
    loading: false,
    error: null,
    success: null,
    fetchEvents: async () => {
        const { website } = get(); // Access website from the combined store
        if (!website) {
            set({ error: 'No website selected. Please select a website to view events.', loading: false });
            return;
        }
        const responseData = await handleRequest(set, () => api.get(`/events?websiteId=${website._id}`));
        set({ events: responseData.events });
    },
    clearSuccess: () => {
        set({ success: null, error: null });
    },
});
