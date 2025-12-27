// @/app/(dashboard)/fraud/page.tsx
"use client"

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react"
import { Button } from "@/components/ui/button";
import { useFraud, FraudEvent } from "@/hooks/useFraud";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function FraudPage() {
    const { fraudEvents, isLoading, error } = useFraud();

    const getRiskIcon = (risk: string) => {
        switch (risk) {
            case "High": return <ShieldAlert className="h-4 w-4 text-red-500" />;
            case "Medium": return <ShieldQuestion className="h-4 w-4 text-yellow-500" />;
            default: return <ShieldCheck className="h-4 w-4 text-green-500" />;
        }
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
    <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Automated Fraud Detection</h1>
        </div>
        <p className="text-muted-foreground">
            Review and manage automated fraud prevention events based on risk scoring.
        </p>

        <Card>
            <CardHeader>
                <CardTitle>Recent Fraud Events</CardTitle>
                <CardDescription>
                    A log of recent activities flagged by the fraud detection system.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                     <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Event ID</TableHead>
                                <TableHead>Risk</TableHead>
                                <TableHead>Risk Score</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Timestamp</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fraudEvents.map((event) => (
                                <TableRow key={event.id}>
                                    <TableCell className="font-mono text-xs">{event.id}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {getRiskIcon(event.risk)}
                                            <span>{event.risk}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{event.score}</TableCell>
                                    <TableCell>{event.reason}</TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant={
                                                event.status === "Blocked" ? "destructive" :
                                                event.status === "Requires Review" ? "default" :
                                                "secondary"
                                            }
                                        >
                                            {event.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{event.timestamp}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Toggle menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem>View Details</DropdownMenuItem>
                                            <DropdownMenuItem>Mark as Safe</DropdownMenuItem>
                                        </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    </div>
  );
}