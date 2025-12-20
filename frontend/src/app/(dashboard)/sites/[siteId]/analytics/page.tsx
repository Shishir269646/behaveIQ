'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { useSites } from '@/hooks/useSites'
import { analyticsAPI } from '@/lib/api'
import { formatNumber, formatPercentage } from '@/lib/utils'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function AnalyticsPage() {
    const params = useParams()
    const siteId = params.siteId as string
    const { currentSite, fetchSite } = useSites()
    const [analytics, setAnalytics] = useState<any>(null)
    const [variantPerformance, setVariantPerformance] = useState<any[]>([])
    const [timeRange, setTimeRange] = useState('30')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (siteId) {
            fetchSite(siteId)
            loadAnalytics()
            loadVariantPerformance()
        }
    }, [siteId, timeRange])

    const loadAnalytics = async () => {
        setIsLoading(true)
        try {
            const days = parseInt(timeRange)
            const endDate = new Date()
            const startDate = new Date()
            startDate.setDate(startDate.getDate() - days)

            const response = await analyticsAPI.getSiteAnalytics(siteId, {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            })

            setAnalytics(response.data.data)
        } catch (error) {
            console.error('Failed to load analytics')
        } finally {
            setIsLoading(false)
        }
    }

    const loadVariantPerformance = async () => {
        try {
            const response = await analyticsAPI.getVariantPerformance(siteId)
            setVariantPerformance(response.data.data)
        } catch (error) {
            console.error('Failed to load variant performance')
        }
    }

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

    if (isLoading || !analytics) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                    <p className="text-gray-600 mt-2">
                        {currentSite?.name} এর বিস্তারিত analytics
                    </p>
                </div>
                <Select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    options={[
                        { value: '7', label: 'Last 7 days' },
                        { value: '30', label: 'Last 30 days' },
                        { value: '90', label: 'Last 90 days' }
                    ]}
                />
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <div>
                        <p className="text-sm text-gray-600">Total Visitors</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                            {formatNumber(analytics.overview.totalVisitors)}
                        </p>
                    </div>
                </Card>

                <Card>
                    <div>
                        <p className="text-sm text-gray-600">Total Events</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                            {formatNumber(analytics.overview.totalEvents)}
                        </p>
                    </div>
                </Card>

                <Card>
                    <div>
                        <p className="text-sm text-gray-600">Conversions</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                            {formatNumber(analytics.overview.totalConversions)}
                        </p>
                    </div>
                </Card>

                <Card>
                    <div>
                        <p className="text-sm text-gray-600">Conversion Rate</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                            {analytics.overview.conversionRate}%
                        </p>
                    </div>
                </Card>
            </div>

            {/* Daily Trend */}
            <Card title="Daily Trend">
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="visitors" stroke="#3B82F6" name="Visitors" />
                        <Line type="monotone" dataKey="events" stroke="#10B981" name="Events" />
                    </LineChart>
                </ResponsiveContainer>
            </Card>

            {/* Variant Performance */}
            {variantPerformance.length > 0 && (
                <Card title="Variant Performance">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={variantPerformance}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="impressions" fill="#3B82F6" name="Impressions" />
                            <Bar dataKey="conversions" fill="#10B981" name="Conversions" />
                        </BarChart>
                    </ResponsiveContainer>

                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-2">Variant</th>
                                    <th className="text-right py-2">Impressions</th>
                                    <th className="text-right py-2">Conversions</th>
                                    <th className="text-right py-2">CVR</th>
                                </tr>
                            </thead>
                            <tbody>
                                {variantPerformance.map((variant, index) => (
                                    <tr key={index} className="border-b border-gray-100">
                                        <td className="py-2">{variant.name}</td>
                                        <td className="text-right">{formatNumber(variant.impressions)}</td>
                                        <td className="text-right">{formatNumber(variant.conversions)}</td>
                                        <td className="text-right font-semibold">{variant.conversionRate}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Top Pages */}
            <Card title="Top Pages">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-2">Path</th>
                                <th className="text-right py-2">Views</th>
                                <th className="text-right py-2">Unique Visitors</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analytics.topPages.map((page: any, index: number) => (
                                <tr key={index} className="border-b border-gray-100">
                                    <td className="py-2">
                                        <code className="bg-gray-100 px-2 py-1 rounded">{page.path}</code>
                                    </td>
                                    <td className="text-right">{formatNumber(page.views)}</td>
                                    <td className="text-right">{formatNumber(page.uniqueVisitors)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Device Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Devices">
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={analytics.deviceStats}
                                dataKey="count"
                                nameKey="_id"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label
                            >
                                {analytics.deviceStats.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>

                <Card title="Events by Type">
                    <div className="space-y-3">
                        {analytics.eventsByType.map((event: any, index: number) => (
                            <div key={index} className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">{event._id}</span>
                                <span className="font-semibold">{formatNumber(event.count)}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    )
}