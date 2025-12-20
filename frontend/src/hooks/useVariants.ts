import { create } from 'zustand'
import { variantsAPI } from '@/lib/api'
import { Variant, CreateVariantInput, UpdateVariantInput } from '@/types/variant'
import { toast } from 'react-hot-toast'

interface VariantsState {
    variants: Variant[]
    currentVariant: Variant | null
    isLoading: boolean

    // Actions
    fetchVariants: (siteId: string) => Promise<void>
    fetchVariant: (id: string) => Promise<void>
    createVariant: (siteId: string, data: CreateVariantInput) => Promise<Variant | null>
    updateVariant: (id: string, data: UpdateVariantInput) => Promise<boolean>
    deleteVariant: (id: string) => Promise<boolean>
    updateVariantStatus: (id: string, status: string) => Promise<boolean>
    setCurrentVariant: (variant: Variant | null) => void
}

export const useVariants = create<VariantsState>((set, get) => ({
    variants: [],
    currentVariant: null,
    isLoading: false,

    fetchVariants: async (siteId: string) => {
        set({ isLoading: true })

        try {
            const response = await variantsAPI.getAll(siteId)
            set({ variants: response.data.data, isLoading: false })
        } catch (error) {
            set({ isLoading: false })
        }
    },

    fetchVariant: async (id: string) => {
        set({ isLoading: true })

        try {
            const response = await variantsAPI.getOne(id)
            set({ currentVariant: response.data.data, isLoading: false })
        } catch (error) {
            set({ isLoading: false })
        }
    },

    createVariant: async (siteId: string, data: CreateVariantInput) => {
        set({ isLoading: true })

        try {
            const response = await variantsAPI.create(siteId, data)
            const newVariant = response.data.data

            set((state) => ({
                variants: [...state.variants, newVariant],
                isLoading: false
            }))

            toast.success('Variant তৈরি হয়েছে!')
            return newVariant
        } catch (error) {
            set({ isLoading: false })
            return null
        }
    },

    updateVariant: async (id: string, data: UpdateVariantInput) => {
        try {
            const response = await variantsAPI.update(id, data)
            const updatedVariant = response.data.data

            set((state) => ({
                variants: state.variants.map(v => v._id === id ? updatedVariant : v),
                currentVariant: state.currentVariant?._id === id ? updatedVariant : state.currentVariant
            }))

            toast.success('Variant আপডেট হয়েছে!')
            return true
        } catch (error) {
            return false
        }
    },

    deleteVariant: async (id: string) => {
        try {
            await variantsAPI.delete(id)

            set((state) => ({
                variants: state.variants.filter(v => v._id !== id)
            }))

            toast.success('Variant ডিলিট হয়েছে!')
            return true
        } catch (error) {
            return false
        }
    },

    updateVariantStatus: async (id: string, status: string) => {
        try {
            const response = await variantsAPI.updateStatus(id, status)
            const updatedVariant = response.data.data

            set((state) => ({
                variants: state.variants.map(v => v._id === id ? updatedVariant : v)
            }))

            toast.success(`Variant ${status} হয়েছে!`)
            return true
        } catch (error) {
            return false
        }
    },

    setCurrentVariant: (variant: Variant | null) => {
        set({ currentVariant: variant })
    }
}))