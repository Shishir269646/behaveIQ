import { create } from 'zustand'
import { sitesAPI } from '@/lib/api'
import { Site, CreateSiteInput } from '@/types/site'
import { toast } from 'react-hot-toast'

interface SitesState {
    sites: Site[]
    currentSite: Site | null
    isLoading: boolean

    // Actions
    fetchSites: () => Promise<void>
    fetchSite: (id: string) => Promise<void>
    createSite: (data: CreateSiteInput) => Promise<Site | null>
    updateSite: (id: string, data: any) => Promise<boolean>
    deleteSite: (id: string) => Promise<boolean>
    setCurrentSite: (site: Site | null) => void
}

export const useSites = create<SitesState>((set, get) => ({
    sites: [],
    currentSite: null,
    isLoading: false,

    fetchSites: async () => {
        set({ isLoading: true })

        try {
            const response = await sitesAPI.getAll()
            set({ sites: response.data.data, isLoading: false })
        } catch (error) {
            set({ isLoading: false })
        }
    },

    fetchSite: async (id: string) => {
        set({ isLoading: true })

        try {
            const response = await sitesAPI.getOne(id)
            set({ currentSite: response.data.data, isLoading: false })
        } catch (error) {
            set({ isLoading: false })
        }
    },

    createSite: async (data: CreateSiteInput) => {
        set({ isLoading: true })

        try {
            const response = await sitesAPI.create(data)
            const newSite = response.data.data

            set((state) => ({
                sites: [...state.sites, newSite],
                isLoading: false
            }))

            toast.success('সাইট তৈরি হয়েছে!')
            return newSite
        } catch (error) {
            set({ isLoading: false })
            return null
        }
    },

    updateSite: async (id: string, data: any) => {
        try {
            const response = await sitesAPI.update(id, data)
            const updatedSite = response.data.data

            set((state) => ({
                sites: state.sites.map(s => s._id === id ? updatedSite : s),
                currentSite: state.currentSite?._id === id ? updatedSite : state.currentSite
            }))

            toast.success('সাইট আপডেট হয়েছে!')
            return true
        } catch (error) {
            return false
        }
    },

    deleteSite: async (id: string) => {
        try {
            await sitesAPI.delete(id)

            set((state) => ({
                sites: state.sites.filter(s => s._id !== id)
            }))

            toast.success('সাইট ডিলিট হয়েছে!')
            return true
        } catch (error) {
            return false
        }
    },

    setCurrentSite: (site: Site | null) => {
        set({ currentSite: site })
    }
}))