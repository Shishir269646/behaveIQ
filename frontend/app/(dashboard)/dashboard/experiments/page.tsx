// src/app/(dashboard)/dashboard/experiments/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useWebsites } from '@/hooks/useWebsites';
import { useExperiments } from '@/hooks/useExperiments';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, Play, Pause, CheckCircle } from 'lucide-react';

export default function ExperimentsPage() {
    const { websites } = useWebsites();
    const [selectedWebsite, setSelectedWebsite] = useState<string | null>(
        websites[0]?._id || null
    );
    const { experiments, loading, fetchExperiments, updateExperimentStatus } = useExperiments();

    useEffect(() => {
        if (selectedWebsite) {
            fetchExperiments(selectedWebsite);
        }
    }, [selectedWebsite, fetchExperiments]);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Experiments</h1>
                    <p className="text-gray-500">A/B testing made easy</p>
                </div>

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
            </div>

            {experiments.length === 0 ? (
                <EmptyState
                    icon={FlaskConical}
                    title="No experiments yet"
                    description="Create your first experiment to start testing variations."
                />
            ) : (
                <div className="space-y-4">
                    {experiments.map((exp) => (
                        <Card key={exp._id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>{exp.name}</CardTitle>
                                    <Badge>{exp.status}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500 mb-4">{exp.description}</p>

                                <div className="grid grid-cols-3 gap-4">
                                    {exp.variations.map((variation) => (
                                        <div key={variation.name} className="border rounded p-4">
                                            <p className="font-medium">{variation.name}</p>
                                            <p className="text-2xl font-bold">{variation.conversionRate}%</p>
                                            <p className="text-xs text-gray-500">{variation.visitors} visitors</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 flex gap-2">
                                    {exp.status === 'active' && (
                                        <Button size="sm" onClick={() => updateExperimentStatus(exp._id, 'paused')}>
                                            <Pause className="w-4 h-4 mr-2" />
                                            Pause
                                        </Button>
                                    )}
                                    {exp.status === 'paused' && (
                                        <Button size="sm" onClick={() => updateExperimentStatus(exp._id, 'active')}>
                                            <Play className="w-4 h-4 mr-2" />
                                            Resume
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}