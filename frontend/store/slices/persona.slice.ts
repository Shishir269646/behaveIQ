// @/store/slices/persona.slice.ts
import { StateCreator } from 'zustand';
import { api } from '@/lib/api';
import { Persona } from '@/types';

export interface PersonaSlice {
  personas: Persona[];
  loading: boolean;
  error: string | null;
  success: string | null;
  fetchPersonas: (websiteId: string) => Promise<void>;
  createPersona: (personaData: Partial<Persona>) => Promise<void>;
  updatePersona: (personaId: string, personaData: Partial<Persona>) => Promise<void>;
  deletePersona: (personaId: string) => Promise<void>;
  discoverPersonas: (websiteId: string, sessionData: any) => Promise<void>;
  clearSuccess: () => void;
}

const handleRequest = async (set: any, request: () => Promise<any>, successMessage?: string) => {
    set({ loading: true, error: null, success: null });
    try {
      const response = await request();
      set({ loading: false, success: successMessage || null });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      set({ error: message, loading: false });
      throw error;
    }
};

export const createPersonaSlice: StateCreator<PersonaSlice, [], [], PersonaSlice> = (set, get) => ({
    personas: [],
    loading: false,
    error: null,
    success: null,
    fetchPersonas: async (websiteId: string) => {
        const responseData = await handleRequest(set, () => api.get(`/websites/${websiteId}/personas`));
        set({ personas: responseData.data.personas || [] });
    },
    createPersona: async (personaData: Partial<Persona>) => {
        await handleRequest(set, () => api.post(`/personas`, personaData), 'Persona created successfully!');
        const websiteId = (personaData as any).websiteId;
        if (websiteId) {
            get().fetchPersonas(websiteId);
        }
    },
    updatePersona: async (personaId: string, personaData: Partial<Persona>) => {
        await handleRequest(set, () => api.put(`/personas/${personaId}`, personaData), 'Persona updated successfully!');
        const websiteId = (personaData as any).websiteId;
        if (websiteId) {
            get().fetchPersonas(websiteId);
        }
    },
    deletePersona: async (personaId: string) => {
        const websiteId = get().personas.find(p => p._id === personaId)?.websiteId;
        await handleRequest(set, () => api.delete(`/personas/${personaId}`), 'Persona deleted successfully!');
        if (websiteId) {
            get().fetchPersonas(websiteId);
        }
    },
      discoverPersonas: async (websiteId: string, sessionData: any) => {
        await handleRequest(set, () => api.post(`/personas/discover`, { sessionData }), 'Persona discovery initiated!');
        get().fetchPersonas(websiteId);
      },    clearSuccess: () => {
        set({ success: null, error: null });
    },
});
