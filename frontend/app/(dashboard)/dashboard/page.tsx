"use client"

import * as React from 'react';
import {
    Activity,
    ArrowUpRight,
    Users,
    CreditCard,
    RefreshCw,
    Lightbulb,
    UserSquare,
    ToggleRight,
    Map,
    FlaskConical,
    FileText,
    ShoppingCart,
    Tag,
    ShieldAlert,
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
import RevenueTrendChart from '@/components/RevenueTrendChart';
import PersonaDistributionChart from '@/components/PersonaDistributionChart';
import SessionDetailSheet from '@/components/SessionDetailSheet';
import TopPagesList from '@/components/TopPagesList';
import ConversionFunnelChart from '@/components/ConversionFunnelChart';
import RealtimeVisitors from '@/components/RealtimeVisitors';
import EmotionTrendChart from '@/components/EmotionTrendChart';
import ErrorBoundary from '@/components/ErrorBoundary';
import { EmptyState } from '@/components/EmptyState';
import IntentScoreDistributionChart from '@/components/IntentScoreDistributionChart';
import InsightsList from '@/components/InsightsList';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/store';
import { Session, Website } from '@/types';

export default function DashboardPage() {
    const [timeRange, setTimeRange] = React.useState('7d');
    const {
        website: selectedWebsite,
        overview,
        topPersonas,
        trendData,
        recentSessions,
        loading: isLoading,
        error,
        fetchDashboardData
    } = useAppStore();

    const [selectedSession, setSelectedSession] = React.useState<Session | null>(null);
    
    React.useEffect(() => {
        if (selectedWebsite) {
            fetchDashboardData(selectedWebsite._id, timeRange);
        }
    }, [selectedWebsite, timeRange, fetchDashboardData]);

    const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);
    const formatChange = (value: number) => `${value >= 0 ? '+' : ''}${value}%`;

    const handleRefresh = () => {
        if (selectedWebsite) {
            fetchDashboardData(selectedWebsite._id, timeRange);
        }
    };

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (!selectedWebsite) {
        return (
            <EmptyState
                icon={Lightbulb}
                title="No Website Selected"
                description="Please select a website from the dropdown to view dashboard data."
            />
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
                    <Button onClick={handleRefresh} size="icon" variant="outline" disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
                <div className="grid gap-4 md:gap-8 lg:grid-cols-1">
                    <RealtimeVisitors />
                </div>
                <div className="grid gap-4 md:gap-8 lg:grid-cols-4">
                    {isLoading || !overview ? (
                        <>
                            <Skeleton className="h-32" />
                            <Skeleton className="h-32" />
                            <Skeleton className="h-32" />
                            <Skeleton className="h-32" />
                        </>
                    ) : (
                        <>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{formatNumber(overview.totalVisitors.value)}</div>
                                    <p className="text-xs text-muted-foreground">{formatChange(overview.totalVisitors.change)} from last month</p>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{formatNumber(overview.totalSessions.value)}</div>
                                    <p className="text-xs text-muted-foreground">{formatChange(overview.totalSessions.change)} from last month</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{formatNumber(overview.totalConversions.value)}</div>
                                    <p className="text-xs text-muted-foreground">{formatChange(overview.totalConversions.change)} from last month</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Avg Intent Score</CardTitle>
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{overview.avgIntentScore.value.toFixed(2)}</div>
                                    <p className="text-xs text-muted-foreground">{formatChange(overview.avgIntentScore.change)} since last hour</p>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
                {/* New Feature Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4 mt-6">
                    {isLoading || !selectedWebsite ? ( // Use selectedWebsite to determine loading of these cards
                        <>
                            <Skeleton className="h-32" />
                            <Skeleton className="h-32" />
                            <Skeleton className="h-32" />
                            <Skeleton className="h-32" />
                            <Skeleton className="h-32" />
                            <Skeleton className="h-32" />
                            <Skeleton className="h-32" />
                            <Skeleton className="h-32" />
                        </>
                    ) : (
                        <>
                            {/* Persona Summary Card */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Personas</CardTitle>
                                    <UserSquare className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{formatNumber(selectedWebsite.stats?.totalPersonas || 0)}</div>
                                    <p className="text-xs text-muted-foreground">
                                        {/* This data is not directly available from selectedWebsite.stats in this format */}
                                        {/* For accurate data, would need a dedicated API endpoint for persona summary */}
                                        No new personas (placeholder)
                                    </p>
                                    <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground">
                                        <Link href="/personas">View Personas</Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Personalization Status Card */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Personalization</CardTitle>
                                    <ToggleRight className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {selectedWebsite.settings?.autoPersonalization ? 'Enabled' : 'Disabled'}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Status across website
                                    </p>
                                    <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground">
                                        <Link href="/settings">Configure</Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Heatmap Summary Card */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Heatmap Data</CardTitle>
                                    <Map className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {/* This data is not directly available from selectedWebsite.stats in this format */}
                                        {/* For accurate data, would need a dedicated API endpoint for heatmap summary */}
                                        Not available (placeholder)
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        No data collected (placeholder)
                                    </p>
                                    <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground">
                                        <Link href="/heatmaps">View Heatmaps</Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Experiment Summary Card */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Experiments</CardTitle>
                                    <FlaskConical className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {/* This data is not directly available from selectedWebsite.stats in this format */}
                                        0 Active (placeholder)
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        0 total (placeholder)
                                    </p>
                                    <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground">
                                        <Link href="/experiments">Manage Experiments</Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Content Summary Card */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Content Generated</CardTitle>
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">0</div>
                                    <p className="text-xs text-muted-foreground">
                                        No content generated (placeholder)
                                    </p>
                                    <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground">
                                        <Link href="/content">View Content</Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Abandonment Summary Card */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Abandonment Rate</CardTitle>
                                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">0.00%</div>
                                    <p className="text-xs text-muted-foreground">
                                        0 interventions last 30 days (placeholder)
                                    </p>
                                    <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground">
                                        <Link href="/abandonment">Analyze Abandonment</Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Discount Summary Card */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Discounts</CardTitle>
                                    <Tag className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">0 Offered</div>
                                    <p className="text-xs text-muted-foreground">
                                        Avg. Value: $0.00 (placeholder)
                                    </p>
                                    <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground">
                                        <Link href="/discounts">Manage Discounts</Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Fraud Summary Card */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Fraud Detection</CardTitle>
                                    <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">0 Incidents</div>
                                    <p className="text-xs text-muted-foreground">
                                        0 scores last 30 days (placeholder)
                                    </p>
                                    <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground">
                                        <Link href="/settings">Configure Fraud</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
                
                <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
                    {isLoading || !trendData ? (
                        <Skeleton className="h-96" />
                    ) : (
                        <RevenueTrendChart data={trendData} />
                    )}
                    {isLoading || !topPersonas ? (
                        <Skeleton className="h-96" />
                    ) : (
                        <PersonaDistributionChart data={topPersonas} />
                    )}
                    {isLoading || !selectedWebsite?.stats || !(selectedWebsite.stats as any).intentDistribution ? (
                        <Skeleton className="h-96" />
                    ) : (
                        <IntentScoreDistributionChart data={(selectedWebsite.stats as any).intentDistribution} />
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
                            ) : recentSessions && recentSessions.length > 0 ? (
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
                                        {recentSessions.map(session => (
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
                                                                     icon={Activity}
                                                                     title="No recent sessions"
                                                                     description="There have been no user sessions in the selected time range."
                                                                 />
                            )}
                        </CardContent>
                    </Card>
                </div>
                {isLoading || !selectedWebsite?.stats || !(selectedWebsite.stats as any).insights ? ( // insights are part of website stats
                    <Skeleton className="h-48" />
                ) : (
                    <InsightsList insights={(selectedWebsite.stats as any).insights} />
                )}
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