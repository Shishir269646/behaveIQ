
import { StateCreator } from 'zustand';
import axios from 'axios';
import { Persona } from '@/types';

export interface PersonaSlice {
  personas: Persona[];
  persona: Persona | null;
  loading: boolean;
  error: string | null;
  fetchPersonas: (websiteId: string) => Promise<void>;
  discoverPersonas: (websiteId: string) => Promise<void>;
  fetchPersonaById: (id: string) => Promise<void>;
  updatePersona: (id: string, personaData: any) => Promise<void>;
  createPersonalizationRule: (personaId: string, ruleData: any) => Promise<void>;
}

const API_URL = 'http://localhost:5000/api/personas';

export const createPersonaSlice: StateCreator<PersonaSlice, [], [], PersonaSlice> = (set) => ({
  personas: [],
  persona: null,
  loading: false,
  error: null,
  fetchPersonas: async (websiteId) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
        params: { websiteId },
      });
      set({ personas: response.data, loading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      set({ error: message, loading: false });
    }
  },
  discoverPersonas: async (websiteId) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/discover`, { websiteId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // After discovery, we should probably refetch the personas
      // For now, just setting loading to false
      set({ loading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      set({ error: message, loading: false });
    }
  },
  fetchPersonaById: async (id) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ persona: response.data, loading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      set({ error: message, loading: false });
    }
  },
  updatePersona: async (id, personaData) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_URL}/${id}`, personaData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set((state) => ({
        personas: state.personas.map((p) => (p._id === id ? response.data : p)),
        persona: response.data,
        loading: false,
      }));
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      set({ error: message, loading: false });
    }
  },
  createPersonalizationRule: async (personaId, ruleData) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/${personaId}/personalization-rules`, ruleData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set((state) => ({
        personas: state.personas.map((p) => (p._id === personaId ? response.data : p)),
        persona: response.data,
        loading: false,
      }));
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      set({ error: message, loading: false });
    }
  }
});
