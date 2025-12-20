interface LoadingProps {
    size?: 'sm' | 'md' | 'lg'
    text?: string
}

export function Loading({ size = 'md', text }: LoadingProps) {
    const sizes = {
        sm: 'h-8 w-8',
        md: 'h-12 w-12',
        lg: 'h-16 w-16'
    }

    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizes[size]}`} />
            {text && (
                <p className="mt-4 text-sm text-gray-600">{text}</p>
            )}
        </div>
    )
}