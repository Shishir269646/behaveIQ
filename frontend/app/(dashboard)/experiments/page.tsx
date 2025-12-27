// @/app/(dashboard)/experiments/page.tsx
"use client"

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
import { useExperiments } from "@/hooks/useExperiments";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function ExperimentsPage() {
    const { experiments, isLoading, error } = useExperiments();

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
                            {experiments.map((exp) => (
                                <TableRow key={exp.id}>
                                    <TableCell className="font-medium">{exp.name}</TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant={
                                                exp.status === "Running" ? "default" :
                                                exp.status === "Completed" ? "secondary" :
                                                "outline"
                                            }
                                        >
                                            {exp.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell 
                                        className={exp.conversionLift.startsWith('+') ? 'text-green-600' : 'text-red-600'}
                                    >
                                        {exp.conversionLift}
                                    </TableCell>
                                    <TableCell>
                                        <Progress value={exp.progress} className="w-full" />
                                    </TableCell>
                                    <TableCell>{exp.winner}</TableCell>
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