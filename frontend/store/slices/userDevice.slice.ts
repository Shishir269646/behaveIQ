// @/store/slices/userDevice.slice.ts
import { StateCreator } from 'zustand';
import { api } from '@/lib/api';
import { DeviceInfo } from '@/types';

export interface UserDeviceSlice {
  devices: DeviceInfo[];
  loading: boolean;
  error: string | null;
  success: string | null;
  fetchUserDevices: (userId: string) => Promise<void>;
  clearSuccess: () => void;
}

const handleRequest = async (set: any, request: () => Promise<any>) => {
    set({ loading: true, error: null });
    try {
      const response = await request();
      set({ loading: false });
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      set({ error: message, loading: false });
      throw error;
    }
};

export const createUserDeviceSlice: StateCreator<UserDeviceSlice, [], [], UserDeviceSlice> = (set) => ({
    devices: [],
    loading: false,
    error: null,
    success: null,
    fetchUserDevices: async (userId: string) => {
        const devices = await handleRequest(set, () => api.get(`/users/${userId}/devices`));
        set({ devices });
    },
    clearSuccess: () => {
        set({ success: null, error: null });
    },
});
