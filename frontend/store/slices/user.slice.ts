// @/store/slices/user.slice.ts
import { StateCreator } from 'zustand';

export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
}

export interface UserSlice {
    user: User | null;
    setUser: (user: User) => void;
    logout: () => void;
}

export const createUserSlice: StateCreator<UserSlice, [], [], UserSlice> = (set) => ({
    user: {
        id: 'user_123',
        name: 'John Doe',
        email: 'john.doe@example.com',
        avatar: '/avatars/01.png', // Add a mock avatar URL
    },
    setUser: (user) => set({ user }),
    logout: () => {
        set({ user: null });
        localStorage.removeItem('behaveiq_token'); // Clear token on logout
    },
});
