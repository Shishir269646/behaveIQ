// @/store/index.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AuthSlice, createAuthSlice } from './slices/auth.slice';
import { DashboardSlice, createDashboardSlice } from './slices/dashboard.slice';
import { WebsiteSlice, createWebsiteSlice } from './slices/website.slice';
import { UserSlice, createUserSlice } from './slices/user.slice';
import { AbandonmentSlice, createAbandonmentSlice } from './slices/abandonment.slice';
import { EventSlice, createEventSlice } from './slices/event.slice';
import { FraudSlice, createFraudSlice } from './slices/fraud.slice';
import { UserDeviceSlice, createUserDeviceSlice } from './slices/userDevice.slice';
import { DiscountSlice, createDiscountSlice } from './slices/discount.slice';
import { ExperimentSlice, createExperimentSlice } from './slices/experiment.slice';
import { PersonaSlice, createPersonaSlice } from './slices/persona.slice';

// Combine all slices into one store
type StoreState = AuthSlice & DashboardSlice & WebsiteSlice & UserSlice & AbandonmentSlice & EventSlice & FraudSlice & UserDeviceSlice & DiscountSlice & ExperimentSlice & PersonaSlice; // Add other slices here with an &

export const useAppStore = create<StoreState>()(
  devtools(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createDashboardSlice(...a),
      ...createWebsiteSlice(...a),
      ...createUserSlice(...a),
      ...createAbandonmentSlice(...a),
      ...createEventSlice(...a),
      ...createFraudSlice(...a),
      ...createUserDeviceSlice(...a),
      ...createDiscountSlice(...a),
      ...createExperimentSlice(...a),
      ...createPersonaSlice(...a),
      // ...add other slice creators here
    }),
    { name: 'BehaveIQ-Store' }
  ),
);
