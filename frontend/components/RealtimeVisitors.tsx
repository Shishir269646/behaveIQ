// @/components/RealtimeVisitors.tsx
"use client"

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRealtime } from '@/hooks/useRealtime';
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
import { Badge } from './ui/badge';
import { Users } from 'lucide-react';

export default function RealtimeVisitors() {
    const { data, isLoading, error } = useRealtime();

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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Real-time Visitors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{data?.activeVisitors}</div>
                <p className="text-xs text-muted-foreground">Visitors active in the last 5 minutes</p>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Current Page</TableHead>
                            <TableHead>Persona</TableHead>
                            <TableHead>Intent</TableHead>
                            <TableHead className="text-right">Duration</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data?.activeSessions.map(session => (
                            <TableRow key={session.sessionId}>
                                <TableCell>{session.currentPage}</TableCell>
                                <TableCell><Badge variant="outline">{session.personaType}</Badge></TableCell>
                                <TableCell>{session.intentScore.toFixed(2)}</TableCell>
                                <TableCell className="text-right">{session.duration}s</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}