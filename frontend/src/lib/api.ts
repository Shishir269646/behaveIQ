import axios, { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 30000
})

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Add auth token if available
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token')
            if (token) {
                config.headers.Authorization = `Bearer ${token}`
            }
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor
api.interceptors.response.use(
    (response: AxiosResponse) => {
        return response
    },
    (error: AxiosError<any>) => {
        // Handle errors
        if (error.response) {
            const message = error.response.data?.error || 'কিছু ভুল হয়েছে'

            // Show toast notification
            toast.error(message)

            // Redirect to login if unauthorized
            if (error.response.status === 401 && typeof window !== 'undefined') {
                localStorage.removeItem('token')
                window.location.href = '/login'
            }
        } else if (error.request) {
            toast.error('Server এর সাথে connection হচ্ছে না')
        } else {
            toast.error('কিছু ভুল হয়েছে')
        }

        return Promise.reject(error)
    }
)

// Auth APIs
export const authAPI = {
    register: (data: { name: string; email: string; password: string }) =>
        api.post('/auth/register', data),

    login: (data: { email: string; password: string }) =>
        api.post('/auth/login', data),

    getMe: () =>
        api.get('/auth/me'),

    logout: () =>
        api.post('/auth/logout')
}

// Sites APIs
export const sitesAPI = {
    getAll: () =>
        api.get('/sites'),

    getOne: (id: string) =>
        api.get(`/sites/${id}`),

    create: (data: any) =>
        api.post('/sites', data),

    update: (id: string, data: any) =>
        api.put(`/sites/${id}`, data),

    delete: (id: string) =>
        api.delete(`/sites/${id}`),

    getKeys: (id: string) =>
        api.get(`/sites/${id}/keys`),

    regenerateKey: (id: string) =>
        api.post(`/sites/${id}/keys/regenerate`)
}

// Variants APIs
export const variantsAPI = {
    getAll: (siteId: string) =>
        api.get(`/variants/sites/${siteId}/variants`),

    getOne: (id: string) =>
        api.get(`/variants/${id}`),

    create: (siteId: string, data: any) =>
        api.post(`/variants/sites/${siteId}/variants`, data),

    update: (id: string, data: any) =>
        api.put(`/variants/${id}`, data),

    delete: (id: string) =>
        api.delete(`/variants/${id}`),

    updateStatus: (id: string, status: string) =>
        api.patch(`/variants/${id}/status`, { status })
}

// Analytics APIs
export const analyticsAPI = {
    getSiteAnalytics: (siteId: string, params?: { startDate?: string; endDate?: string }) =>
        api.get(`/analytics/sites/${siteId}`, { params }),

    getVariantPerformance: (siteId: string) =>
        api.get(`/analytics/sites/${siteId}/variants`),

    getFunnel: (siteId: string, steps: string[]) =>
        api.get(`/analytics/sites/${siteId}/funnel`, {
            params: { steps: steps.join(',') }
        })
}

export default api;