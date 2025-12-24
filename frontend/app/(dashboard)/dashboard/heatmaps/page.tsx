"use client";

import React, { useState, useEffect } from 'react';
import { useWebsites } from '@/hooks/useWebsites';
import { useHeatmap } from '@/hooks/useHeatmap';
import Heatmap from '@/components/ui/heatmap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'react-hot-toast';

export default function HeatmapPage() {
    const { websites, loading: isLoadingWebsites } = useWebsites();
    const { data: heatmapData, loading: isLoadingHeatmap, error: heatmapError, success, fetchHeatmapData, clearSuccess } = useHeatmap();

    const [selectedWebsite, setSelectedWebsite] = useState('');
    const [pageUrl, setPageUrl] = useState('');
    const [submittedUrl, setSubmittedUrl] = useState('');

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
        if (selectedWebsite && pageUrl) {
            setSubmittedUrl(pageUrl);
            fetchHeatmapData(selectedWebsite, pageUrl);
        }
    };

    // For the iframe, we need to ensure the URL is absolute
    const formattedUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        return `http://${url}`;
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
                        <Select onValueChange={setSelectedWebsite} value={selectedWebsite} disabled={isLoadingWebsites}>
                            <SelectTrigger className="w-full md:w-[250px]">
                                <SelectValue placeholder="Select a website..." />
                            </SelectTrigger>
                            <SelectContent>
                                {websites.map((site) => (
                                    <SelectItem key={site._id} value={site._id}>
                                        {site.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Input
                            type="url"
                            placeholder="Enter page URL (e.g., /about)"
                            value={pageUrl}
                            onChange={(e) => setPageUrl(e.target.value)}
                            className="w-full md:flex-1"
                            required
                        />

                        <Button type="submit" disabled={isLoadingHeatmap || !selectedWebsite || !pageUrl}>
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

            {isLoadingHeatmap && (
                 <Card>
                    <CardContent className="pt-6">
                        <div className="relative" style={{ width: `${iframeWidth}px`, height: `${iframeHeight}px` }}>
                            <Skeleton className="w-full h-full" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {!isLoadingHeatmap && submittedUrl && heatmapData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Heatmap for: <a href={formattedUrl(submittedUrl)} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{submittedUrl}</a></CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center items-center overflow-auto">
                        <div className="relative bg-gray-200" style={{ width: `${iframeWidth}px`, height: `${iframeHeight}px` }}>
                            <iframe
                                src={formattedUrl(submittedUrl)}
                                width={iframeWidth}
                                height={iframeHeight}
                                title="Website Page"
                                className="absolute top-0 left-0 border-0"
                                // sandbox attribute can improve security but may break some sites
                                // sandbox="allow-same-origin allow-scripts" 
                            />
                            <Heatmap data={heatmapData} width={iframeWidth} height={iframeHeight} />
                        </div>
                    </CardContent>
                </Card>
            )}
            
            {!isLoadingHeatmap && submittedUrl && heatmapData.length === 0 && !heatmapError && (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-gray-500">No click data found for this URL. Ensure the tracking script is installed and events are being collected.</p>
                    </CardContent>
                </Card>
            )}

        </div>
    );
}