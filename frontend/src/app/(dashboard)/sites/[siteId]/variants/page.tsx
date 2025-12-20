'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Edit, Trash2, Play, Pause, Eye } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useVariants } from '@/hooks/useVariants'
import { useSites } from '@/hooks/useSites'
import { formatNumber, formatPercentage } from '@/lib/utils'

export default function VariantsPage() {
    const params = useParams()
    const siteId = params.siteId as string
    const { variants, fetchVariants, createVariant, deleteVariant, updateVariantStatus, isLoading } = useVariants()
    const { currentSite, fetchSite } = useSites()
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
    const [previewVariant, setPreviewVariant] = useState<any>(null)
    const [formData, setFormData] = useState({
        name: '',
        key: '',
        description: '',
        headline: '',
        subheadline: '',
        ctaText: '',
        ctaColor: '#3B82F6',
        layout: 'centered'
    })

    useEffect(() => {
        if (siteId) {
            fetchSite(siteId)
            fetchVariants(siteId)
        }
    }, [siteId])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()

        const variantData = {
            name: formData.name,
            key: formData.key,
            description: formData.description,
            content: {
                headline: formData.headline,
                subheadline: formData.subheadline,
                ctaText: formData.ctaText,
                ctaColor: formData.ctaColor,
                layout: formData.layout as any
            }
        }

        const newVariant = await createVariant(siteId, variantData)

        if (newVariant) {
            setIsCreateModalOpen(false)
            setFormData({
                name: '',
                key: '',
                description: '',
                headline: '',
                subheadline: '',
                ctaText: '',
                ctaColor: '#3B82F6',
                layout: 'centered'
            })
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm('আপনি কি নিশ্চিত এই variant delete করতে চান?')) {
            await deleteVariant(id)
        }
    }

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'paused' : 'active'
        await updateVariantStatus(id, newStatus)
    }

    const handlePreview = (variant: any) => {
        setPreviewVariant(variant)
        setIsPreviewModalOpen(true)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Variants</h1>
                    <p className="text-gray-600 mt-2">
                        {currentSite?.name} এর জন্য content variants
                    </p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Variant
                </Button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
                </div>
            ) : variants.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            No variants yet
                        </h3>
                        <p className="text-gray-600 mb-6">
                            প্রথম variant তৈরি করে শুরু করুন
                        </p>
                        <Button onClick={() => setIsCreateModalOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create First Variant
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="space-y-4">
                    {variants.map((variant) => (
                        <Card key={variant._id}>
                            <div className="flex items-start gap-6">
                                {/* Preview */}
                                <div
                                    className="w-48 h-32 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                                    onClick={() => handlePreview(variant)}
                                >
                                    <div className="text-center p-4">
                                        <h4 className="font-semibold text-sm mb-1">
                                            {variant.content.headline || 'No headline'}
                                        </h4>
                                        <p className="text-xs text-gray-600 mb-2">
                                            {variant.content.subheadline || 'No subheadline'}
                                        </p>
                                        <button
                                            className="px-3 py-1 text-xs rounded"
                                            style={{ backgroundColor: variant.content.ctaColor }}
                                        >
                                            {variant.content.ctaText || 'CTA'}
                                        </button>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {variant.name}
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Key: <code className="bg-gray-100 px-2 py-1 rounded">{variant.key}</code>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className={`
                        px-3 py-1 rounded text-sm font-medium
                        ${variant.status === 'active' ? 'bg-green-100 text-green-800' :
                                                    variant.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'}
                      `}>
                                                {variant.status}
                                            </div>
                                            {variant.isControl && (
                                                <div className="px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800">
                                                    Control
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {variant.description && (
                                        <p className="text-sm text-gray-600 mb-3">
                                            {variant.description}
                                        </p>
                                    )}

                                    {/* Metrics */}
                                    <div className="grid grid-cols-4 gap-4 mb-4">
                                        <div>
                                            <p className="text-xs text-gray-600">Impressions</p>
                                            <p className="text-lg font-semibold text-gray-900">
                                                {formatNumber(variant.metrics.impressions)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600">Clicks</p>
                                            <p className="text-lg font-semibold text-gray-900">
                                                {formatNumber(variant.metrics.clicks)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600">Conversions</p>
                                            <p className="text-lg font-semibold text-gray-900">
                                                {formatNumber(variant.metrics.conversions)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600">CVR</p>
                                            <p className="text-lg font-semibold text-gray-900">
                                                {formatPercentage(variant.metrics.conversionRate)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handlePreview(variant)}
                                        >
                                            <Eye className="w-4 h-4 mr-1" />
                                            Preview
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleToggleStatus(variant._id, variant.status)}
                                        >
                                            {variant.status === 'active' ? (
                                                <>
                                                    <Pause className="w-4 h-4 mr-1" />
                                                    Pause
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="w-4 h-4 mr-1" />
                                                    Activate
                                                </>
                                            )}
                                        </Button>

                                        {!variant.isControl && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDelete(variant._id)}
                                                className="text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4 mr-1" />
                                                Delete
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Variant Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New Variant"
                size="lg"
            >
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Variant Name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="High Intent Hero"
                        />

                        <Input
                            label="Variant Key"
                            type="text"
                            required
                            value={formData.key}
                            onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                            placeholder="high_intent"
                        />
                    </div>

                    <Input
                        label="Description (optional)"
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="For visitors with high purchase intent"
                    />

                    <hr className="my-4" />

                    <h4 className="font-semibold text-gray-900">Content</h4>

                    <Input
                        label="Headline"
                        type="text"
                        required
                        value={formData.headline}
                        onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                        placeholder="Limited Time Offer"
                    />

                    <Input
                        label="Subheadline"
                        type="text"
                        required
                        value={formData.subheadline}
                        onChange={(e) => setFormData({ ...formData, subheadline: e.target.value })}
                        placeholder="Get 30% off your first purchase"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="CTA Text"
                            type="text"
                            required
                            value={formData.ctaText}
                            onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                            placeholder="Claim Discount"
                        />

                        <Input
                            label="CTA Color"
                            type="color"
                            required
                            value={formData.ctaColor}
                            onChange={(e) => setFormData({ ...formData, ctaColor: e.target.value })}
                        />
                    </div>

                    <Select
                        label="Layout"
                        value={formData.layout}
                        onChange={(e) => setFormData({ ...formData, layout: e.target.value })}
                        options={[
                            { value: 'centered', label: 'Centered' },
                            { value: 'left', label: 'Left Aligned' },
                            { value: 'right', label: 'Right Aligned' },
                            { value: 'split', label: 'Split Screen' }
                        ]}
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
                            Create Variant
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Preview Modal */}
            <Modal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                title="Variant Preview"
                size="xl"
            >
                {previewVariant && (
                    <div className="space-y-6">
                        <div className="bg-gray-50 rounded-lg p-8">
                            <div className={`
                ${previewVariant.content.layout === 'centered' ? 'text-center' : ''}
                ${previewVariant.content.layout === 'left' ? 'text-left' : ''}
                ${previewVariant.content.layout === 'right' ? 'text-right' : ''}
              `}>
                                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                                    {previewVariant.content.headline}
                                </h1>
                                <p className="text-xl text-gray-600 mb-6">
                                    {previewVariant.content.subheadline}
                                </p>
                                <button
                                    className="px-6 py-3 rounded-lg text-white font-medium"
                                    style={{ backgroundColor: previewVariant.content.ctaColor }}
                                >
                                    {previewVariant.content.ctaText}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Layout</p>
                                <p className="font-medium">{previewVariant.content.layout}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-1">CTA Color</p>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-6 h-6 rounded border"
                                        style={{ backgroundColor: previewVariant.content.ctaColor }}
                                    />
                                    <code className="text-sm">{previewVariant.content.ctaColor}</code>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}