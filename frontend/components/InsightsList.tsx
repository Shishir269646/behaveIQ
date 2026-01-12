"use client"

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, AlertCircle, TrendingUp } from 'lucide-react';
import { Insight } from '@/types';
import { EmptyState } from './EmptyState';

interface InsightsListProps {
    insights: Insight[];
}

export default function InsightsList({ insights }: InsightsListProps) {
    if (!insights || insights.length === 0) {
        return (
            <Card className="xl:col-span-2">
                <CardHeader>
                    <CardTitle>AI Insights</CardTitle>
                    <CardDescription>Actionable recommendations from AI analysis.</CardDescription>
                </CardHeader>
                <CardContent>
                    <EmptyState
                        icon={Lightbulb}
                        title="No insights yet"
                        description="The AI is still learning or no actionable insights have been generated."
                    />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="xl:col-span-2">
            <CardHeader>
                <CardTitle>AI Insights</CardTitle>
                <CardDescription>Actionable recommendations from AI analysis.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {insights.map((insight, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 border rounded-md">
                            <div className="flex-shrink-0 mt-1">
                                {insight.priority === 'high' ? (
                                    <AlertCircle className="h-5 w-5 text-red-500" />
                                ) : insight.type === 'opportunity' ? (
                                    <TrendingUp className="h-5 w-5 text-green-500" />
                                ) : (
                                    <Lightbulb className="h-5 w-5 text-blue-500" />
                                )}
                            </div>
                            <div>
                                <p className="font-medium">{insight.message}</p>
                                <div className="flex gap-2 mt-1">
                                    <Badge variant="outline">{insight.type.replace('_', ' ')}</Badge>
                                    <Badge variant="secondary">Priority: {insight.priority}</Badge>
                                    {insight.action && <Badge>{insight.action.replace('_', ' ')}</Badge>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
