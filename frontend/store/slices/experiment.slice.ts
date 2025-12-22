
import { StateCreator } from 'zustand';
import axios from 'axios';
import { Experiment } from '@/types';

export interface ExperimentSlice {
  experiments: Experiment[];
  experiment: Experiment | null;
  loading: boolean;
  error: string | null;
  fetchExperiments: (websiteId: string) => Promise<void>;
  createExperiment: (experimentData: any) => Promise<void>;
  fetchExperimentById: (id: string) => Promise<void>;
  updateExperimentStatus: (id: string, status: string) => Promise<void>;
  declareWinner: (id: string, winnerName: string) => Promise<void>;
}

const API_URL = 'http://localhost:5000/api/experiments';

export const createExperimentSlice: StateCreator<ExperimentSlice, [], [], ExperimentSlice> = (set) => ({
  experiments: [],
  experiment: null,
  loading: false,
  error: null,
  fetchExperiments: async (websiteId) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
        params: { websiteId },
      });
      set({ experiments: response.data, loading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      set({ error: message, loading: false });
    }
  },
  createExperiment: async (experimentData) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(API_URL, experimentData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set((state) => ({ experiments: [...state.experiments, response.data], loading: false }));
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      set({ error: message, loading: false });
    }
  },
  fetchExperimentById: async (id) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ experiment: response.data, loading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      set({ error: message, loading: false });
    }
  },
  updateExperimentStatus: async (id, status) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_URL}/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set((state) => ({
        experiments: state.experiments.map((e) => (e._id === id ? response.data : e)),
        experiment: response.data,
        loading: false,
      }));
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      set({ error: message, loading: false });
    }
  },
  declareWinner: async (id, winnerName) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/${id}/declare-winner`, { winnerName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set((state) => ({
        experiments: state.experiments.map((e) => (e._id === id ? response.data : e)),
        experiment: response.data,
        loading: false,
      }));
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      set({ error: message, loading: false });
    }
  },
});
