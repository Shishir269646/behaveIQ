"use client"

import * as React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { IntentDistribution } from '@/types';
import { EmptyState } from './EmptyState';
import { Target } from 'lucide-react';

interface IntentScoreDistributionChartProps {
    data: IntentDistribution | null;
}

const COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77']; // Low, Medium, High

export default function IntentScoreDistributionChart({ data }: IntentScoreDistributionChartProps) {
    if (!data || (data.low === 0 && data.medium === 0 && data.high === 0)) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Intent Score Distribution</CardTitle>
                    <CardDescription>Distribution of user intent scores across sessions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <EmptyState
                        icon={Target}
                        title="No intent data"
                        description="There is no intent score data to display for the selected time range."
                    />
                </CardContent>
            </Card>
        );
    }

    const chartData = [
        { name: 'Low Intent', value: data.low },
        { name: 'Medium Intent', value: data.medium },
        { name: 'High Intent', value: data.high },
    ].filter(item => item.value > 0); // Filter out zero values

    if (chartData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Intent Score Distribution</CardTitle>
                    <CardDescription>Distribution of user intent scores across sessions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <EmptyState
                        icon={Target}
                        title="No intent data"
                        description="There is no intent score data to display for the selected time range."
                    />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Intent Score Distribution</CardTitle>
                <CardDescription>Distribution of user intent scores across sessions.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            label
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
