// @/store/slices/abandonment.slice.ts
import { StateCreator } from 'zustand'
import { api } from '@/lib/api'
import { WebsiteSlice } from './website.slice'
import { AbandonmentData } from '@/types'

export interface AbandonmentSlice {
  data: AbandonmentData | null
  loading: boolean
  error: string | null
  success: string | null
  fetchData: (timeRange: string) => Promise<void>
  clearSuccess: () => void
}

const handleRequest = async (set: any, request: () => Promise<any>) => {
  set({ loading: true, error: null })
  try {
    const response = await request()
    set({ loading: false })
    return response.data.data
  } catch (error: any) {
    const message = error.response?.data?.message || error.message
    set({ error: message, loading: false })
    throw error
  }
}

export const createAbandonmentSlice: StateCreator<
  AbandonmentSlice & WebsiteSlice,
  [],
  [],
  AbandonmentSlice
> = (set, get) => ({
  data: null,
  loading: false,
  error: null,
  success: null,
  fetchData: async (timeRange: string) => {
    const websiteId = get().website?._id // Access selectedWebsite from the combined store
    if (!websiteId) {
      set({
        error: 'No website selected to fetch abandonment data.',
        loading: false,
      })
      return
    }

    const data = await handleRequest(set, () =>
      api.get(
        `/abandonment/stats?websiteId=${websiteId}&timeRange=${timeRange}`
      )
    )
    set({ data })
  },
  clearSuccess: () => {
    set({ success: null, error: null })
  },
})
