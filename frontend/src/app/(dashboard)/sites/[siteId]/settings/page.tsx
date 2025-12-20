'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Save, Trash2, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useSites } from '@/hooks/useSites'
import { toast } from 'react-hot-toast'

export default function SettingsPage() {
    const params = useParams()
    const router = useRouter()
    const siteId = params.siteId as string
    const { currentSite, fetchSite, updateSite, deleteSite } = useSites()
    const [formData, setFormData] = useState({
        name: '',
        domain: '',
        cookielessMode: false,
        botFilterEnabled: true,
        privacyMode: 'standard',
        dataRetentionDays: 90,
        status: 'active'
    })
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (siteId) {
            fetchSite(siteId)
        }
    }, [siteId])

    useEffect(() => {
        if (currentSite) {
            setFormData({
                name: currentSite.name,
                domain: currentSite.domain,
                cookielessMode: currentSite.settings.cookielessMode,
                botFilterEnabled: currentSite.settings.botFilterEnabled,
                privacyMode: currentSite.settings.privacyMode,
                dataRetentionDays: currentSite.settings.dataRetentionDays,
                status: currentSite.status
            })
        }
    }, [currentSite])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)

        const success = await updateSite(siteId, {
            name: formData.name,
            domain: formData.domain,
            settings: {
                cookielessMode: formData.cookielessMode,
                botFilterEnabled: formData.botFilterEnabled,
                privacyMode: formData.privacyMode,
                dataRetentionDays: formData.dataRetentionDays
            },
            status: formData.status
        })

        setIsSaving(false)
    }

    const handleDelete = async () => {
        const confirmText = 'আপনি কি সত্যিই এই site মুছে ফেলতে চান? এটি পুনরুদ্ধার করা যাবে না।'
        const confirmation = prompt(confirmText + '\n\nনিশ্চিত করতে site name টাইপ করুন:')

        if (confirmation === currentSite?.name) {
            const success = await deleteSite(siteId)
            if (success) {
                router.push('/sites')
            }
        } else if (confirmation !== null) {
            toast.error('Site name মিলেনি')
        }
    }

    if (!currentSite) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-2">
                    {currentSite.name} এর configuration manage করুন
                </p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Basic Information */}
                <Card title="Basic Information">
                    <div className="space-y-4">
                        <Input
                            label="Site Name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />

                        <Input
                            label="Domain"
                            type="text"
                            required
                            value={formData.domain}
                            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                        />

                        <Select
                            label="Status"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            options={[
                                { value: 'active', label: 'Active' },
                                { value: 'inactive', label: 'Inactive' },
                                { value: 'suspended', label: 'Suspended' }
                            ]}
                        />
                    </div>
                </Card>

                {/* Privacy Settings */}
                <Card title="Privacy Settings">
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="cookielessMode"
                                checked={formData.cookielessMode}
                                onChange={(e) => setFormData({ ...formData, cookielessMode: e.target.checked })}
                                className="mt-1"
                            />
                            <div>
                                <label htmlFor="cookielessMode" className="font-medium text-gray-900 cursor-pointer">
                                    Cookieless Mode
                                </label>
                                <p className="text-sm text-gray-600">
                                    Cookie ছাড়া tracking করুন (GDPR-friendly)
                                </p>
                            </div>
                        </div>

                        <Select
                            label="Privacy Mode"
                            value={formData.privacyMode}
                            onChange={(e) => setFormData({ ...formData, privacyMode: e.target.value })}
                            options={[
                                { value: 'standard', label: 'Standard' },
                                { value: 'strict', label: 'Strict (Maximum Privacy)' }
                            ]}
                        />

                        <Input
                            label="Data Retention Days"
                            type="number"
                            min="1"
                            max="365"
                            value={formData.dataRetentionDays}
                            onChange={(e) => setFormData({ ...formData, dataRetentionDays: parseInt(e.target.value) })}
                        />
                    </div>
                </Card>

                {/* Security Settings */}
                <Card title="Security Settings">
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="botFilterEnabled"
                                checked={formData.botFilterEnabled}
                                onChange={(e) => setFormData({ ...formData, botFilterEnabled: e.target.checked })}
                                className="mt-1"
                            />
                            <div>
                                <label htmlFor="botFilterEnabled" className="font-medium text-gray-900 cursor-pointer">
                                    Bot Detection
                                </label>
                                <p className="text-sm text-gray-600">
                                    স্বয়ংক্রিয়ভাবে bot traffic filter করুন
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end">
                    <Button type="submit" isLoading={isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                    </Button>
                </div>
            </form>

            {/* Danger Zone */}
            <Card>
                <div className="border-2 border-red-200 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-red-900 mb-2">
                                Danger Zone
                            </h3>
                            <p className="text-sm text-red-700 mb-4">
                                সাবধান! এই site মুছে ফেললে সব data, variants, এবং analytics হারিয়ে যাবে। এটি পুনরুদ্ধার করা যাবে না।
                            </p>
                            <Button
                                variant="danger"
                                onClick={handleDelete}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Site
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}