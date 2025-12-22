import create from 'zustand';
import { devtools } from 'zustand/middleware';
import { AuthSlice, createAuthSlice } from './slices/auth.slice';
import { WebsiteSlice, createWebsiteSlice } from './slices/website.slice';
import { PersonaSlice, createPersonaSlice } from './slices/persona.slice';
import { ExperimentSlice, createExperimentSlice } from './slices/experiment.slice';
import { DashboardSlice, createDashboardSlice } from './slices/dashboard.slice';
import { EventSlice, createEventSlice } from './slices/event.slice';

type StoreState = AuthSlice & WebsiteSlice & PersonaSlice & ExperimentSlice & DashboardSlice & EventSlice;

export const useStore = create<StoreState>()(
  devtools(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createWebsiteSlice(...a),
      ...createPersonaSlice(...a),
      ...createExperimentSlice(...a),
      ...createDashboardSlice(...a),
      ...createEventSlice(...a),
    }),
  ),
);