import { StateCreator } from 'zustand';
import axios from 'axios';
import { Event } from '@/types';

export interface EventSlice {
  events: Event[];
  eventStats: any;
  loading: boolean;
  error: string | null;
  success: string | null;
  fetchEvents: (websiteId: string) => Promise<void>;
  fetchEventStats: (websiteId: string) => Promise<void>;
  clearSuccess: () => void;
}

const API_URL = 'http://localhost:5000/api/events';

const handleRequest = async (set: any, request: () => Promise<any>) => {
  set({ loading: true, error: null });
  try {
    const response = await request();
    return response;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message;
    set({ error: message, loading: false });
  }
};

export const createEventSlice: StateCreator<EventSlice, [], [], EventSlice> = (set) => ({
  events: [],
  eventStats: null,
  loading: false,
  error: null,
  success: null,
  fetchEvents: async (websiteId) => {
    await handleRequest(set, async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
        params: { websiteId },
      });
      set({ events: response.data, loading: false, success: 'Events fetched successfully!' });
    });
  },
  fetchEventStats: async (websiteId) => {
    await handleRequest(set, async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { websiteId },
      });
      set({ eventStats: response.data, loading: false, success: 'Event stats fetched successfully!' });
    });
  },
  clearSuccess: () => {
    set({ success: null });
  },
});