// @/app/(dashboard)/events/page.tsx
"use client"

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CircleUser, FileText, MousePointerClick, Link as LinkIcon, ShoppingCart, LogOut, Waves } from "lucide-react";
import WebsiteSwitcher from "@/components/WebsiteSwitcher"; // Import WebsiteSwitcher
import { useAppStore } from "@/store";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AppEvent } from "@/types";
import { EmptyState } from "@/components/EmptyState";

const eventIcons: { [key: string]: React.ReactNode } = {
    'pageview': <FileText className="h-4 w-4" />,
    'click': <MousePointerClick className="h-4 w-4" />,
    'session_start': <CircleUser className="h-4 w-4" />,
    'add_to_cart': <ShoppingCart className="h-4 w-4" />,
    'purchase': <Badge variant="secondary">Purchase</Badge>,
    'session_end': <LogOut className="h-4 w-4" />,
}

export default function EventsPage() {
    const { events, loading, error, fetchEvents, website } = useAppStore();

    React.useEffect(() => {
        if (website) {
            fetchEvents();
        }
    }, [fetchEvents, website]);

    if (!website) {
        return (
            <Alert variant="default">
                <AlertTitle>Select a Website</AlertTitle>
                <AlertDescription>Please select a website from the navigation to view events.</AlertDescription>
            </Alert>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    const renderContent = () => {
        if (loading) {
            return (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Event ID</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead>Timestamp</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 10 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            );
        }

        if (events && events.length > 0) {
            return (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Event ID</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead>Timestamp</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {events.map((event: AppEvent) => (
                            <TableRow key={event._id}>
                                <TableCell className="font-mono text-xs">{event._id}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {eventIcons[event.eventType] || <LinkIcon className="h-4 w-4" />}
                                        <span className="capitalize">{event.eventType.replace('_', ' ')}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{event.sessionId}</Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{JSON.stringify(event.eventData)}</TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            );
        }

        return (
            <EmptyState
                icon={Waves}
                title="No Events Yet"
                description="It looks like no events have been tracked for this website. To see live events, you need to integrate the BehaveIQ SDK into your website and start tracking user interactions. You can use the demo project to see how it works."
            />
        );
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Live Event Stream</h1>
                <WebsiteSwitcher />
            </div>
            <p className="text-muted-foreground">
                A real-time stream of user events being captured from your website.
            </p>

            <Card>
                <CardHeader>
                    <CardTitle>Incoming Events</CardTitle>
                    <CardDescription>
                        {events && events.length > 0 ? `Displaying the ${events.length} most recent events.` : 'Awaiting incoming events...'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {renderContent()}
                </CardContent>
            </Card>
        </div>
    );
}