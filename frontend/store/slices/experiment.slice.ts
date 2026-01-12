// @/store/slices/experiment.slice.ts
import { StateCreator } from 'zustand';
import { api } from '@/lib/api';
import { Experiment } from '@/types';

export interface ExperimentSlice {
  experiments: Experiment[];
  loading: boolean;
  error: string | null;
  success: string | null;
  fetchExperiments: (websiteId: string) => Promise<void>;
  createExperiment: (experimentData: Partial<Experiment>) => Promise<void>;
  updateExperiment: (experimentId: string, experimentData: Partial<Experiment>) => Promise<void>;
  deleteExperiment: (experimentId: string) => Promise<void>;
  clearSuccess: () => void;
}

const handleRequest = async (set: any, request: () => Promise<any>, successMessage?: string) => {
    set({ loading: true, error: null, success: null });
    try {
      const response = await request();
      set({ loading: false, success: successMessage || null });
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      set({ error: message, loading: false });
      throw error;
    }
};

export const createExperimentSlice: StateCreator<ExperimentSlice, [], [], ExperimentSlice> = (set, get) => ({
    experiments: [],
    loading: false,
    error: null,
    success: null,
    fetchExperiments: async (websiteId: string) => {
        const responseData = await handleRequest(set, () => api.get(`/websites/${websiteId}/experiments`));
        set({ experiments: responseData.experiments });
    },
    createExperiment: async (experimentData: Partial<Experiment>) => {
        await handleRequest(set, () => api.post(`/experiments`, experimentData), 'Experiment created successfully!');
        const websiteId = (experimentData as any).websiteId;
        if (websiteId) {
            get().fetchExperiments(websiteId);
        }
    },
    updateExperiment: async (experimentId: string, experimentData: Partial<Experiment>) => {
        await handleRequest(set, () => api.put(`/experiments/${experimentId}`, experimentData), 'Experiment updated successfully!');
        const websiteId = (experimentData as any).websiteId;
        if (websiteId) {
            get().fetchExperiments(websiteId);
        }
    },
    deleteExperiment: async (experimentId: string) => {
        const websiteId = get().experiments.find(exp => exp._id === experimentId)?.websiteId;
        await handleRequest(set, () => api.delete(`/experiments/${experimentId}`), 'Experiment deleted successfully!');
        if (websiteId) {
            get().fetchExperiments(websiteId);
        }
    },
    clearSuccess: () => {
        set({ success: null, error: null });
    },
});
