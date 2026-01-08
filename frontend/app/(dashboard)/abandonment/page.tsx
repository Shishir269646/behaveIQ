"use client"

import { PlusCircle, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAbandonment } from "@/hooks/useAbandonment";
import { useAppStore } from "@/store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "@/hooks/use-toast";

export default function AbandonmentPage() {
    const [timeRange, setTimeRange] = useState('7d');
    const selectedWebsite = useAppStore((state) => state.website);
    const { data, isLoading, error, success, fetchData, clearSuccess } = useAbandonment(timeRange);


    useEffect(() => {
        if (selectedWebsite?._id) {
            fetchData();
        }
    }, [selectedWebsite?._id, fetchData]);

    useEffect(() => {
        if (success) {
            toast({
                title: "Success",
                description: success,
            });
            clearSuccess();
        }
        if (error) {
            toast({
                title: "Error",
                description: error,
                variant: "destructive",
            });
            clearSuccess();
        }
    }, [success, error, clearSuccess, toast]);


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
                icon={ShoppingCart}
                title="No Website Selected"
                description="Please select a website from the dropdown to view abandonment data."
            />
        );
    }

  return (
    <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Predictive Cart Abandonment</h1>
            <Select value={timeRange} onValueChange={setTimeRange} disabled={isLoading}>
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
        </div>
        <p className="text-muted-foreground">
            AI predicts abandonment risk and intervenes automatically.
        </p>

        {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
            </div>
        ) : data ? (
            <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Overall Risk</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{data.overallRisk}%</div>
                            <p className="text-sm text-muted-foreground">Average predicted risk for current sessions.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Interventions Triggered</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{data.interventionsTriggered}</div>
                            <p className="text-sm text-muted-foreground">Number of times AI intervened.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Recovery Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{data.recoveryRate}%</div>
                            <p className="text-sm text-muted-foreground">Percentage of carts recovered after intervention.</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Intervention Performance</CardTitle>
                        <CardDescription>Effectiveness of different intervention strategies.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Strategy</TableHead>
                                    <TableHead>Shown</TableHead>
                                    <TableHead>Clicked</TableHead>
                                    <TableHead>Converted</TableHead>
                                    <TableHead>Effectiveness</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.interventionPerformance.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{item.type}</TableCell>
                                        <TableCell>{item.shown}</TableCell>
                                        <TableCell>{item.clicked}</TableCell>
                                        <TableCell>{item.converted}</TableCell>
                                        <TableCell>
                                            <Progress value={item.effectiveness} className="w-[100px] inline-flex" /> {item.effectiveness}%
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Abandonment Risk Trends</CardTitle>
                        <CardDescription>Historical trend of average abandonment risk.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* TODO: Add a chart component for riskTrends */}
                        <div className="h-64 flex items-center justify-center bg-muted rounded-md">
                            <p className="text-muted-foreground">Chart for Risk Trends coming soon...</p>
                        </div>
                    </CardContent>
                </Card>
            </>
        ) : (
            <EmptyState
                icon={ShoppingCart}
                title="No Abandonment Data"
                description="No cart abandonment data available for the selected website and time range."
            />
        )}
    </div>
  );
}
