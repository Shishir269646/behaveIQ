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
import { CircleUser, FileText, MousePointerClick, Link as LinkIcon, ShoppingCart, LogOut } from "lucide-react";
import { useEvents, Event, EventType } from "@/hooks/useEvents";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const eventIcons: { [key: string]: React.ReactNode } = {
    'page_view': <FileText className="h-4 w-4" />,
    'click': <MousePointerClick className="h-4 w-4" />,
    'session_start': <CircleUser className="h-4 w-4" />,
    'add_to_cart': <ShoppingCart className="h-4 w-4" />,
    'purchase': <Badge variant="secondary">Purchase</Badge>,
    'session_end': <LogOut className="h-4 w-4" />,
}

export default function EventsPage() {
    const { events, isLoading, error } = useEvents(true); // isLive = true

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

  return (
    <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Live Event Stream</h1>
        </div>
        <p className="text-muted-foreground">
            A real-time stream of user events being captured from your website.
        </p>

        <Card>
            <CardHeader>
                <CardTitle>Incoming Events</CardTitle>
                <CardDescription>
                    Displaying the 10 most recent events.
                </CardDescription>
            </CardHeader>
            <CardContent>
                                            {isLoading ? (
                                                Array.from({ length: 10 }).map((_, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                events && events.length > 0 ? (
                                                    events.map((event) => (
                                                        <TableRow key={event.id}>
                                                            <TableCell className="font-mono text-xs">{event.id}</TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    {eventIcons[event.type] || <LinkIcon className="h-4 w-4" />}
                                                                    <span className="capitalize">{event.type.replace('_', ' ')}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline">{event.user}</Badge>
                                                            </TableCell>
                                                            <TableCell className="font-mono text-xs">{event.details}</TableCell>
                                                            <TableCell className="font-mono text-xs text-muted-foreground">{event.timestamp}</TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                                            No events found for this website.
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            )}            </CardContent>
        </Card>
    </div>
  );
}