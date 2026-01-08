// @/components/TopPagesList.tsx
"use client"

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTopPages } from '@/hooks/useTopPages';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

import { EmptyState } from './EmptyState';
import { FileText } from 'lucide-react';

export default function TopPagesList({ timeRange }: { timeRange: string }) {
    const { data, isLoading, error } = useTopPages(timeRange);

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
                <CardTitle>Top Performing Pages</CardTitle>
                <CardDescription>Your most viewed pages in the selected time range.</CardDescription>
            </CardHeader>
            <CardContent>
                {data && data.pages.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Page</TableHead>
                                <TableHead className="text-right">Views</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.pages.map(page => (
                                <TableRow key={page.page}>
                                    <TableCell>{page.page}</TableCell>
                                    <TableCell className="text-right">{page.views}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <EmptyState
                        icon={FileText}
                        title="No top pages"
                        description="There is no page view data for the selected time range."
                    />
                )}
            </CardContent>
        </Card>
    );
}