"use client"

import * as React from 'react';
import {
    Activity,
    ArrowUpRight,
    CircleUser,
    CreditCard,
    Users,
} from 'lucide-react';

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { useDashboard, Session } from '@/hooks/useDashboard';
import RevenueTrendChart from '@/components/RevenueTrendChart';
import PersonaDistributionChart from '@/components/PersonaDistributionChart';
import ConversionFunnelChart from '@/components/ConversionFunnelChart';
import RealtimeVisitors from '@/components/RealtimeVisitors';
import EmotionTrendChart from '@/components/EmotionTrendChart';
import ErrorBoundary from '@/components/ErrorBoundary';
import EmptyState from '@/components/EmptyState';

export default function DashboardPage() {
    const [timeRange, setTimeRange] = React.useState('7d');
    const { data, isLoading, error, refetch: refetchDashboard } = useDashboard(timeRange);
    const { refetch: refetchConversionFunnel } = useConversionFunnel(timeRange);
    const { refetch: refetchEmotionTrends } = useEmotionTrends(timeRange);
    const { refetch: refetchTopPages } = useTopPages(timeRange);
    const [selectedSession, setSelectedSession] = React.useState<Session | null>(null);
    
    const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);
    const formatChange = (value: number) => `${value >= 0 ? '+' : ''}${value}%`;

    const handleRefresh = () => {
        refetchDashboard();
        refetchConversionFunnel();
        refetchEmotionTrends();
        refetchTopPages();
    };

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    return (
        <ErrorBoundary>
            <>
                <div className="flex justify-end mb-4 space-x-2">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select a time range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1d">24 hours</SelectItem>
                            <SelectItem value="7d">7 days</SelectItem>
                            <SelectItem value="30d">30 days</SelectItem>
                            <SelectItem value="90d">90 days</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={handleRefresh} size="icon" variant="outline">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
                <div className="grid gap-4 md:gap-8 lg:grid-cols-1">
                    <RealtimeVisitors />
                </div>
                <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                    {isLoading ? (
                        <>
                            <Skeleton className="h-32" />
                            <Skeleton className="h-32" />
                            <Skeleton className="h-32" />
                            <Skeleton className="h-32" />
                        </>
                    ) : data && (
                        <>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{formatNumber(data.stats.totalVisitors.value)}</div>
                                    <p className="text-xs text-muted-foreground">{formatChange(data.stats.totalVisitors.change)} from last month</p>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{formatNumber(data.stats.totalSessions.value)}</div>
                                    <p className="text-xs text-muted-foreground">{formatChange(data.stats.totalSessions.change)} from last month</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{formatNumber(data.stats.totalConversions.value)}</div>
                                    <p className="text-xs text-muted-foreground">{formatChange(data.stats.totalConversions.change)} from last month</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Avg Intent Score</CardTitle>
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{data.stats.avgIntentScore.value.toFixed(2)}</div>
                                    <p className="text-xs text-muted-foreground">{formatChange(data.stats.avgIntentScore.change)} since last hour</p>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
                <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
                    {isLoading || !data ? (
                        <Skeleton className="h-96" />
                    ) : (
                        <RevenueTrendChart data={data.trendData} />
                    )}
                    {isLoading || !data ? (
                        <Skeleton className="h-96" />
                    ) : (
                        <PersonaDistributionChart data={data.topPersonas} />
                    )}
                </div>
                 <div className="grid gap-4 md:gap-8 lg:grid-cols-1">
                    <Card className="xl:col-span-2">
                        <CardHeader className="flex flex-row items-center">
                            <div className="grid gap-2">
                                <CardTitle>Recent Sessions</CardTitle>
                                <CardDescription>Click a session to view details.</CardDescription>
                            </div>
                            <Button asChild size="sm" className="ml-auto gap-1">
                                <Link href="/events">
                                    View All
                                    <ArrowUpRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ) : data && data.recentSessions.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Persona</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Intent Score</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.recentSessions.map(session => (
                                            <TableRow key={session.id} onClick={() => setSelectedSession(session)} className="cursor-pointer">
                                                <TableCell>
                                                    <div className="font-medium">{session.user.name}</div>
                                                    <div className="hidden text-sm text-muted-foreground md:inline">{session.user.email}</div>
                                                </TableCell>
                                                <TableCell><Badge variant="outline">{session.persona}</Badge></TableCell>
                                                <TableCell><Badge variant={session.status === 'Abandoned' ? 'destructive' : session.status === 'Converted' ? 'secondary' : 'outline'}>{session.status}</Badge></TableCell>
                                                <TableCell className="text-right">{session.intentScore}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <EmptyState
                                    title="No recent sessions"
                                    description="There have been no user sessions in the selected time range."
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
                <div className="grid gap-4 md:gap-8 lg:grid-cols-1">
                    <ConversionFunnelChart timeRange={timeRange} />
                </div>
                <div className="grid gap-4 md:gap-8 lg:grid-cols-1">
                    <EmotionTrendChart timeRange={timeRange} />
                </div>
                <div className="grid gap-4 md:gap-8 lg:grid-cols-1">
                    <TopPagesList timeRange={timeRange} />
                </div>
                {selectedSession && (
                    <SessionDetailSheet session={selectedSession} isOpen={!!selectedSession} onOpenChange={(isOpen) => !isOpen && setSelectedSession(null)} />
                )}
            </>
        </ErrorBoundary>
    );
}