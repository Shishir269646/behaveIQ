// @/store/index.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { UserSlice, createUserSlice } from './slices/user.slice';
import { WebsiteSlice, createWebsiteSlice } from './slices/website.slice';

// Combine all slices into one store
type StoreState = UserSlice & WebsiteSlice; // Add other slices here with an &

export const useAppStore = create<StoreState>()(
  devtools(
    (...a) => ({
      ...createUserSlice(...a),
      ...createWebsiteSlice(...a),
      // ...add other slice creators here
    }),
    { name: 'BehaveIQ-Store' }
  ),
);
