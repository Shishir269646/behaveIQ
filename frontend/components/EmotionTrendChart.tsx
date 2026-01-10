// @/components/EmotionTrendChart.tsx
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
import { useEmotionTrends } from '@/hooks/useEmotionTrends';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const EMOTION_COLORS: { [key: string]: string } = {
    frustrated: '#FF6B6B',
    confused: '#FFD93D',
    excited: '#6BCB77',
    considering: '#4D96FF',
    neutral: '#BDBDBD',
};

export default function EmotionTrendChart({ timeRange }: { timeRange: string }) {
    const { data, isLoading, error } = useEmotionTrends(timeRange);

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
    
    const emotions = data?.trends && data.trends.length > 0 
        ? Object.keys(data.trends[0]).filter(key => key !== 'date') 
        : [];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Emotion Trends</CardTitle>
                <CardDescription>User emotions over the selected time range.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data?.trends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {emotions.map(emotion => (
                            <Line
                                key={emotion}
                                type="monotone"
                                dataKey={emotion}
                                stroke={EMOTION_COLORS[emotion] || '#000000'}
                                name={emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}