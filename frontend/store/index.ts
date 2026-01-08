// @/store/index.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AuthSlice, createAuthSlice } from './slices/auth.slice';

import { WebsiteSlice, createWebsiteSlice } from './slices/website.slice';
import { UserSlice, createUserSlice } from './slices/user.slice';

// Combine all slices into one store
type StoreState = AuthSlice & WebsiteSlice & UserSlice; // Add other slices here with an &

export const useAppStore = create<StoreState>()(
  devtools(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createWebsiteSlice(...a),
      ...createUserSlice(...a),
      // ...add other slice creators here
    }),
    { name: 'BehaveIQ-Store' }
  ),
);
