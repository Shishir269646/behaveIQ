'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Copy, RefreshCw, Eye, Settings } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useSites } from '@/hooks/useSites'
import { sitesAPI } from '@/lib/api'
import { formatNumber, formatPercentage, copyToClipboard } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

export default function SiteDetailPage() {
    const params = useParams()
    const router = useRouter()
    const siteId = params.siteId as string
    const { currentSite, fetchSite } = useSites()
    const [keys, setKeys] = useState<any>(null)
    const [showKeys, setShowKeys] = useState(false)

    useEffect(() => {
        if (siteId) {
            fetchSite(siteId)
            loadKeys()
        }
    }, [siteId])

    const loadKeys = async () => {
        try {
            const response = await sitesAPI.getKeys(siteId)
            setKeys(response.data.data)
        } catch (error) {
            console.error('Failed to load keys')
        }
    }

    const handleRegenerateKey = async () => {
        if (!confirm('নতুন API key তৈরি করলে পুরনো key কাজ করবে না। নিশ্চিত?')) {
            return
        }

        try {
            const response = await sitesAPI.regenerateKey(siteId)
            setKeys(response.data.data)
            toast.success('নতুন API key তৈরি হয়েছে')
        } catch (error) {
            toast.error('Failed to regenerate key')
        }
    }

    const copyKey = (key: string, type: string) => {
        copyToClipboard(key)
        toast.success(`${type} copied!`)
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
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push('/sites')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900">{currentSite.name}</h1>
                    <p className="text-gray-600 mt-1">{currentSite.domain}</p>
                </div>
                <Link href={`/sites/${siteId}/settings`}>
                    <Button variant="secondary">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <div>
                        <p className="text-sm text-gray-600">Total Visitors</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                            {formatNumber(currentSite.stats.totalVisitors)}
                        </p>
                    </div>
                </Card>

                <Card>
                    <div>
                        <p className="text-sm text-gray-600">Total Events</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                            {formatNumber(currentSite.stats.totalEvents)}
                        </p>
                    </div>
                </Card>

                <Card>
                    <div>
                        <p className="text-sm text-gray-600">Conversions</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                            {formatNumber(currentSite.stats.totalConversions)}
                        </p>
                    </div>
                </Card>

                <Card>
                    <div>
                        <p className="text-sm text-gray-600">Conversion Rate</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                            {formatPercentage(currentSite.stats.conversionRate)}
                        </p>
                    </div>
                </Card>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href={`/sites/${siteId}/variants`}>
                    <Card className="hover:border-primary-300 transition-colors cursor-pointer">
                        <div className="text-center py-4">
                            <Eye className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                            <h3 className="font-semibold text-gray-900">Variants</h3>
                            <p className="text-sm text-gray-600 mt-1">Manage content variants</p>
                        </div>
                    </Card>
                </Link>

                <Link href={`/sites/${siteId}/analytics`}>
                    <Card className="hover:border-primary-300 transition-colors cursor-pointer">
                        <div className="text-center py-4">
                            <Eye className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                            <h3 className="font-semibold text-gray-900">Analytics</h3>
                            <p className="text-sm text-gray-600 mt-1">View detailed analytics</p>
                        </div>
                    </Card>
                </Link>

                <Link href={`/sites/${siteId}/settings`}>
                    <Card className="hover:border-primary-300 transition-colors cursor-pointer">
                        <div className="text-center py-4">
                            <Settings className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                            <h3 className="font-semibold text-gray-900">Settings</h3>
                            <p className="text-sm text-gray-600 mt-1">Configure site settings</p>
                        </div>
                    </Card>
                </Link>
            </div>

            {/* API Keys */}
            <Card
                title="API Keys"
                subtitle="আপনার website এ SDK integrate করার জন্য"
                action={
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleRegenerateKey}
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate
                    </Button>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Site ID
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={keys?.siteId || currentSite.siteId}
                                readOnly
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                            />
                            <Button
                                variant="secondary"
                                onClick={() => copyKey(keys?.siteId || currentSite.siteId, 'Site ID')}
                            >
                                <Copy className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            API Key
                        </label>
                        <div className="flex gap-2">
                            <input
                                type={showKeys ? 'text' : 'password'}
                                value={keys?.apiKey || '••••••••••••••••'}
                                readOnly
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                            />
                            <Button
                                variant="secondary"
                                onClick={() => setShowKeys(!showKeys)}
                            >
                                <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => copyKey(keys?.apiKey, 'API Key')}
                            >
                                <Copy className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Installation Code */}
            <Card title="Installation">
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        আপনার website এ এই code যোগ করুন (closing &lt;/body&gt; tag এর আগে):
                    </p>

                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                        {`<script>
(function() {
  var script = document.createElement('script');
  script.src = 'https://cdn.personaflow.ai/sdk.js';
  script.onload = function() {
    PersonaFlow.init({
      siteId: '${currentSite.siteId}',
      apiKey: '${keys?.apiKey || 'YOUR_API_KEY'}'
    });
  };
  document.body.appendChild(script);
})();
</script>`}
                    </pre>

                    <Button
                        variant="secondary"
                        onClick={() => {
                            const code = `<script>
(function() {
  var script = document.createElement('script');
  script.src = 'https://cdn.personaflow.ai/sdk.js';
  script.onload = function() {
    PersonaFlow.init({
      siteId: '${currentSite.siteId}',
      apiKey: '${keys?.apiKey || 'YOUR_API_KEY'}'
    });
  };
  document.body.appendChild(script);
})();
</script>`
                            copyToClipboard(code)
                            toast.success('Code copied!')
                        }}
                    >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Code
                    </Button>
                </div>
            </Card>
        </div>
    )
}