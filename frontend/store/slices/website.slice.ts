// @/store/slices/website.slice.ts
import { StateCreator } from 'zustand';

export interface Website {
    id: string;
    name: string;
    url: string;
}

export interface WebsiteSlice {
    websites: Website[];
    selectedWebsite: Website | null;
    setWebsites: (websites: Website[]) => void;
    selectWebsite: (websiteId: string) => void;
}

// Mock data for websites
const mockWebsites: Website[] = [
    { id: '1', name: 'BehaveIQ Platform', url: 'behaveiq.com' },
    { id: '2', name: 'E-commerce Store', url: 'ecom.example.com' },
    { id: '3', name: 'SaaS App', url: 'saas.example.com' },
];

export const createWebsiteSlice: StateCreator<WebsiteSlice, [], [], WebsiteSlice> = (set) => ({
    websites: mockWebsites,
    selectedWebsite: mockWebsites[0] || null,
    setWebsites: (websites) => set({ 
        websites, 
        selectedWebsite: websites[0] || null 
    }),
    selectWebsite: (websiteId) => set((state) => ({
        selectedWebsite: state.websites.find(w => w.id === websiteId) || null
    })),
});