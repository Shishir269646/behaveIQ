"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Heatmap from "@/components/ui/heatmap";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useHeatmap } from '@/hooks/useHeatmap';
import { useWebsitePages } from '@/hooks/useWebsitePages'; // New import
import { useAppStore } from '@/store';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function HeatmapsPage() {
    const [selectedPage, setSelectedPage] = useState<string | undefined>(undefined); // Change initial state
    const [mapType, setMapType] = useState('click');
    const { data: heatmapData, loading, error, fetchHeatmapData } = useHeatmap();
    const { pages, loadingPages, errorPages, fetchWebsitePages } = useWebsitePages(); // New hook usage
    const selectedWebsite = useAppStore((state) => state.website);

    // Fetch heatmap data
    useEffect(() => {
        if (selectedWebsite?._id && selectedPage) {
            fetchHeatmapData(selectedWebsite._id, selectedPage);
        }
    }, [selectedWebsite, selectedPage, fetchHeatmapData]);

    // Fetch website pages
    useEffect(() => {
        if (selectedWebsite?._id) {
            fetchWebsitePages(selectedWebsite._id);
        }
    }, [selectedWebsite, fetchWebsitePages]);

    // Set initial selectedPage once pages are loaded
    useEffect(() => {
        if (!selectedPage && pages.length > 0) {
            setSelectedPage(pages[0]);
        }
    }, [pages, selectedPage]);

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
                                        <SelectItem value="confusion">Confusion Map</SelectItem> {/* Renamed */}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label htmlFor="heatmap-page">Page</Label>
                                <Select value={selectedPage} onValueChange={setSelectedPage} disabled={loadingPages}>
                                    <SelectTrigger id="heatmap-page" className="w-[160px]">
                                        <SelectValue placeholder={loadingPages ? "Loading pages..." : "Select page"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                                                        {errorPages && <SelectItem value="__error_loading_pages__" disabled>Error loading pages</SelectItem>}
                                                                        {pages.length === 0 && !loadingPages && !errorPages && (
                                                                            <SelectItem value="__no_pages_found__" disabled>No pages found</SelectItem>
                                                                        )}                                        {pages.map((page) => (
                                            <SelectItem key={page} value={page}>
                                                {page}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {(loading || loadingPages) && ( // Added loadingPages
                        <div className="w-full h-[400px] bg-muted rounded-lg flex items-center justify-center">
                            <Skeleton className="w-full h-full" />
                        </div>
                    )}
                    {(error || errorPages) && ( // Added errorPages
                        <div className="w-full h-[400px] bg-muted rounded-lg flex items-center justify-center">
                            <Alert variant="destructive">
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error || errorPages}</AlertDescription> {/* Display both errors */}
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
                            {mapType === 'confusion' && (
                                <div className="p-4">
                                    <h3 className="font-bold text-lg">Confusion Zones (Top 10)</h3> {/* Consistent naming */}
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
        </div >
          
  );
}
