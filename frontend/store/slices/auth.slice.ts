import { StateCreator } from 'zustand';
import axios from 'axios';
import { User } from '@/types';

export interface AuthSlice {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  success: string | null;
  register: (userData: any) => Promise<void>;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
  getMe: () => Promise<void>;
  clearSuccess: () => void;
}

const API_URL = 'http://localhost:5000/api/v1/auth';

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

export const createAuthSlice: StateCreator<AuthSlice, [], [], AuthSlice> = (set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isAuthenticated: false,
  loading: false,
  error: null,
  success: null,
  register: async (userData) => {
    await handleRequest(set, async () => {
      const response = await axios.post(`${API_URL}/register`, userData);
      const { token } = response.data.data;      localStorage.setItem('token', token);
      set({ token, isAuthenticated: true, loading: false, success: 'Registration successful!' });
    });
  },
  login: async (credentials) => {
    await handleRequest(set, async () => {
      const response = await axios.post(`${API_URL}/login`, credentials);
      const { token } = response.data.data;
      localStorage.setItem('token', token);
      set({ token, isAuthenticated: true, loading: false, success: 'Login successful!' });
    });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  getMe: async () => {
    await handleRequest(set, async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        set({ loading: false });
        return;
      }
      const response = await axios.get(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ user: response.data, isAuthenticated: true, loading: false });
    });
  },
  clearSuccess: () => {
    set({ success: null });
  },
});