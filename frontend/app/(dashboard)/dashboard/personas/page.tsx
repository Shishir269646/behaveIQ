'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PersonaCard } from '@/components/PersonaCard';
import { EmptyState } from '@/components/EmptyState';
import { useWebsites } from '@/hooks/useWebsites';
import { usePersonas } from '@/hooks/usePersonas';
import { Users, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PersonasPage() {
    const { websites } = useWebsites();
    const [selectedWebsite, setSelectedWebsite] = useState<string | null>(
        websites[0]?._id || null
    );
    const { personas, loading, error, success, fetchPersonas, discoverPersonas, clearSuccess } = usePersonas();

    useEffect(() => {
        if (selectedWebsite) {
            fetchPersonas(selectedWebsite);
        }
    }, [selectedWebsite, fetchPersonas]);

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
        await discoverPersonas(selectedWebsite || '');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Personas</h1>
                    <p className="text-gray-500">AI-discovered visitor types</p>
                </div>

                <div className="flex gap-4">
                    <Select value={selectedWebsite || ''} onValueChange={setSelectedWebsite}>
                        <SelectTrigger className="w-64">
                            <SelectValue placeholder="Select website" />
                        </SelectTrigger>
                        <SelectContent>
                            {websites.map((site) => (
                                <SelectItem key={site._id} value={site._id}>
                                    {site.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button onClick={handleDiscover} disabled={loading}>
                        <Sparkles className="w-4 h-4 mr-2" />
                        {loading ? 'Discovering...' : 'Discover Personas'}
                    </Button>
                </div>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : personas.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="No personas discovered yet"
                    description="Click 'Discover Personas' to let AI analyze your visitors and identify different user types."
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