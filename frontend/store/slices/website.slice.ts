
import { StateCreator } from 'zustand';
import axios from 'axios';
import { Website } from '@/types';

export interface WebsiteSlice {
  websites: Website[];
  website: Website | null;
  loading: boolean;
  error: string | null;
  fetchWebsites: () => Promise<void>;
  fetchWebsiteById: (id: string) => Promise<void>;
  createWebsite: (websiteData: any) => Promise<void>;
  updateWebsite: (id: string, websiteData: any) => Promise<void>;
  deleteWebsite: (id: string) => Promise<void>;
}

const API_URL = 'http://localhost:5000/api/websites';

export const createWebsiteSlice: StateCreator<WebsiteSlice, [], [], WebsiteSlice> = (set) => ({
  websites: [],
  website: null,
  loading: false,
  error: null,
  fetchWebsites: async () => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ websites: response.data, loading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      set({ error: message, loading: false });
    }
  },
  fetchWebsiteById: async (id) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ website: response.data, loading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      set({ error: message, loading: false });
    }
  },
  createWebsite: async (websiteData) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(API_URL, websiteData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set((state) => ({ websites: [...state.websites, response.data], loading: false }));
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      set({ error: message, loading: false });
    }
  },
  updateWebsite: async (id, websiteData) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_URL}/${id}`, websiteData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set((state) => ({
        websites: state.websites.map((w) => (w._id === id ? response.data : w)),
        website: response.data,
        loading: false,
      }));
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      set({ error: message, loading: false });
    }
  },
  deleteWebsite: async (id) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set((state) => ({
        websites: state.websites.filter((w) => w._id !== id),
        loading: false,
      }));
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      set({ error: message, loading: false });
    }
  },
});
