import { StateCreator } from 'zustand';
import { api } from '@/lib/api'; // Use the api instance
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
  initializeAuth: () => Promise<void>; // New action to initialize auth state
}

const handleRequest = async (set: any, request: () => Promise<any>) => {
  set({ loading: true, error: null, success: null });
  try {
    const response = await request();
    set({ loading: false }); // Set loading to false on success
    return response;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message;
    set({ error: message, loading: false });
    throw error; // Re-throw to allow component to catch specific errors
  }
};

export const createAuthSlice: StateCreator<AuthSlice, [], [], AuthSlice> = (set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('behaveiq_token') : null, // Use behaveiq_token
  isAuthenticated: false,
  loading: false,
  error: null,
  success: null,

  initializeAuth: async () => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('behaveiq_token') : null;
    if (storedToken) {
      set({ token: storedToken, isAuthenticated: true });
      // Attempt to fetch user details to validate token
      try {
        await (get() as any).getMe();
      } catch (e) {
        console.error("Failed to initialize user on startup, logging out.");
        (get() as any).logout(); // Clear invalid token
      }
    }
  },

  register: async (userData) => {
    await handleRequest(set, async () => {
      const response = await api.post('/auth/register', userData);
      const { user, token } = response.data.data;
      localStorage.setItem('behaveiq_token', token);
      set({ user, token, isAuthenticated: true, success: 'Registration successful!' });
      return response;
    });
  },

  login: async (credentials) => {
    await handleRequest(set, async () => {
      const response = await api.post('/auth/login', credentials);
      const { user, token } = response.data.data;
      localStorage.setItem('behaveiq_token', token);
      set({ user, token, isAuthenticated: true, success: 'Login successful!' });
      return response;
    });
  },

  logout: () => {
    localStorage.removeItem('behaveiq_token');
    set({ user: null, token: null, isAuthenticated: false, success: 'Logged out successfully!' });
  },

  getMe: async () => {
    await handleRequest(set, async () => {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('behaveiq_token') : null;
      if (!storedToken) {
        set({ isAuthenticated: false });
        return;
      }
      const response = await api.get('/auth/me');
      set({ user: response.data.data.user, isAuthenticated: true });
      return response;
    });
  },

  clearSuccess: () => {
    set({ success: null });
  },
});