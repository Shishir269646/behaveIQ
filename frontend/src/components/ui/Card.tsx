import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    title?: string
    subtitle?: string
    action?: React.ReactNode
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, title, subtitle, action, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden',
                    className
                )}
                {...props}
            >
                {(title || subtitle || action) && (
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <div>
                            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
                            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
                        </div>
                        {action && <div>{action}</div>}
                    </div>
                )}
                <div className="p-6">
                    {children}
                </div>
            </div>
        )
    }
)

Card.displayName = 'Card'