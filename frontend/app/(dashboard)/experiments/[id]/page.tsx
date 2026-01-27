"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useAppStore } from "@/store";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button"; // Ensure Button is imported
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useState } from "react"; // Import useState

export default function ExperimentDetailPage() {
  const params = useParams();
  const experimentId = params.id as string;
  const { selectedExperiment, loading, error, fetchExperiment, clearSelectedExperiment, updateExperimentStatus, declareWinner } = useAppStore();
  const [winningVariation, setWinningVariation] = useState<string | null>(null);

  useEffect(() => {
    if (experimentId) {
      fetchExperiment(experimentId);
    }
    return () => {
        clearSelectedExperiment(); // Clear experiment data on unmount
    };
  }, [experimentId, fetchExperiment, clearSelectedExperiment]);

  useEffect(() => {
    if (selectedExperiment && selectedExperiment.variations.length > 0) {
      setWinningVariation(selectedExperiment.variations[0].name); // Default to first variation
    }
  }, [selectedExperiment]);


  const handleStatusUpdate = async (status: string) => {
    if (!experimentId) return;
    await updateExperimentStatus(experimentId, status);
  };

  const handleDeclareWinner = async () => {
    if (!experimentId || !winningVariation) return;
    await declareWinner(experimentId, winningVariation);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </div>
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

  if (!selectedExperiment) {
    return (
      <Alert>
        <AlertTitle>Not Found</AlertTitle>
        <AlertDescription>Experiment not found.</AlertDescription>
      </Alert>
    );
  }

  const chartData = selectedExperiment.variations.map(v => ({
    name: v.name,
    'Conversion Rate': parseFloat(v.conversionRate?.toString() || '0'),
  }));

  return (
    <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{selectedExperiment.name}</h1>
            <div className="flex gap-2">
                {selectedExperiment.status === 'draft' && (
                    <Button onClick={() => handleStatusUpdate('active')}>Start Experiment</Button>
                )}
                {selectedExperiment.status === 'active' && (
                    <>
                        <Button variant="outline" onClick={() => handleStatusUpdate('paused')}>Pause Experiment</Button>
                        <Button onClick={() => handleStatusUpdate('completed')}>Complete Experiment</Button>
                    </>
                )}
                {selectedExperiment.status === 'paused' && (
                    <Button onClick={() => handleStatusUpdate('active')}>Resume Experiment</Button>
                )}
                {(selectedExperiment.status === 'active' || selectedExperiment.status === 'paused') && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                Declare Winner <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {selectedExperiment.variations.map((variation) => (
                                <DropdownMenuItem 
                                    key={variation.name} 
                                    onSelect={() => setWinningVariation(variation.name)}
                                >
                                    {variation.name}
                                </DropdownMenuItem>
                            ))}
                            {winningVariation && (
                                <DropdownMenuItem onSelect={handleDeclareWinner} className="font-bold text-green-600">
                                    Confirm: {winningVariation} Wins
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>
      
      <p className="text-muted-foreground">{selectedExperiment.description}</p>

      <Card>
        <CardHeader>
          <CardTitle>Experiment Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <strong>Status:</strong> <Badge 
                                        variant={
                                            selectedExperiment.status === "active" ? "default" :
                                            selectedExperiment.status === "completed" ? "secondary" :
                                            "outline"
                                        }
                                    >
                                        {selectedExperiment.status}
                                    </Badge>
          </div>
          <div><strong>Start Date:</strong> {selectedExperiment.startDate ? new Date(selectedExperiment.startDate).toLocaleDateString() : 'N/A'}</div>
          <div><strong>End Date:</strong> {selectedExperiment.endDate ? new Date(selectedExperiment.endDate).toLocaleDateString() : 'N/A'}</div>
          <div><strong>Minimum Sample Size:</strong> {selectedExperiment.settings?.minSampleSize || 'N/A'}</div>
          {selectedExperiment.results && (
            <>
              <div><strong>Winner:</strong> {selectedExperiment.results.winner || 'Undetermined'}</div>
              <div><strong>Conversion Lift:</strong> {selectedExperiment.results.improvement ? `${selectedExperiment.results.improvement}%` : 'N/A'}</div>
              <div><strong>Confidence:</strong> {selectedExperiment.results.confidence ? `${selectedExperiment.results.confidence}%` : 'N/A'}</div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Traffic (%)</TableHead>
                <TableHead>Visitors</TableHead>
                <TableHead>Conversions</TableHead>
                <TableHead>Conversion Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedExperiment.variations.map((variation) => (
                <TableRow key={variation.name}>
                  <TableCell className="font-medium">{variation.name}</TableCell>
                  <TableCell>{variation.isControl ? 'Control' : 'Variation'}</TableCell>
                  <TableCell>{variation.trafficPercentage}%</TableCell>
                  <TableCell>{variation.visitors}</TableCell>
                  <TableCell>{variation.conversions}</TableCell>
                  <TableCell>{variation.conversionRate}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conversion Rate Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Conversion Rate" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

