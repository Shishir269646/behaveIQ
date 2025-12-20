import { Variant } from '@/types/variant'
import { Modal } from '@/components/ui/Modal'

interface VariantPreviewProps {
    variant: Variant | null
    isOpen: boolean
    onClose: () => void
}

export function VariantPreview({ variant, isOpen, onClose }: VariantPreviewProps) {
    if (!variant) return null

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Variant Preview"
            size="xl"
        >
            <div className="space-y-6">
                {/* Preview */}
                <div className="bg-gray-50 rounded-lg p-8">
                    <div className={`
            ${variant.content.layout === 'centered' ? 'text-center' : ''}
            ${variant.content.layout === 'left' ? 'text-left' : ''}
            ${variant.content.layout === 'right' ? 'text-right' : ''}
          `}>
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            {variant.content.headline}
                        </h1>
                        <p className="text-xl text-gray-600 mb-6">
                            {variant.content.subheadline}
                        </p>
                        <button
                            className="px-6 py-3 rounded-lg text-white font-medium"
                            style={{ backgroundColor: variant.content.ctaColor }}
                        >
                            {variant.content.ctaText}
                        </button>
                    </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Layout</p>
                        <p className="font-medium capitalize">{variant.content.layout}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 mb-1">CTA Color</p>
                        <div className="flex items-center gap-2">
                            <div
                                className="w-6 h-6 rounded border"
                                style={{ backgroundColor: variant.content.ctaColor }}
                            />
                            <code className="text-sm">{variant.content.ctaColor}</code>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    )
}