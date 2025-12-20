
'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { useSites } from '@/hooks/useSites'
import { Users, MousePointer, TrendingUp, Activity } from 'lucide-react'
import { formatNumber, formatPercentage } from '@/lib/utils'

export default function DashboardPage() {
    const { sites, fetchSites } = useSites()
    const [stats, setStats] = useState({
        totalVisitors: 0,
        totalEvents: 0,
        totalConversions: 0,
        avgConversionRate: 0
    })

    useEffect(() => {
        fetchSites()
    }, [])

    useEffect(() => {
        if (sites.length > 0) {
            const totals = sites.reduce((acc, site) => ({
                totalVisitors: acc.totalVisitors + site.stats.totalVisitors,
                totalEvents: acc.totalEvents + site.stats.totalEvents,
                totalConversions: acc.totalConversions + site.stats.totalConversions,
                avgConversionRate: acc.avgConversionRate + site.stats.conversionRate
            }), {
                totalVisitors: 0,
                totalEvents: 0,
                totalConversions: 0,
                avgConversionRate: 0
            })

            totals.avgConversionRate = totals.avgConversionRate / sites.length

            setStats(totals)
        }
    }, [sites])

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-2">Welcome back! এখানে আপনার overview দেখুন।</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Visitors</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {formatNumber(stats.totalVisitors)}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-primary-600" />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Events</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {formatNumber(stats.totalEvents)}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <MousePointer className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Conversions</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {formatNumber(stats.totalConversions)}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Conversion Rate</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {formatPercentage(stats.avgConversionRate)}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Activity className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Sites List */}
            <Card title="Your Sites">
                {sites.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 mb-4">আপনার কোন site নেই</p>
                        <a
                            href="/sites"
                            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                            Create First Site
                        </a>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sites.map((site) => (
                            <div
                                key={site._id}
                                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                            >
                                <div>
                                    <h3 className="font-semibold text-gray-900">{site.name}</h3>
                                    <p className="text-sm text-gray-600">{site.domain}</p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600">Visitors</p>
                                        <p className="font-semibold">{formatNumber(site.stats.totalVisitors)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600">Conversions</p>
                                        <p className="font-semibold">{formatNumber(site.stats.totalConversions)}</p>
                                    </div>
                                    <a
                                        href={`/sites/${site._id}`}
                                        className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                    >
                                        View
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    )
}