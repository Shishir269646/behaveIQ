
'use client'

import { useEffect, useState } from 'react'
import { Plus, Globe, Settings, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useSites } from '@/hooks/useSites'
import { formatNumber, formatDate } from '@/lib/utils'
import Link from 'next/link'

export default function SitesPage() {
    const { sites, fetchSites, createSite, deleteSite, isLoading } = useSites()
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        domain: ''
    })

    useEffect(() => {
        fetchSites()
    }, [])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()

        const newSite = await createSite(formData)

        if (newSite) {
            setIsCreateModalOpen(false)
            setFormData({ name: '', domain: '' })
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm('আপনি কি নিশ্চিত এই site delete করতে চান?')) {
            await deleteSite(id)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Sites</h1>
                    <p className="text-gray-600 mt-2">আপনার websites manage করুন</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Site
                </Button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
                </div>
            ) : sites.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            No sites yet
                        </h3>
                        <p className="text-gray-600 mb-6">
                            প্রথম site তৈরি করে শুরু করুন
                        </p>
                        <Button onClick={() => setIsCreateModalOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create First Site
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sites.map((site) => (
                        <Card key={site._id}>
                            <div className="space-y-4">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {site.name}
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-1">{site.domain}</p>
                                    </div>
                                    <div className={`
                    px-2 py-1 rounded text-xs font-medium
                    ${site.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                  `}>
                                        {site.status}
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-600">Visitors</p>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {formatNumber(site.stats.totalVisitors)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600">Conversions</p>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {formatNumber(site.stats.totalConversions)}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                                    <Link
                                        href={`/sites/${site._id}`}
                                        className="flex-1 px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors text-center"
                                    >
                                        View Details
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(site._id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Site Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New Site"
            >
                <form onSubmit={handleCreate} className="space-y-4">
                    <Input
                        label="Site Name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="My Awesome Site"
                    />

                    <Input
                        label="Domain"
                        type="text"
                        required
                        value={formData.domain}
                        onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                        placeholder="example.com"
                    />

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1">
                            Create Site
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}