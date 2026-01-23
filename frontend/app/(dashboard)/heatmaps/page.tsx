"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Heatmap from "@/components/ui/heatmap";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useHeatmap } from '@/hooks/useHeatmap';
import { useAppStore } from '@/store';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function HeatmapsPage() {
    const [selectedPage, setSelectedPage] = useState('/home');
    const [mapType, setMapType] = useState('click');
    const { data: heatmapData, loading, error, fetchHeatmapData } = useHeatmap();
    const selectedWebsite = useAppStore((state) => state.website);

    useEffect(() => {
        if (selectedWebsite?._id && selectedPage) {
            fetchHeatmapData(selectedWebsite._id, selectedPage);
        }
    }, [selectedWebsite, selectedPage, fetchHeatmapData]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Visual Intent Heatmaps</h1>
      </div>
      <p className="text-muted-foreground">
        Shows not just where users click, but where they hesitate and get confused.
      </p>

      <Card>
          <CardHeader>
              <CardTitle>Homepage Click Map</CardTitle>
              <CardDescription className="flex items-center justify-between">
                  <span>Visualizing user clicks on the homepage over the last 7 days.</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="heatmap-type">Map Type</Label>
                        <Select value={mapType} onValueChange={setMapType}>
                            <SelectTrigger id="heatmap-type" className="w-[120px]">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="click">Click Map</SelectItem>
                                <SelectItem value="scroll">Scroll Map</SelectItem>
                                <SelectItem value="attention">Attention Map</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="flex items-center gap-2">
                        <Label htmlFor="heatmap-page">Page</Label>
                        <Select value={selectedPage} onValueChange={setSelectedPage}>
                            <SelectTrigger id="heatmap-page" className="w-[120px]">
                                <SelectValue placeholder="Select page" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="/home">Homepage</SelectItem>
                                <SelectItem value="/pricing">Pricing</SelectItem>
                                <SelectItem value="/features">Features</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                  </div>
              </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
                <div className="w-full h-[400px] bg-muted rounded-lg flex items-center justify-center">
                    <Skeleton className="w-full h-full" />
                </div>
            )}
            {error && (
                 <div className="w-full h-[400px] bg-muted rounded-lg flex items-center justify-center">
                    <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </div>
            )}
            {heatmapData && !loading && !error && (
                 <div className="w-full h-[400px] rounded-lg">
                    {mapType === 'click' && <Heatmap data={heatmapData.clicks} width={800} height={400} />}
                    {mapType === 'scroll' && (
                        <div className="p-4">
                            <h3 className="font-bold text-lg">Scroll Depth</h3>
                            <p>Average Scroll Depth: {heatmapData.scrollDepth.avgScrollDepth}%</p>
                            <p>Max Scroll Depth: {heatmapData.scrollDepth.maxScrollDepth}%</p>
                        </div>
                    )}
                    {mapType === 'attention' && (
                        <div className="p-4">
                            <h3 className="font-bold text-lg">Attention Zones (Top 10)</h3>
                            <ul>
                                {heatmapData.confusionZones.map((zone, index) => (
                                    <li key={index} className="border-b py-2">
                                        <p><strong>Element:</strong> {zone.element}</p>
                                        <p>Average Hover Time: {zone.avgHoverTime}s</p>
                                        <p>Confusion Score: {zone.confusionScore}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
          </CardContent>
      </Card>
    </div>
  );
}
