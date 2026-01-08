"use client";

import React, { useState, useEffect } from 'react';
import { useWebsites } from '@/hooks/useWebsites';
import { useHeatmap } from '@/hooks/useHeatmap';
import Heatmap from '@/components/ui/heatmap'; // Assuming Heatmap component is in components/ui
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'react-hot-toast';
import { Progress } from '@/components/ui/progress'; // For scroll depth visualization
import { Lightbulb, MousePointerClick, TrendingUp } from 'lucide-react'; // Icons for insights
import { EmptyState } from '@/components/EmptyState';
import { useAppStore } from '@/store';

export default function HeatmapPage() {
    const { websites } = useWebsites();
    const selectedWebsite = useAppStore((state) => state.website); // Get selected website from global store
    const { data: heatmapData, loading: isLoadingHeatmap, error: heatmapError, success, fetchHeatmapData, clearSuccess } = useHeatmap();

    const [pageUrl, setPageUrl] = useState('');
    const [submittedUrl, setSubmittedUrl] = useState('');
    const [heatmapType, setHeatmapType] = useState('click'); // 'click', 'scroll', 'confusion'

    useEffect(() => {
        if (success) {
            toast.success(success);
            clearSuccess();
        }
        if (heatmapError) {
            toast.error(heatmapError);
            clearSuccess();
        }
    }, [success, heatmapError, clearSuccess]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedWebsite?._id && pageUrl) {
            setSubmittedUrl(pageUrl);
            fetchHeatmapData(selectedWebsite._id, pageUrl);
        } else {
            toast.error("Please select a website and enter a page URL.");
        }
    };

    // For the iframe, we need to ensure the URL is absolute
    const formattedUrl = (url: string) => {
        if (!url) return '';
        // Check if it's already an absolute URL
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        // If it's a relative path, prepend the selected website's domain
        if (selectedWebsite?.domain) {
            let domain = selectedWebsite.domain;
            // Ensure domain starts with http(s)://
            if (!(domain.startsWith('http://') || domain.startsWith('https://'))) {
                domain = `https://${domain}`; // Default to https
            }
            // Remove trailing slash from domain, add leading slash to path if missing
            const base = domain.endsWith('/') ? domain.slice(0, -1) : domain;
            const path = url.startsWith('/') ? url : `/${url}`;
            return `${base}${path}`;
        }
        return ''; // Fallback if no selected website or domain
    };
    
    // Define dimensions for the iframe and heatmap
    const iframeWidth = 1024;
    const iframeHeight = 768;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Visual Intent Heatmaps</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Select a Page to Analyze</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-center">
                        <Select onValueChange={(value) => selectedWebsite?._id && setHeatmapType(value)} value={heatmapType}>
                            <SelectTrigger className="w-full md:w-[150px]">
                                <SelectValue placeholder="Map Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="click">Click Map</SelectItem>
                                <SelectItem value="scroll">Scroll Map</SelectItem>
                                <SelectItem value="confusion">Confusion Zones</SelectItem>
                            </SelectContent>
                        </Select>

                        <Input
                            type="text" // Changed to text to allow relative paths like /about
                            placeholder="Enter page URL (e.g., /about or https://example.com/about)"
                            value={pageUrl}
                            onChange={(e) => setPageUrl(e.target.value)}
                            className="w-full md:flex-1"
                            required
                        />

                        <Button type="submit" disabled={isLoadingHeatmap || !selectedWebsite?._id || !pageUrl}>
                            {isLoadingHeatmap ? 'Loading...' : 'Generate Heatmap'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {heatmapError && (
                <Alert variant="destructive">
                    <AlertDescription>{heatmapError}</AlertDescription>
                </Alert>
            )}

            {isLoadingHeatmap && submittedUrl && (
                 <Card>
                    <CardContent className="pt-6">
                        <div className="relative" style={{ width: `${iframeWidth}px`, height: `${iframeHeight}px` }}>
                            <Skeleton className="w-full h-full" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {!isLoadingHeatmap && submittedUrl && heatmapData && (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {heatmapType === 'click' ? 'Click Heatmap' : heatmapType === 'scroll' ? 'Scroll Map' : 'Confusion Zones'} for:{' '}
                            <a href={formattedUrl(submittedUrl)} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                {submittedUrl}
                            </a>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center items-start overflow-auto">
                        {heatmapType === 'click' && heatmapData.clicks.length > 0 && (
                            <div className="relative bg-gray-200" style={{ width: `${iframeWidth}px`, height: `${iframeHeight}px` }}>
                                <iframe
                                    src={formattedUrl(submittedUrl)}
                                    width={iframeWidth}
                                    height={iframeHeight}
                                    title="Website Page"
                                    className="absolute top-0 left-0 border-0 pointer-events-none" // Disable iframe interaction
                                />
                                <Heatmap data={heatmapData.clicks} width={iframeWidth} height={iframeHeight} />
                            </div>
                        )}

                        {heatmapType === 'scroll' && (
                            <div className="w-full space-y-4">
                                <h3 className="text-lg font-semibold">Scroll Depth Analysis</h3>
                                {heatmapData.scrollDepth.maxScrollDepth > 0 ? (
                                    <div className="space-y-2">
                                        <p><strong>Average Scroll Depth:</strong> {(heatmapData.scrollDepth.avgScrollDepth * 100).toFixed(0)}%</p>
                                        <p><strong>Maximum Scroll Depth:</strong> {(heatmapData.scrollDepth.maxScrollDepth * 100).toFixed(0)}%</p>
                                        <div className="flex items-center gap-2">
                                            <Progress value={heatmapData.scrollDepth.avgScrollDepth * 100} className="w-full" />
                                            <span>{(heatmapData.scrollDepth.avgScrollDepth * 100).toFixed(0)}%</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Represents how far down users typically scroll on this page.
                                        </p>
                                    </div>
                                ) : (
                                    <EmptyState
                                        icon={TrendingUp}
                                        title="No scroll data"
                                        description="No scroll data collected for this page yet."
                                    />
                                )}
                            </div>
                        )}

                        {heatmapType === 'confusion' && (
                            <div className="w-full space-y-4">
                                <h3 className="text-lg font-semibold">Top Confusion Zones</h3>
                                {heatmapData.confusionZones.length > 0 ? (
                                    <ul className="space-y-2">
                                        {heatmapData.confusionZones.map((zone, index) => (
                                            <li key={index} className="flex items-center gap-2 p-2 border rounded-md">
                                                <Lightbulb className="h-4 w-4 text-orange-500" />
                                                <div>
                                                    <p className="font-medium">{zone.element}</p>
                                                    <p className="text-sm text-muted-foreground">Avg. Hover Time: {zone.avgHoverTime}s | Score: {zone.confusionScore}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <EmptyState
                                        icon={Lightbulb}
                                        title="No confusion zones"
                                        description="No significant confusion zones detected for this page yet."
                                    />
                                )}
                            </div>
                        )}

                        {!heatmapData.clicks.length && !heatmapData.scrollDepth.maxScrollDepth && !heatmapData.confusionZones.length && (
                             <Card>
                                <CardContent className="pt-6">
                                    <EmptyState
                                        icon={MousePointerClick}
                                        title="No heatmap data"
                                        description="No data found for this URL. Ensure the tracking script is installed and events are being collected."
                                    />
                                </CardContent>
                            </Card>
                        )}
                    </CardContent>
                </Card>
            )}
            
            {!isLoadingHeatmap && submittedUrl && !heatmapData && !heatmapError && (
                 <Card>
                    <CardContent className="pt-6">
                        <EmptyState
                            icon={MousePointerClick}
                            title="No heatmap data"
                            description="No data found for this URL. Ensure the tracking script is installed and events are being collected."
                        />
                    </CardContent>
                </Card>
            )}

        </div>
    );
}