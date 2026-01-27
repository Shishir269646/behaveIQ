// @/store/slices/experiment.slice.ts
import { StateCreator } from 'zustand';
import { api } from '@/lib/api';
import { Experiment } from '@/types';

export interface ExperimentSlice {
  experiments: Experiment[];
  selectedExperiment: Experiment | null;
  loading: boolean;
  error: string | null;
  success: string | null;
  fetchExperiments: (websiteId: string) => Promise<void>;
  fetchExperiment: (experimentId: string) => Promise<void>;
  createExperiment: (experimentData: Partial<Experiment>) => Promise<void>;
  updateExperiment: (experimentId: string, experimentData: Partial<Experiment>) => Promise<void>;
  deleteExperiment: (experimentId: string) => Promise<void>;
  updateExperimentStatus: (experimentId: string, status: string) => Promise<void>; // Add this line
  declareWinner: (experimentId: string, winningVariation: string) => Promise<void>; // Add this line
  clearSuccess: () => void;
  clearSelectedExperiment: () => void;
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
    selectedExperiment: null,
    loading: false,
    error: null,
    success: null,
    fetchExperiments: async (websiteId: string) => {
        const responseData = await handleRequest(set, () => api.get(`/websites/${websiteId}/experiments`));
        set({ experiments: responseData.experiments });
    },
    fetchExperiment: async (experimentId: string) => {
        const responseData = await handleRequest(set, () => api.get(`/experiments/${experimentId}`));
        set({ selectedExperiment: responseData.experiment });
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
        const websiteId = get().selectedExperiment?.websiteId || (experimentData as any).websiteId;
        if (websiteId) {
            get().fetchExperiments(websiteId);
            get().fetchExperiment(experimentId);
        }
    },
    deleteExperiment: async (experimentId: string) => {
        const websiteId = get().experiments.find(exp => exp._id === experimentId)?.websiteId;
        await handleRequest(set, () => api.delete(`/experiments/${experimentId}`), 'Experiment deleted successfully!');
        if (websiteId) {
            get().fetchExperiments(websiteId);
        }
    },
    updateExperimentStatus: async (experimentId: string, status: string) => { // Implement updateExperimentStatus
        await handleRequest(set, () => api.patch(`/experiments/${experimentId}/status`, { status }), 'Experiment status updated successfully!');
        get().fetchExperiment(experimentId); // Refresh the single experiment
        const websiteId = get().selectedExperiment?.websiteId; // Also refresh main list if necessary
        if (websiteId) {
            get().fetchExperiments(websiteId);
        }
    },
    declareWinner: async (experimentId: string, winningVariation: string) => { // Implement declareWinner
        await handleRequest(set, () => api.post(`/experiments/${experimentId}/declare-winner`, { winningVariation }), 'Winner declared successfully!');
        get().fetchExperiment(experimentId); // Refresh the single experiment
        const websiteId = get().selectedExperiment?.websiteId; // Also refresh main list if necessary
        if (websiteId) {
            get().fetchExperiments(websiteId);
        }
    },
    clearSuccess: () => {
        set({ success: null, error: null });
    },
    clearSelectedExperiment: () => {
        set({ selectedExperiment: null });
    },
});
