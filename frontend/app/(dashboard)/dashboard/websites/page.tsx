'use client';

import Link from 'next/link';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWebsites } from '@/hooks/useWebsites';
import { EmptyState } from '@/components/EmptyState';
import { formatDate, getStatusColor, copyToClipboard, cn } from '@/lib/utils';
import { Globe, Plus, Copy, Settings, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { Website } from '@/types'; // Import Website type

export default function WebsitesPage() {
    const { websites, loading, createWebsite, deleteWebsite, success, clearSuccess, fetchWebsites, selectedWebsite, selectWebsite } = useWebsites();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [websiteToDeleteId, setWebsiteToDeleteId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        domain: '', // Changed from url to domain
        industry: '',
    });
    const [sdkScript, setSdkScript] = useState<string | null>(null);
    const [isSdkScriptLoading, setIsSdkScriptLoading] = useState(false);

    useEffect(() => {
        if (!selectedWebsite && websites.length > 0) {
            selectWebsite(websites[0]._id);
        }
    }, [websites, selectedWebsite, selectWebsite]);

    useEffect(() => {
        if (success) {
            toast.success(success);
            clearSuccess();
        }
    }, [success, clearSuccess]);

    const handleCreate = async (): Promise<void> => {
        if (!formData.name || !formData.domain) {
            toast.error("Name and Domain are required.");
            return;
        }
        await createWebsite({ name: formData.name, domain: formData.domain });
        setIsCreateOpen(false);
        setFormData({ name: '', domain: '', industry: '' });
    };

    const handleDelete = async (): Promise<void> => {
        if (websiteToDeleteId) {
            await deleteWebsite(websiteToDeleteId);
            setIsDeleteOpen(false);
            setWebsiteToDeleteId(null);
        }
    };

    const handleCopyApiKey = (apiKey: string) => {
        copyToClipboard(apiKey);
        toast.success('API Key copied!');
    };

    const handleCopySdkScript = () => {
        if (sdkScript) {
            copyToClipboard(sdkScript);
            toast.success('SDK Script copied!');
        }
    };

    const fetchSdkScript = async (websiteId: string) => {
        setIsSdkScriptLoading(true);
        try {
            const response = await api.get(`/websites/${websiteId}/sdk-script`);
            setSdkScript(response.data.data.script);
        } catch (err: any) {
            toast.error(err.response?.data?.message || err.message || "Failed to fetch SDK script.");
            setSdkScript(null);
        } finally {
            setIsSdkScriptLoading(false);
        }
    };

    useEffect(() => {
        if (selectedWebsite?._id) {
            fetchSdkScript(selectedWebsite._id);
        }
    }, [selectedWebsite?._id]);


    if (loading) {
        return <div>Loading websites...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Websites</h1>
                    <p className="text-gray-500">Manage your tracked websites</p>
                </div>

                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Website
                </Button>
            </div>

            {websites.length === 0 ? (
                <EmptyState
                    icon={Globe}
                    title="No websites yet"
                    description="Create your first website to start tracking visitors and personalizing content."
                    actionLabel="Add Website"
                    onAction={() => setIsCreateOpen(true)}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {websites.map((website: Website) => (
                        <Card key={website._id} className={cn(selectedWebsite?._id === website._id && "border-primary ring-2 ring-primary/50")}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">{website.name}</CardTitle>
                                        <p className="text-sm text-gray-500 mt-1">{website.domain}</p>
                                    </div>

                                    <Badge className={getStatusColor(website.status)}>
                                        {website.status}
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-xs text-gray-500">Sessions</p>
                                        <p className="font-semibold">{website.stats.totalSessions}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Events</p>
                                        <p className="font-semibold">{website.stats.totalEvents}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Personas</p>
                                        <p className="font-semibold">{website.stats.totalPersonas}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500 mb-1">API Key</p>
                                    <div className="flex gap-2">
                                        <code className="flex-1 p-2 bg-gray-50 rounded text-xs overflow-hidden text-ellipsis">
                                            {website.apiKey}
                                        </code>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleCopyApiKey(website.apiKey)}
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                {selectedWebsite?._id === website._id && sdkScript && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">SDK Script</p>
                                        <div className="flex gap-2">
                                            <Textarea
                                                readOnly
                                                value={sdkScript || "Loading SDK script..."}
                                                rows={5}
                                                className="flex-1 text-xs"
                                            />
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handleCopySdkScript}
                                                disabled={!sdkScript}
                                            >
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <Link href={`/settings?websiteId=${website._id}`} passHref>
                                        <Button size="sm" variant="outline" className="flex-1">
                                            <Settings className="w-4 h-4 mr-2" />
                                            View Details
                                        </Button>
                                    </Link>

                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => {
                                            setWebsiteToDeleteId(website._id);
                                            setIsDeleteOpen(true);
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>

                                <p className="text-xs text-gray-400">
                                    Created {formatDate(website.createdAt)}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Website</DialogTitle>
                        <DialogDescription>
                            Create a new website to start tracking and personalizing
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="name">Website Name</Label>
                            <Input
                                id="name"
                                placeholder="My Awesome Site"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                                <div>
                                    <Label htmlFor="domain">Domain</Label>
                                    <Input
                                        id="domain"
                                        placeholder="https://example.com"
                                        value={formData.domain}
                                        onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                                    />
                                </div>
                        <div>
                            <Label htmlFor="industry">Industry (Optional)</Label>
                            <Input
                                id="industry"
                                placeholder="E-commerce"
                                value={formData.industry}
                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={loading}>Create Website</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Website</DialogTitle>
                        <DialogDescription>
                            Are you sure? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
