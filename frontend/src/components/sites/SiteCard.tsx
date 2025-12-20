import Link from 'next/link'
import { Globe, TrendingUp, Users, MousePointer } from 'lucide-react'
import { Site } from '@/types/site'
import { formatNumber, formatDate } from '@/lib/utils'
import { Card } from '@/components/ui/Card'

interface SiteCardProps {
    site: Site
    onDelete?: (id: string) => void
}

export function SiteCard({ site, onDelete }: SiteCardProps) {
    return (
        <Card>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Globe className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {site.name}
                            </h3>
                            <p className="text-sm text-gray-600">{site.domain}</p>
                        </div>
                    </div>
                    <div className={`
            px-2 py-1 rounded text-xs font-medium
            ${site.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
          `}>
                        {site.status}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <div className="flex items-center gap-1 text-gray-600 mb-1">
                            <Users className="w-3 h-3" />
                            <span className="text-xs">Visitors</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                            {formatNumber(site.stats.totalVisitors)}
                        </p>
                    </div>

                    <div>
                        <div className="flex items-center gap-1 text-gray-600 mb-1">
                            <MousePointer className="w-3 h-3" />
                            <span className="text-xs">Events</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                            {formatNumber(site.stats.totalEvents)}
                        </p>
                    </div>

                    <div>
                        <div className="flex items-center gap-1 text-gray-600 mb-1">
                            <TrendingUp className="w-3 h-3" />
                            <span className="text-xs">CVR</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                            {site.stats.conversionRate.toFixed(2)}%
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                        Created {formatDate(site.createdAt)}
                    </p>
                    <Link
                        href={`/sites/${site._id}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                        View Details →
                    </Link>
                </div>
            </div>
        </Card>
    )
}