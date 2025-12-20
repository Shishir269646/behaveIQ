'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Globe, BarChart3, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Sites', href: '/sites', icon: Globe },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()
    const { logout, user } = useAuth()

    return (
        <div className="flex flex-col w-64 bg-gray-900 min-h-screen">
            {/* Logo */}
            <div className="flex items-center h-16 px-6 border-b border-gray-800">
                <h1 className="text-xl font-bold text-white">PersonaFlow</h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center px-4 py-3 rounded-lg transition-colors',
                                isActive
                                    ? 'bg-primary-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                            )}
                        >
                            <Icon className="w-5 h-5 mr-3" />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            {/* User info */}
            <div className="px-4 py-4 border-t border-gray-800">
                <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                        {user?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-white">{user?.name}</p>
                        <p className="text-xs text-gray-400">{user?.email}</p>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <LogOut className="w-4 h-4 mr-3" />
                    Logout
                </button>
            </div>
        </div>
    )
}