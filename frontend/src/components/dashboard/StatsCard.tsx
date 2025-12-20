import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    trend?: {
        value: number
        isPositive: boolean
    }
    color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red'
}

const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600'
}

export function StatsCard({ title, value, icon: Icon, trend, color = 'blue' }: StatsCardProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">{title}</p>
                <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', colorClasses[color])}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>

            <div className="flex items-end justify-between">
                <div>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>

                    {trend && (
                        <p className={cn(
                            'text-sm mt-1',
                            trend.isPositive ? 'text-green-600' : 'text-red-600'
                        )}>
                            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}