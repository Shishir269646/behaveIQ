// @/store/slices/discount.slice.ts
import { StateCreator } from 'zustand';
import { api } from '@/lib/api';
import { Discount } from '@/types';

export interface DiscountSlice {
  discounts: Discount[];
  loading: boolean;
  error: string | null;
  success: string | null;
  fetchDiscounts: (websiteId: string) => Promise<void>;
  createDiscount: (discountData: Partial<Discount>) => Promise<void>;
  updateDiscount: (discountId: string, discountData: Partial<Discount>) => Promise<void>;
  deleteDiscount: (discountId: string) => Promise<void>;
  clearSuccess: () => void;
}

const handleRequest = async (set: any, request: () => Promise<any>, successMessage?: string) => {
    set({ loading: true, error: null, success: null });
    try {
      const response = await request();
      set({ loading: false, success: successMessage || null });
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      set({ error: message, loading: false });
      throw error;
    }
};

export const createDiscountSlice: StateCreator<DiscountSlice, [], [], DiscountSlice> = (set, get) => ({
    discounts: [],
    loading: false,
    error: null,
    success: null,
    fetchDiscounts: async (websiteId: string) => {
        const discounts = await handleRequest(set, () => api.get(`/websites/${websiteId}/discounts`));
        set({ discounts });
    },
    createDiscount: async (discountData: Partial<Discount>) => {
        await handleRequest(set, () => api.post(`/discounts`, discountData), 'Discount created successfully!');
        const websiteId = (discountData as any).websiteId; // Assuming websiteId is passed in discountData
        if (websiteId) {
            get().fetchDiscounts(websiteId); // Re-fetch discounts after creation
        }
    },
    updateDiscount: async (discountId: string, discountData: Partial<Discount>) => {
        await handleRequest(set, () => api.put(`/discounts/${discountId}`, discountData), 'Discount updated successfully!');
        const websiteId = (discountData as any).websiteId; // Assuming websiteId is passed in discountData
        if (websiteId) {
            get().fetchDiscounts(websiteId); // Re-fetch discounts after update
        }
    },
    deleteDiscount: async (discountId: string) => {
        const websiteId = get().discounts.find(d => d._id === discountId)?.websiteId; // Get websiteId before deleting
        await handleRequest(set, () => api.delete(`/discounts/${discountId}`), 'Discount deleted successfully!');
        if (websiteId) {
            get().fetchDiscounts(websiteId); // Re-fetch discounts after deletion
        }
    },
    clearSuccess: () => {
        set({ success: null, error: null });
    },
});
