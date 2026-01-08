// src/app/(dashboard)/dashboard/experiments/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWebsites } from '@/hooks/useWebsites';
import { useExperiments } from '@/hooks/useExperiments';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, Play, Pause, CheckCircle, Plus, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/store';
import { toast } from "@/hooks/use-toast";
import { Experiment, Website } from '@/types'; // Import Experiment type and Website
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export default function ExperimentsPage() {
    const { websites } = useWebsites();

    const selectedWebsite = useAppStore((state) => state.website);
    const {
        experiments,
        isLoading,
        error,
        success,
        fetchExperiments,
        createExperiment,
        updateExperimentStatus,
        declareWinner,
        clearSuccess
    } = useExperiments();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newExperiment, setNewExperiment] = useState({
        name: '',
        description: '',
        targetUrl: '',
        conversionGoal: '',
        variations: [{ name: 'Control', isControl: true, trafficPercentage: 50, content: '', selector: '', contentType: 'text' }],
    });
    const [selectedExperimentForWinner, setSelectedExperimentForWinner] = useState<Experiment | null>(null);
    const [winningVariation, setWinningVariation] = useState('');

    useEffect(() => {
        if (selectedWebsite?._id) {
            fetchExperiments();
        }
    }, [selectedWebsite?._id, fetchExperiments]);

    useEffect(() => {
        if (success) {
            toast({
                title: "Success",
                description: success,
            });
            clearSuccess();
        }
        if (error) {
            toast({
                title: "Error",
                description: error,
                variant: "destructive",
            });
            clearSuccess();
        }
    }, [success, error, clearSuccess, toast]);

    const handleCreateExperiment = async () => {
        if (!selectedWebsite?._id) {
            toast({
                title: "Error",
                description: "Please select a website first.",
                variant: "destructive",
            });
            return;
        }
        if (newExperiment.variations.length < 2) {
             toast({
                title: "Error",
                description: "At least two variations are required.",
                variant: "destructive",
            });
            return;
        }
        // Ensure one control variation exists, if not, make the first one control by default
        if (!newExperiment.variations.some(v => v.isControl)) {
            newExperiment.variations[0].isControl = true;
        }
        const totalTraffic = newExperiment.variations.reduce((sum, v) => sum + (v.trafficPercentage || 0), 0);
        if (totalTraffic !== 100) {
            toast({
                title: "Error",
                description: "Total traffic percentage for variations must add up to 100%.",
                variant: "destructive",
            });
            return;
        }

        const dataToSend = {
            websiteId: selectedWebsite._id,
            name: newExperiment.name,
            description: newExperiment.description,
            status: 'draft' as Experiment['status'], // Explicitly cast to correct type
            variations: newExperiment.variations.map(v => ({
                name: v.name,
                isControl: v.isControl,
                trafficPercentage: v.trafficPercentage,
                content: v.content,
                selector: v.selector,
                contentType: v.contentType,
            })),
            settings: {
                targetUrl: newExperiment.targetUrl,
                conversionGoal: newExperiment.conversionGoal,
                minSampleSize: 100, // Default
                minConfidence: 95,  // Default
                maxDuration: 30,    // Default
            }
        };

        await createExperiment(dataToSend);
        setIsCreateOpen(false);
        setNewExperiment({
            name: '',
            description: '',
            targetUrl: '',
            conversionGoal: '',
            variations: [{ name: 'Control', isControl: true, trafficPercentage: 50, content: '', selector: '', contentType: 'text' }],
        });
    };

    const handleAddVariation = () => {
        setNewExperiment((prev) => ({
            ...prev,
            variations: [...prev.variations, { name: `Variation ${prev.variations.length}`, isControl: false, trafficPercentage: 0, content: '', selector: '', contentType: 'text' }],
        }));
    };

    const handleUpdateVariation = (index: number, field: string, value: any) => {
        const updatedVariations = [...newExperiment.variations];
        if (field === 'isControl') {
            // Ensure only one control
            updatedVariations.forEach(v => v.isControl = false);
            updatedVariations[index].isControl = value;
        } else {
            (updatedVariations[index] as any)[field] = value;
        }
        setNewExperiment((prev) => ({ ...prev, variations: updatedVariations }));
    };

    const handleRemoveVariation = (index: number) => {
        setNewExperiment((prev) => ({
            ...prev,
            variations: prev.variations.filter((_, i) => i !== index),
        }));
    };

    const getStatusBadgeVariant = (status: Experiment['status']) => {
        switch (status) {
            case 'active': return 'default';
            case 'completed': return 'secondary';
            case 'paused': return 'outline';
            case 'draft': return 'outline';
            default: return 'outline';
        }
    };

    if (isLoading) return <div>Loading experiments...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Auto-Pilot A/B Testing</h1>
                    <p className="text-gray-500">System runs experiments automatically and declares winners based on statistical significance.</p>
                </div>

                <div className="flex items-center gap-2">
                    <Select
                        value={selectedWebsite?._id || ''}
                        onValueChange={(value) => selectedWebsite?._id && fetchExperiments()} // Re-fetch when website changes
                        disabled={!selectedWebsite}
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
                    <Button onClick={() => setIsCreateOpen(true)} disabled={!selectedWebsite}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Experiment
                    </Button>
                </div>
            </div>

            {experiments.length === 0 ? (
                <EmptyState
                    icon={FlaskConical}
                    title="No experiments yet"
                    description="Create your first experiment to start testing variations."
                    actionLabel="Create Experiment"
                    onAction={() => setIsCreateOpen(true)}
                />
            ) : (
                <div className="space-y-4">
                    {experiments.map((exp) => (
                        <Card key={exp._id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">{exp.name}</CardTitle>
                                    <Badge variant={getStatusBadgeVariant(exp.status)}>{exp.status}</Badge>
                                </div>
                                <CardDescription className="text-sm">{exp.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">Goal: {exp.settings.conversionGoal} on {exp.settings.targetUrl}</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {exp.variations.map((variation) => (
                                        <div key={variation.name} className={cn("border rounded-lg p-4", variation.isControl && "border-primary bg-primary/10")}>
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="font-medium">{variation.name} {variation.isControl && "(Control)"}</p>
                                                <Badge variant="secondary">{variation.trafficPercentage}% Traffic</Badge>
                                            </div>
                                            <p className="text-2xl font-bold">{variation.conversionRate ? variation.conversionRate.toFixed(2) : 0}%</p>
                                            <p className="text-xs text-gray-500">{variation.visitors} visitors, {variation.conversions} conversions</p>
                                            {exp.results?.winner === variation.name && (
                                                <div className="flex items-center text-green-600 text-xs mt-2">
                                                    <CheckCircle className="h-4 w-4 mr-1" /> Winner!
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {exp.status === 'active' || exp.status === 'paused' ? (
                                    <div className="mt-4 flex gap-2">
                                        {exp.status === 'active' ? (
                                            <Button size="sm" onClick={() => updateExperimentStatus(exp._id, 'paused')}>
                                                <Pause className="w-4 h-4 mr-2" />
                                                Pause
                                            </Button>
                                        ) : (
                                            <Button size="sm" onClick={() => updateExperimentStatus(exp._id, 'active')}>
                                                <Play className="w-4 h-4 mr-2" />
                                                Resume
                                            </Button>
                                        )}
                                        <Button size="sm" variant="outline" onClick={() => { setSelectedExperimentForWinner(exp); setWinningVariation(exp.variations.find(v => v.isControl)?.name || ''); }}>
                                            Declare Winner
                                        </Button>
                                    </div>
                                ) : exp.results?.winner ? (
                                    <Alert className="mt-4">
                                        <AlertTitle>Experiment Concluded</AlertTitle>
                                        <AlertDescription>
                                            Winner: <strong>{exp.results.winner}</strong> with {exp.results.improvement?.toFixed(2)}% improvement and {exp.results.confidence?.toFixed(2)}% confidence.
                                        </AlertDescription>
                                    </Alert>
                                ) : null}
                                <div className="text-xs text-muted-foreground mt-2">
                                    Min Sample Size: {exp.settings.minSampleSize} | Min Confidence: {exp.settings.minConfidence}% | Max Duration: {exp.settings.maxDuration} days
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Experiment Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create New Experiment</DialogTitle>
                        <DialogDescription>
                            Set up your A/B test with different variations.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="exp-name">Experiment Name</Label>
                            <Input
                                id="exp-name"
                                value={newExperiment.name}
                                onChange={(e) => setNewExperiment({ ...newExperiment, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="exp-desc">Description</Label>
                            <Textarea
                                id="exp-desc"
                                value={newExperiment.description}
                                onChange={(e) => setNewExperiment({ ...newExperiment, description: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="exp-target-url">Target URL (e.g., /pricing)</Label>
                            <Input
                                id="exp-target-url"
                                value={newExperiment.targetUrl}
                                onChange={(e) => setNewExperiment({ ...newExperiment, targetUrl: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="exp-goal">Conversion Goal (e.g., purchase, signup)</Label>
                            <Input
                                id="exp-goal"
                                value={newExperiment.conversionGoal}
                                onChange={(e) => setNewExperiment({ ...newExperiment, conversionGoal: e.target.value })}
                            />
                        </div>

                        <h3 className="font-semibold mt-6 mb-2">Variations</h3>
                        {newExperiment.variations.map((variation, index) => (
                            <Card key={index} className="p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label>Variation {index + 1}</Label>
                                    <Button variant="destructive" size="sm" onClick={() => handleRemoveVariation(index)}>Remove</Button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Name</Label>
                                        <Input
                                            value={variation.name}
                                            onChange={(e) => handleUpdateVariation(index, 'name', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Traffic (%)</Label>
                                        <Input
                                            type="number"
                                            value={variation.trafficPercentage}
                                            onChange={(e) => handleUpdateVariation(index, 'trafficPercentage', parseInt(e.target.value))}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Content Type</Label>
                                    <Select value={variation.contentType} onValueChange={(value: 'text' | 'html' | 'css') => handleUpdateVariation(index, 'contentType', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select content type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="text">Text</SelectItem>
                                            <SelectItem value="html">HTML</SelectItem>
                                            <SelectItem value="css">CSS</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Selector (CSS Selector for element to modify)</Label>
                                    <Input
                                        value={variation.selector}
                                        onChange={(e) => handleUpdateVariation(index, 'selector', e.target.value)}
                                        placeholder=".hero-title"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Content</Label>
                                    <Textarea
                                        value={variation.content}
                                        onChange={(e) => handleUpdateVariation(index, 'content', e.target.value)}
                                        placeholder="New content for this variation"
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id={`control-${index}`}
                                        checked={variation.isControl}
                                        onChange={(e) => handleUpdateVariation(index, 'isControl', e.target.checked)}
                                    />
                                    <label htmlFor={`control-${index}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Is Control Group
                                    </label>
                                </div>
                            </Card>
                        ))}
                        <Button variant="outline" onClick={handleAddVariation} className="w-full">
                            Add Variation
                        </Button>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateExperiment} disabled={isLoading}>
                            Create Experiment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Declare Winner Dialog */}
            <Dialog open={!!selectedExperimentForWinner} onOpenChange={() => setSelectedExperimentForWinner(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Declare Winner for {selectedExperimentForWinner?.name}</DialogTitle>
                        <DialogDescription>
                            Manually declare a winning variation for this experiment.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="winning-variation">Winning Variation</Label>
                        <Select value={winningVariation} onValueChange={setWinningVariation}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select winning variation" />
                            </SelectTrigger>
                            <SelectContent>
                                {selectedExperimentForWinner?.variations.map((v) => (
                                    <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedExperimentForWinner(null)}>Cancel</Button>
                        <Button onClick={() => declareWinner(selectedExperimentForWinner?._id || '', winningVariation)} disabled={!winningVariation || isLoading}>Declare Winner</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}