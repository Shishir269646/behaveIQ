import { Eye, Edit, Trash2, Play, Pause } from 'lucide-react'
import { Variant } from '@/types/variant'
import { formatNumber, formatPercentage } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface VariantCardProps {
    variant: Variant
    onPreview?: (variant: Variant) => void
    onEdit?: (variant: Variant) => void
    onDelete?: (id: string) => void
    onToggleStatus?: (id: string, currentStatus: string) => void
}

export function VariantCard({
    variant,
    onPreview,
    onEdit,
    onDelete,
    onToggleStatus
}: VariantCardProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-6">
                {/* Preview */}
                <div
                    className="w-48 h-32 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => onPreview?.(variant)}
                >
                    <div className="text-center p-4">
                        <h4 className="font-semibold text-sm mb-1 text-gray-900">
                            {variant.content.headline}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2">
                            {variant.content.subheadline}
                        </p>
                        <button
                            className="px-3 py-1 text-xs text-white rounded"
                            style={{ backgroundColor: variant.content.ctaColor }}
                        >
                            {variant.content.ctaText}
                        </button>
                    </div>
                </div>

                {/* Details */}
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
                            onClick={() => onPreview?.(variant)}
                        >
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                        </Button>

                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onToggleStatus?.(variant._id, variant.status)}
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

                        {onEdit && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onEdit(variant)}
                            >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                            </Button>
                        )}

                        {!variant.isControl && onDelete && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onDelete(variant._id)}
                                className="text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}