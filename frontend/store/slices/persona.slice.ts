import { StateCreator } from 'zustand';
import axios from 'axios';
import { Persona } from '@/types';

export interface PersonaSlice {
  personas: Persona[];
  persona: Persona | null;
  loading: boolean;
  error: string | null;
  success: string | null;
  fetchPersonas: (websiteId: string) => Promise<void>;
  discoverPersonas: (websiteId: string) => Promise<void>;
  fetchPersonaById: (id: string) => Promise<void>;
  updatePersona: (id: string, personaData: any) => Promise<void>;
  createPersonalizationRule: (personaId: string, ruleData: any) => Promise<void>;
  clearSuccess: () => void;
}

const API_URL = 'http://localhost:5000/api/personas';

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

export const createPersonaSlice: StateCreator<PersonaSlice, [], [], PersonaSlice> = (set) => ({
  personas: [],
  persona: null,
  loading: false,
  error: null,
  success: null,
  fetchPersonas: async (websiteId) => {
    await handleRequest(set, async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
        params: { websiteId },
      });
      set({ personas: response.data, loading: false, success: 'Personas fetched successfully!' });
    });
  },
  discoverPersonas: async (websiteId) => {
    await handleRequest(set, async () => {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/discover`, { websiteId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ loading: false, success: 'Persona discovery initiated!' });
    });
  },
  fetchPersonaById: async (id) => {
    await handleRequest(set, async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ persona: response.data, loading: false, success: 'Persona fetched successfully!' });
    });
  },
  updatePersona: async (id, personaData) => {
    await handleRequest(set, async () => {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_URL}/${id}`, personaData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set((state: any) => ({
        personas: state.personas.map((p: any) => (p._id === id ? response.data : p)),
        persona: response.data,
        loading: false,
        success: 'Persona updated successfully!',
      }));
    });
  },
  createPersonalizationRule: async (personaId, ruleData) => {
    await handleRequest(set, async () => {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/${personaId}/personalization-rules`, ruleData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set((state: any) => ({
        personas: state.personas.map((p: any) => (p._id === personaId ? response.data : p)),
        persona: response.data,
        loading: false,
        success: 'Personalization rule created successfully!',
      }));
    });
  },
  clearSuccess: () => {
    set({ success: null });
  },
});