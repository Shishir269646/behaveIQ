'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWebsites } from '@/hooks/useWebsites';
import { EmptyState } from '@/components/EmptyState';
import { formatDate, getStatusColor, copyToClipboard } from '@/lib/utils';
import { Globe, Plus, Copy, Settings, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function WebsitesPage() {
    const { websites, loading, createWebsite, deleteWebsite, success, clearSuccess, fetchWebsites } = useWebsites();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedWebsite, setSelectedWebsite] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        domain: '',
        industry: '',
        defaultMessage: '',
    });

    useEffect(() => {

        if (!websites || websites.length === 0) {
            fetchWebsites();
        }
    }, [fetchWebsites, websites]);

    useEffect(() => {
        if (success) {
            toast.success(success);
            clearSuccess();
        }
    }, [success, clearSuccess]);

    const handleCreate = async () => {
        await createWebsite(formData, formData.defaultMessage);
        setIsCreateOpen(false);
        setFormData({ name: '', domain: '', industry: '', defaultMessage: '' });
    };

    const handleDelete = async () => {
        if (selectedWebsite) {
            await deleteWebsite(selectedWebsite);
            setIsDeleteOpen(false);
            setSelectedWebsite(null);
        }
    };

    const handleCopyApiKey = (apiKey: string) => {
        copyToClipboard(apiKey);
        toast.success('API Key copied!');
    };

    if (loading) {
        return <div>Loading...</div>;
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
                    {websites.map((website) => (
                        <Card key={website._id}>
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

                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" className="flex-1">
                                        <Settings className="w-4 h-4 mr-2" />
                                        Settings
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => {
                                            setSelectedWebsite(website._id);
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

                        <div>
                            <Label htmlFor="defaultMessage">Default Message (Optional)</Label>
                            <Input
                                id="defaultMessage"
                                placeholder="Welcome to our site!"
                                value={formData.defaultMessage}
                                onChange={(e) => setFormData({ ...formData, defaultMessage: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate}>Create Website</Button>
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
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
