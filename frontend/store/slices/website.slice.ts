
import { StateCreator } from 'zustand';
import axios from 'axios';
import { Website } from '@/types';

export interface WebsiteSlice {
  websites: Website[];
  website: Website | null;
  loading: boolean;
  error: string | null;
  success: string | null;
  fetchWebsites: () => Promise<void>;
  fetchWebsiteById: (id: string) => Promise<void>;
  createWebsite: (websiteData: any, defaultMessage?: string) => Promise<void>;
  updateWebsite: (id: string, websiteData: any) => Promise<void>;
  deleteWebsite: (id: string) => Promise<void>;
  clearSuccess: () => void;
}

const API_URL = 'http://localhost:5000/api/v1/websites';

const handleRequest = async (set: any, request: () => Promise<any>) => {
  set({ loading: true, error: null });
  try {
    const token = localStorage.getItem('token');
    const response = await request();
    return response;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message;
    set({ error: message, loading: false });
  }
};

export const createWebsiteSlice: StateCreator<WebsiteSlice, [], [], WebsiteSlice> = (set) => ({
  websites: [],
  website: null,
  loading: false,
  error: null,
  success: null,
  fetchWebsites: async () => {
    await handleRequest(set, async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ websites: response.data.data.websites, loading: false });
    });
  },
  fetchWebsiteById: async (id) => {
    await handleRequest(set, async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ website: response.data, loading: false });
    });
  },
  createWebsite: async (websiteData, defaultMessage) => {
    await handleRequest(set, async () => {
      const token = localStorage.getItem('token');
      const response = await axios.post(API_URL, { ...websiteData, defaultMessage }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set((state: any) => ({
        websites: [...state.websites, response.data],
        loading: false,
        success: 'Website created successfully!',
      }));
    });
  },
  updateWebsite: async (id, websiteData) => {
    await handleRequest(set, async () => {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_URL}/${id}`, websiteData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set((state: any) => ({
        websites: state.websites.map((w: any) => (w._id === id ? response.data : w)),
        website: response.data,
        loading: false,
      }));
    });
  },
  deleteWebsite: async (id) => {
    await handleRequest(set, async () => {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set((state: any) => ({
        websites: state.websites.filter((w: any) => w._id !== id),
        loading: false,
      }));
    });
  },
  clearSuccess: () => {
    set({ success: null, loading: false });
  },
});
