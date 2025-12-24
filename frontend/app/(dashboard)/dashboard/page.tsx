'use client';

import { useState, useEffect } from 'react';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWebsites } from '@/hooks/useWebsites';
import { useDashboard } from '@/hooks/useDashboard';
import { formatNumber, formatPercentage } from '@/lib/utils';
import { Users, MousePointer, TrendingUp, Target, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'react-hot-toast';

export default function DashboardPage() {
    const { websites, loading: websitesLoading } = useWebsites();
    const [selectedWebsite, setSelectedWebsite] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState('7d');
    const { overview, realtime, loading, error, success, fetchOverview, fetchRealtime, clearSuccess } = useDashboard();

    useEffect(() => {
        if (selectedWebsite) {
            fetchOverview(selectedWebsite, timeRange);
            fetchRealtime(selectedWebsite);
        }
    }, [selectedWebsite, timeRange, fetchOverview, fetchRealtime]);

    useEffect(() => {
        if (websites.length > 0 && !selectedWebsite) {
            setSelectedWebsite(websites[0]._id);
        }
    }, [websites]);

    useEffect(() => {
        if (success) {
            toast.success(success);
            clearSuccess();
        }
        if (error) {
            toast.error(error);
            clearSuccess();
        }
    }, [success, error, clearSuccess]);

    if (websitesLoading) {
        return <div>Loading...</div>;
    }

    if (websites.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No websites yet. Create one to get started!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                    <p className="text-gray-500">Monitor your website performance</p>
                </div>

                <div className="flex gap-4">
                    <Select value={selectedWebsite || ''} onValueChange={setSelectedWebsite}>
                        <SelectTrigger className="w-64">
                            <SelectValue placeholder="Select website" />
                        </SelectTrigger>
                        <SelectContent>
                            {websites.map((site) => (
                                <SelectItem key={site._id} value={site._id}>
                                    {site.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">Last 7 days</SelectItem>
                            <SelectItem value="30d">Last 30 days</SelectItem>
                            <SelectItem value="90d">Last 90 days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Real-time Stats */}
            {realtime && (
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-5 h-5 text-green-600 animate-pulse" />
                            <span className="font-semibold">Real-time</span>
                        </div>
                        <p className="text-3xl font-bold">{realtime.activeVisitors}</p>
                        <p className="text-sm text-gray-500">Active visitors now</p>
                    </CardContent>
                </Card>
            )}

            {/* Stats Grid */}
            {overview && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Visitors"
                        value={formatNumber(overview.overview.totalVisitors)}
                        icon={Users}
                        iconColor="text-blue-600"
                    />

                    <StatCard
                        title="Total Sessions"
                        value={formatNumber(overview.overview.totalSessions)}
                        icon={MousePointer}
                        iconColor="text-green-600"
                    />

                    <StatCard
                        title="Conversion Rate"
                        value={formatPercentage(overview.overview.conversionRate)}
                        icon={TrendingUp}
                        iconColor="text-purple-600"
                    />

                    <StatCard
                        title="Avg Intent Score"
                        value={overview.overview.avgIntentScore.toFixed(2)}
                        icon={Target}
                        iconColor="text-orange-600"
                    />
                </div>
            )}

            {/* Trend Chart */}
            {overview && (
                <Card>
                    <CardHeader>
                        <CardTitle>Sessions Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={overview.trendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="_id" />
                                <YAxis />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="sessions"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Top Personas */}
            {overview && overview.topPersonas.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Top Personas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {overview.topPersonas.map((persona) => (
                                <div key={persona._id} className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{persona.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {formatNumber(persona.stats.sessionCount)} sessions
                                        </p>
                                    </div>
                                    <span className="text-sm font-medium text-green-600">
                                        {formatPercentage(persona.stats.conversionRate)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}