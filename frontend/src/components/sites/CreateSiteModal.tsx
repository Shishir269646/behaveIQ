import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface CreateSiteModalProps {
    isOpen: boolean
    onClose: () => void
    onCreate: (data: { name: string; domain: string }) => Promise<void>
}

export function CreateSiteModal({ isOpen, onClose, onCreate }: CreateSiteModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        domain: ''
    })
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            await onCreate(formData)
            setFormData({ name: '', domain: '' })
            onClose()
        } catch (error) {
            console.error('Failed to create site')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create New Site"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Site Name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="My Awesome Website"
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
                        onClick={onClose}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="flex-1"
                        isLoading={isLoading}
                    >
                        Create Site
                    </Button>
                </div>
            </form>
        </Modal>
    )
}