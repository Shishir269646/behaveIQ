import { StateCreator } from 'zustand';
import axios from 'axios';
import { Persona } from '@/types';

export interface DashboardSlice {
  overview: {
    overview: {
      totalVisitors: number;
      totalSessions: number;
      conversionRate: number;
      avgIntentScore: number;
    };
    trendData: { _id: string; sessions: number }[];
    topPersonas: Persona[];
  } | null;
  realtime: any;
  heatmap: any;
  insights: any;
  funnel: any;
  loading: boolean;
  error: string | null;
  success: string | null;
  fetchOverview: (websiteId: string, timeRange?: string) => Promise<void>;
  fetchRealtime: (websiteId: string) => Promise<void>;
  fetchHeatmap: (websiteId: string, pageUrl: string) => Promise<void>;
  fetchInsights: (websiteId: string) => Promise<void>;
  fetchConversionFunnel: (websiteId: string) => Promise<void>;
  clearSuccess: () => void;
}

const API_URL = 'http://localhost:5000/api/v1/dashboard';

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

export const createDashboardSlice: StateCreator<DashboardSlice, [], [], DashboardSlice> = (set) => ({
  overview: null,
  realtime: null,
  heatmap: null,
  insights: null,
  funnel: null,
  loading: false,
  error: null,
  success: null,
  fetchOverview: async (websiteId, timeRange) => {
    await handleRequest(set, async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/overview`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { websiteId, timeRange },
      });
      set({ overview: response.data, loading: false, success: 'Overview fetched successfully!' });
    });
  },
  fetchRealtime: async (websiteId) => {
    await handleRequest(set, async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/realtime`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { websiteId },
      });
      set({ realtime: response.data, loading: false, success: 'Realtime data fetched successfully!' });
    });
  },
  fetchHeatmap: async (websiteId, pageUrl) => {
    await handleRequest(set, async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/heatmap`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { websiteId, pageUrl },
      });
      set({ heatmap: response.data, loading: false, success: 'Heatmap fetched successfully!' });
    });
  },
  fetchInsights: async (websiteId) => {
    await handleRequest(set, async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/insights`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { websiteId },
      });
      set({ insights: response.data, loading: false, success: 'Insights fetched successfully!' });
    });
  },
  fetchConversionFunnel: async (websiteId) => {
    await handleRequest(set, async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/conversion-funnel`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { websiteId },
      });
      set({ funnel: response.data, loading: false, success: 'Conversion funnel fetched successfully!' });
    });
  },
  clearSuccess: () => {
    set({ success: null });
  },
});