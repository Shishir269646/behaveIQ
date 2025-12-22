import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: string | number;
    change?: string;
    icon: LucideIcon;
    iconColor?: string;
    trend?: 'up' | 'down';
}

export function StatCard({
    title,
    value,
    change,
    icon: Icon,
    iconColor = 'text-blue-600',
    trend,
}: StatCardProps) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-600">{title}</p>
                        <p className="text-3xl font-bold text-gray-900">{value}</p>
                        {change && (
                            <p
                                className={cn(
                                    'text-sm font-medium',
                                    trend === 'up' ? 'text-green-600' : 'text-red-600'
                                )}
                            >
                                {change}
                            </p>
                        )}
                    </div>

                    <div className={cn('p-3 rounded-lg bg-gray-50', iconColor)}>
                        <Icon className="w-6 h-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
