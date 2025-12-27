// @/components/PersonaDistributionChart.tsx
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
import { PersonaStat } from '@/hooks/useDashboard';
import EmptyState from './EmptyState';

interface PersonaDistributionChartProps {
    data: PersonaStat[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

export default function PersonaDistributionChart({ data }: PersonaDistributionChartProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Persona Distribution</CardTitle>
                <CardDescription>Distribution of your top user personas.</CardDescription>
            </CardHeader>
            <CardContent>
                {data && data.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={data}
                                dataKey="userCount"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="#8884d8"
                                label
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <EmptyState
                        title="No persona data"
                        description="There is no persona data to display for the selected time range."
                    />
                )}
            </CardContent>
        </Card>
    );
}