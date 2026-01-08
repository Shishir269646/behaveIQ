'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PersonaCard } from '@/components/PersonaCard';
import { EmptyState } from '@/components/EmptyState';
import { useWebsites } from '@/hooks/useWebsites';
import { usePersonas } from '@/hooks/usePersonas'; // Updated hook import
import { Users, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Website } from '@/types'; // Correctly placed import


const PersonaGridSkeleton = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
        ))}
    </div>
);

export default function PersonasPage() {
    const { websites, selectedWebsite } = useWebsites();
    const { personas, isLoading, error, success, fetchData, discoverPersonas, clearSuccess } = usePersonas();

    // Use a local state to manage which website's personas are being viewed,
    // defaulting to the selectedWebsite from the global store.
    const [localSelectedWebsiteId, setLocalSelectedWebsiteId] = useState<string | undefined>(selectedWebsite?._id);

    // Update local state when global selectedWebsite changes
    useEffect(() => {
        setLocalSelectedWebsiteId(selectedWebsite?._id);
    }, [selectedWebsite?._id]);

    useEffect(() => {
        if (localSelectedWebsiteId) {
            fetchData(localSelectedWebsiteId);
        }
    }, [localSelectedWebsiteId, fetchData]);

    useEffect(() => {
        if (success) {
            toast.success(success);
            clearSuccess();
        }
        if (error) {
            toast.error(error);
            clearSuccess();
        }
    }, [success, error, clearSuccess]);

    const handleDiscover = async () => {
        if (localSelectedWebsiteId) {
            await discoverPersonas(localSelectedWebsiteId);
        } else {
            toast.error("Please select a website first.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Personas</h1>
                    <p className="text-gray-500">AI-discovered visitor types</p>
                </div>

                <div className="flex gap-4">


// ... existing code ...

                    <Select
                        value={localSelectedWebsiteId || ''}
                        onValueChange={setLocalSelectedWebsiteId}
                        disabled={websites.length === 0}
                    >
                        <SelectTrigger className="w-64">
                            <SelectValue placeholder="Select website" />
                        </SelectTrigger>
                        <SelectContent>
                            {websites.map((site: Website) => (
                                <SelectItem key={site._id} value={site._id}>
                                    {site.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button onClick={handleDiscover} disabled={isLoading || !localSelectedWebsiteId}>
                        <Sparkles className="w-4 h-4 mr-2" />
                        {isLoading ? 'Discovering...' : 'Discover Personas'}
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <PersonaGridSkeleton />
            ) : personas.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="No personas discovered yet"
                    description="Select a website and click 'Discover Personas' to let AI analyze your visitors and identify different user types."
                    actionLabel="Discover Personas"
                    onAction={handleDiscover}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {personas.map((persona) => (
                        <PersonaCard key={persona._id} persona={persona} />
                    ))}
                </div>
            )}
        </div>
    );
}