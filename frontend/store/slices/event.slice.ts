
import { StateCreator } from 'zustand';
import axios from 'axios';
import { Event } from '@/types';

export interface EventSlice {
  events: Event[];
  eventStats: any;
  loading: boolean;
  error: string | null;
  fetchEvents: (websiteId: string) => Promise<void>;
  fetchEventStats: (websiteId: string) => Promise<void>;
}

const API_URL = 'http://localhost:5000/api/events';

export const createEventSlice: StateCreator<EventSlice, [], [], EventSlice> = (set) => ({
  events: [],
  eventStats: null,
  loading: false,
  error: null,
  fetchEvents: async (websiteId) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
        params: { websiteId },
      });
      set({ events: response.data, loading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      set({ error: message, loading: false });
    }
  },
  fetchEventStats: async (websiteId) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { websiteId },
      });
      set({ eventStats: response.data, loading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      set({ error: message, loading: false });
    }
  },
});
