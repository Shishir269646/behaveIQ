import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AlertProps {
    type?: 'info' | 'success' | 'warning' | 'error'
    title?: string
    children: React.ReactNode
}

const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertCircle,
    error: XCircle
}

const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800'
}

export function Alert({ type = 'info', title, children }: AlertProps) {
    const Icon = icons[type]

    return (
        <div className={cn('rounded-lg border p-4', styles[type])}>
            <div className="flex gap-3">
                <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    {title && (
                        <h4 className="font-semibold mb-1">{title}</h4>
                    )}
                    <div className="text-sm">{children}</div>
                </div>
            </div>
        </div>
    )
}