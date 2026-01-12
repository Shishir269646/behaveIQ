// @/lib/api.ts
import axios from 'axios';

// Base URL for the backend API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const ML_API_BASE_URL = process.env.NEXT_PUBLIC_ML_API_BASE_URL;

// Create an Axios instance for the main backend API
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create an Axios instance for the ML backend API
export const mlApi = axios.create({
  baseURL: ML_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach auth token to requests
// You would typically get the token from local storage or a global state (e.g., Zustand)
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') { // Only access localStorage on the client-side
      const token = localStorage.getItem('behaveiq_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

mlApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('behaveiq_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// You can add response interceptors for error handling, token refresh, etc.
// For now, we'll keep it simple.

// --- Mock API Call Utility ---
// This utility will replace the current setTimeout mocks in hooks
// It simulates network delay and can simulate success/failure
export const mockApiCall = <T>(data: T, delay: number = 1000, shouldError: boolean = false): Promise<T> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldError && Math.random() > 0.7) { // 30% chance to error if shouldError is true
        reject(new Error("Simulated API Error"));
      } else {
        resolve(data);
      }
    }, delay);
  });
};
