import { StateCreator } from 'zustand';
import { api } from '@/lib/api';
import { User } from '@/types'; // Assuming User type is defined in '@/types'

export interface UserSlice {
    users: User[];
    loading: boolean;
    error: string | null;
    success: string | null;
    fetchUsers: () => Promise<void>;
    updateUser: (userId: string, userData: Partial<User>) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    clearSuccess: () => void;
}

const handleRequest = async (set: any, request: () => Promise<any>) => {
    set({ loading: true, error: null, success: null });
    try {
        const response = await request();
        return response;
    } catch (error: any) {
        const message = error.response?.data?.message || error.message;
        set({ error: message, loading: false });
        throw error;
    }
};

export const createUserSlice: StateCreator<UserSlice, [], [], UserSlice> = (set, get) => ({
    users: [],
    loading: false,
    error: null,
    success: null,

    fetchUsers: async () => {
        await handleRequest(set, async () => {
            const response = await api.get('/users');
            set({ users: response.data.data.users, loading: false });
            return response;
        });
    },

    updateUser: async (userId, userData) => {
        await handleRequest(set, async () => {
            const response = await api.put(`/users/${userId}`, userData);
            const { user } = response.data.data;
            set((state) => ({
                users: state.users.map((u) =>
                    u._id === userId ? user : u
                ),
                success: 'User updated successfully!',
                loading: false,
            }));
            return response;
        });
    },

    deleteUser: async (userId) => {
        await handleRequest(set, async () => {
            await api.delete(`/users/${userId}`);
            set((state) => ({
                users: state.users.filter((u) => u._id !== userId),
                success: 'User deleted successfully!',
                loading: false,
            }));
            return true;
        });
    },

    clearSuccess: () => {
        set({ success: null });
    },
});
