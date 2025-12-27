// @/components/ConversionFunnelChart.tsx
"use client"

import * as React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useConversionFunnel } from '@/hooks/useConversionFunnel';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export default function ConversionFunnelChart({ timeRange }: { timeRange: string }) {
    const { data, isLoading, error } = useConversionFunnel(timeRange);

    if (isLoading) {
        return <Skeleton className="h-96" />;
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>User progression through the conversion funnel.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data?.funnel} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="step" width={80} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="visitors" fill="#8884d8" name="Visitors" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}