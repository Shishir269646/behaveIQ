import { StateCreator } from 'zustand';
import axios from 'axios';
import { Experiment } from '@/types';

export interface ExperimentSlice {
  experiments: Experiment[];
  experiment: Experiment | null;
  loading: boolean;
  error: string | null;
  success: string | null;
  fetchExperiments: (websiteId: string) => Promise<void>;
  createExperiment: (experimentData: any) => Promise<void>;
  fetchExperimentById: (id: string) => Promise<void>;
  updateExperimentStatus: (id: string, status: string) => Promise<void>;
  declareWinner: (id: string, winnerName: string) => Promise<void>;
  clearSuccess: () => void;
}

const API_URL = 'http://localhost:5000/api/v1/experiments';

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

export const createExperimentSlice: StateCreator<ExperimentSlice, [], [], ExperimentSlice> = (set) => ({
  experiments: [],
  experiment: null,
  loading: false,
  error: null,
  success: null,
  fetchExperiments: async (websiteId) => {
    await handleRequest(set, async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
        params: { websiteId },
      });
      set({ experiments: response.data, loading: false, success: 'Experiments fetched successfully!' });
    });
  },
  createExperiment: async (experimentData) => {
    await handleRequest(set, async () => {
      const token = localStorage.getItem('token');
      const response = await axios.post(API_URL, experimentData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set((state: any) => ({ experiments: [...state.experiments, response.data], loading: false, success: 'Experiment created successfully!' }));
    });
  },
  fetchExperimentById: async (id) => {
    await handleRequest(set, async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ experiment: response.data, loading: false, success: 'Experiment fetched successfully!' });
    });
  },
  updateExperimentStatus: async (id, status) => {
    await handleRequest(set, async () => {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_URL}/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set((state: any) => ({
        experiments: state.experiments.map((e: any) => (e._id === id ? response.data : e)),
        experiment: response.data,
        loading: false,
        success: 'Experiment status updated successfully!',
      }));
    });
  },
  declareWinner: async (id, winnerName) => {
    await handleRequest(set, async () => {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/${id}/declare-winner`, { winnerName }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set((state: any) => ({
        experiments: state.experiments.map((e: any) => (e._id === id ? response.data : e)),
        experiment: response.data,
        loading: false,
        success: 'Winner declared successfully!',
      }));
    });
  },
  clearSuccess: () => {
    set({ success: null });
  },
});