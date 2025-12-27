// @/components/RevenueTrendChart.tsx
"use client"

import * as React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendData } from '@/hooks/useDashboard';

interface RevenueTrendChartProps {
    data: TrendData[];
}

export default function RevenueTrendChart({ data }: RevenueTrendChartProps) {
    const formattedData = data.map(item => ({
        date: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Sessions: item.sessions,
        Conversions: item.conversions,
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle>Revenue & Engagement Trends</CardTitle>
                <CardDescription>Sessions vs. Conversions over the selected time range.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={formattedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Sessions" stroke="#8884d8" activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="Conversions" stroke="#82ca9d" />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}