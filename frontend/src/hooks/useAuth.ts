import { create } from 'zustand'
import { authAPI } from '@/lib/api'
import { toast } from 'react-hot-toast'

interface User {
    id: string
    name: string
    email: string
    role: string
    plan: string
}

interface AuthState {
    user: User | null
    token: string | null
    isLoading: boolean
    isAuthenticated: boolean

    // Actions
    login: (email: string, password: string) => Promise<boolean>
    register: (name: string, email: string, password: string) => Promise<boolean>
    logout: () => void
    checkAuth: () => Promise<void>
}

export const useAuth = create<AuthState>((set, get) => ({
    user: null,
    token: null,
    isLoading: false,
    isAuthenticated: false,

    login: async (email: string, password: string) => {
        set({ isLoading: true })

        try {
            const response = await authAPI.login({ email, password })
            const { token, user } = response.data.data

            // Save to localStorage
            localStorage.setItem('token', token)

            set({
                user,
                token,
                isAuthenticated: true,
                isLoading: false
            })

            toast.success('সফলভাবে লগইন হয়েছে!')
            return true

        } catch (error) {
            set({ isLoading: false })
            return false
        }
    },

    register: async (name: string, email: string, password: string) => {
        set({ isLoading: true })

        try {
            const response = await authAPI.register({ name, email, password })
            const { token, user } = response.data.data

            localStorage.setItem('token', token)

            set({
                user,
                token,
                isAuthenticated: true,
                isLoading: false
            })

            toast.success('সফলভাবে রেজিস্টার হয়েছে!')
            return true

        } catch (error) {
            set({ isLoading: false })
            return false
        }
    },

    logout: () => {
        localStorage.removeItem('token')
        set({
            user: null,
            token: null,
            isAuthenticated: false
        })
        toast.success('লগআউট হয়েছে')
    },

    checkAuth: async () => {
        const token = localStorage.getItem('token')

        if (!token) {
            set({ isAuthenticated: false, isLoading: false })
            return
        }

        set({ isLoading: true })

        try {
            const response = await authAPI.getMe()
            const user = response.data.data

            set({
                user,
                token,
                isAuthenticated: true,
                isLoading: false
            })
        } catch (error) {
            localStorage.removeItem('token')
            set({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false
            })
        }
    }
}))