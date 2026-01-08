"use client"

import Link from 'next/link';
import {
    Bell,
    Home,
    Users,
    LineChart,
    Beaker,
    Palette,
    Settings,
    MessageSquareQuote,
    TicketPercent,
    ShieldAlert,
    Waves,
    ShoppingCart
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useExperiments } from '@/hooks/useExperiments'; // Use the hook
import { useEffect, useState } from 'react'; // Use useEffect and useState

const Sidebar = () => {
    const { experiments, isLoading } = useExperiments(); // Use the hook
    const [activeExperimentCount, setActiveExperimentCount] = useState(0);

    useEffect(() => {
        if (experiments) {
            const activeCount = experiments.filter(exp => exp.status === 'active').length;
            setActiveExperimentCount(activeCount);
        }
    }, [experiments]);

    return (
        <div className="hidden border-r bg-muted/40 md:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <LineChart className="h-6 w-6 text-primary" />
                        <span className="">BehaveIQ</span>
                    </Link>
                    <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
                        <Bell className="h-4 w-4" />
                        <span className="sr-only">Toggle notifications</span>
                    </Button>
                </div>
                <div className="flex-1">
                    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <Home className="h-4 w-4" />
                            Dashboard
                        </Link>
                        <Link
                            href="/settings"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <Settings className="h-4 w-4" />
                            Settings
                        </Link>
                        <Link
                            href="/events"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <Waves className="h-4 w-4" />
                            Live Events
                        </Link>
                        <Link
                            href="/personas"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <Users className="h-4 w-4" />
                            Personas
                        </Link>
                        <Link
                            href="/experiments"
                            className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-primary transition-all hover:text-primary"
                        >
                            <Beaker className="h-4 w-4" />
                            Experiments
                            {isLoading ? (
                                <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                                    ...
                                </Badge>
                            ) : (
                                activeExperimentCount > 0 && (
                                    <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                                        {activeExperimentCount}
                                    </Badge>
                                )
                            )}
                        </Link>
                        <Link
                            href="/heatmaps"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <Palette className="h-4 w-4" />
                            Heatmaps
                        </Link>
                        <Link
                            href="/content"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <MessageSquareQuote className="h-4 w-4" />
                            Content Generation
                        </Link>
                        <Link
                            href="/discounts"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <TicketPercent className="h-4 w-4" />
                            Discounts
                        </Link>
                        <Link
                            href="/abandonment"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <ShoppingCart className="h-4 w-4" />
                            Cart Abandonment
                        </Link>
                        <Link
                            href="/fraud"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <ShieldAlert className="h-4 w-4" />
                            Fraud Detection
                        </Link>
                    </nav>
                </div>
                <div className="mt-auto p-4">
                    <Card>
                        <CardHeader className="p-2 pt-0 md:p-4">
                            <CardTitle>Upgrade to Pro</CardTitle>
                            <CardDescription>
                                Unlock all features and get unlimited access to our support
                                team.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                            <Button size="sm" className="w-full">
                                Upgrade
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
