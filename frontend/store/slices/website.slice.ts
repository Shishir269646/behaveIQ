// @/store/slices/website.slice.ts
import { StateCreator } from 'zustand';
import { api } from '@/lib/api'; // Import the API instance

export interface Website {
    _id: string;
    userId: string;
    name: string;
    domain: string;
    apiKey: string;
    industry: string;
    status: 'learning' | 'active' | 'paused';
    settings: {
        learningPeriodHours: number;
        autoPersonalization: boolean;
        experimentMode: boolean;
        notificationEmail?: string;
        emotionInterventions?: {
            emotion: 'frustrated' | 'confused' | 'excited' | 'neutral' | 'considering';
            action: 'show_help_chat' | 'show_guide' | 'show_social_proof' | 'show_comparison' | 'none';
            message?: string;
            data?: any;
        }[];
        fraudDetectionSettings?: {
            sensitivity: 'low' | 'medium' | 'high';
            riskBasedActions: {
                requirePhoneVerification: boolean;
                requireEmailVerification: boolean;
                disableCOD: boolean;
                showCaptcha: boolean;
                manualReview: boolean;
                limitOrderValue?: number;
            };
        };
    };
    learningStartedAt: Date;
    activatedAt?: Date;
    stats: {
        totalSessions: number;
        totalEvents: number;
        totalPersonas: number;
    };
    createdAt: Date;
    updatedAt: Date;
    sdkScript: string;
}

export interface WebsiteSlice {
    websites: Website[];
    website: Website | null; // Renamed selectedWebsite to website for consistency
    loading: boolean;
    error: string | null;
    success: string | null;
    fetchWebsites: () => Promise<void>;
    fetchWebsiteById: (websiteId: string) => Promise<void>;
    createWebsite: (websiteData: { name: string; domain: string }) => Promise<void>;
    updateWebsite: (websiteId: string, websiteData: Partial<Website>) => Promise<void>;
    deleteWebsite: (websiteId: string) => Promise<void>;
    selectWebsite: (websiteId: string) => void;
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
        throw error; // Re-throw to allow component to catch
    }
};

export const createWebsiteSlice: StateCreator<WebsiteSlice, [], [], WebsiteSlice> = (set, get) => ({
    websites: [],
    website: null,
    loading: false,
    error: null,
    success: null,

    fetchWebsites: async () => {
        await handleRequest(set, async () => {
            const response = await api.get('/websites');
            const { websites } = response.data.data;
            set({ websites, loading: false });
            // If no website is currently selected, select the first one if available
            if (!get().website && websites.length > 0) {
                set({ website: websites[0] });
            }
            return response;
        });
    },

    fetchWebsiteById: async (websiteId: string) => {
        await handleRequest(set, async () => {
            const response = await api.get(`/websites/${websiteId}`);
            const { website } = response.data.data;
            set({ website, loading: false });
            return response;
        });
    },

    createWebsite: async (websiteData) => {
        await handleRequest(set, async () => {
            const response = await api.post('/websites', websiteData);
            const { website } = response.data.data;
            set((state) => ({
                websites: [...state.websites, website],
                website: website, // Select the newly created website
                success: 'Website created successfully!',
                loading: false,
            }));
            return response;
        });
    },

    updateWebsite: async (websiteId, websiteData) => {
        await handleRequest(set, async () => {
            const response = await api.patch(`/websites/${websiteId}`, websiteData);
            const { website } = response.data.data;
            set((state) => ({
                websites: state.websites.map((w) =>
                    w._id === websiteId ? website : w
                ),
                website: state.website?._id === websiteId ? website : state.website,
                success: 'Website updated successfully!',
                loading: false,
            }));
            return response;
        });
    },

    deleteWebsite: async (websiteId) => {
        await handleRequest(set, async () => {
            await api.delete(`/websites/${websiteId}`);
            set((state) => ({
                websites: state.websites.filter((w) => w._id !== websiteId),
                website: state.website?._id === websiteId ? null : state.website,
                success: 'Website deleted successfully!',
                loading: false,
            }));
            return true;
        });
    },

    selectWebsite: (websiteId: string) => {
        set((state) => {
            const selected = state.websites.find((w) => w._id === websiteId);
            return { website: selected || null };
        });
    },

    clearSuccess: () => {
        set({ success: null });
    },
});