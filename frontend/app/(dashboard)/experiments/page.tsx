"use client"

import * as React from 'react';
import { PlusCircle } from "lucide-react";
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
import { useAppStore } from "@/store";
import { useEffect } from "react";
import { Experiment } from "@/types";

export default function ExperimentsPage() {
    const { experiments, loading: isLoading, error, fetchExperiments } = useAppStore();
    const selectedWebsite = useAppStore((state) => state.website);

    useEffect(() => {
        if (selectedWebsite?._id) {
            fetchExperiments(selectedWebsite._id);
        }
    }, [selectedWebsite?._id, fetchExperiments]);

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
            <h1 className="text-2xl font-bold">Auto-Pilot A/B Testing</h1>
            <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Experiment
            </Button>
        </div>
        <p className="text-muted-foreground">
            System runs experiments automatically and declares winners based on statistical significance.
        </p>

        <Card>
            <CardHeader>
                <CardTitle>Active & Recent Experiments</CardTitle>
                <CardDescription>
                    Manage and track your A/B tests.
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
                                <TableHead>Experiment</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Conversion Lift</TableHead>
                                <TableHead>Progress</TableHead>
                                <TableHead>Current Winner</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {experiments.map((exp: Experiment) => (
                                <TableRow key={exp._id}>
                                    <TableCell className="font-medium">{exp.name}</TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant={
                                                exp.status === "active" ? "default" :
                                                exp.status === "completed" ? "secondary" :
                                                "outline"
                                            }
                                        >
                                            {exp.status}
                                        </Badge>
                                    </TableCell>
                                    {(() => {
                                        const conversionLiftValue = exp.results?.improvement;
                                        const formattedConversionLift = conversionLiftValue !== undefined && conversionLiftValue !== null
                                            ? `${conversionLiftValue > 0 ? '+' : ''}${conversionLiftValue.toFixed(2)}%`
                                            : exp.status === 'completed' ? 'N/A' : '-';

                                        return (
                                            <TableCell 
                                                className={
                                                    conversionLiftValue !== undefined && conversionLiftValue > 0 
                                                        ? 'text-green-600' 
                                                        : (conversionLiftValue !== undefined && conversionLiftValue < 0 ? 'text-red-600' : 'text-muted-foreground')
                                                }
                                            >
                                                {formattedConversionLift}
                                            </TableCell>
                                        );
                                    })()}
                                    <TableCell>
                                        {(() => {
                                            let progressValue = 0;
                                            if (exp.status === 'completed') {
                                                progressValue = 100;
                                            } else {
                                                const totalVisitors = exp.variations.reduce((sum, variation) => sum + variation.visitors, 0);
                                                const minSampleSize = exp.settings.minSampleSize;
                                                if (minSampleSize > 0) {
                                                    progressValue = Math.min((totalVisitors / minSampleSize) * 100, 100);
                                                }
                                            }
                                            return <Progress value={progressValue} className="w-full" />;
                                        })()}
                                    </TableCell>
                                    <TableCell>
                                        {exp.status === 'completed' 
                                            ? (exp.results?.winner || 'Undetermined') 
                                            : 'N/A'}
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