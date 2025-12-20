import { useState, useEffect } from 'react'

interface PersonalizationConfig {
    siteId: string
    apiKey: string
    apiUrl?: string
}

interface VariantContent {
    headline: string
    subheadline: string
    ctaText: string
    ctaColor: string
    heroImage?: string
    layout: string
}

interface PersonalizationResult {
    variant: string
    content: VariantContent
    reason: string
    confidence: number
}

export function usePersonalization(config: PersonalizationConfig) {
    const [variant, setVariant] = useState<PersonalizationResult | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchPersonalization()
    }, [config.siteId])

    const fetchPersonalization = async () => {
        try {
            // Get or create anonymous ID
            let anonId = localStorage.getItem('pf_anon_id')
            if (!anonId) {
                anonId = 'anon_' + Math.random().toString(36).substr(2, 16)
                localStorage.setItem('pf_anon_id', anonId)
            }

            // Get device type
            const device = window.innerWidth < 768 ? 'mobile' : 'desktop'

            // Fetch personalized variant
            const apiUrl = config.apiUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
            const response = await fetch(
                `${apiUrl}/personalize?` +
                `site=${config.siteId}&anon=${anonId}&path=${window.location.pathname}&device=${device}`,
                {
                    headers: {
                        'x-api-key': config.apiKey
                    }
                }
            )

            if (!response.ok) {
                throw new Error('Failed to fetch personalization')
            }

            const data = await response.json()
            setVariant(data.data)
            setLoading(false)

            // Track page view
            trackEvent('page_view', {
                path: window.location.pathname,
                variant: data.data.variant
            })

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
            setLoading(false)
        }
    }

    const trackEvent = async (type: string, meta: any = {}) => {
        const anonId = localStorage.getItem('pf_anon_id')
        const apiUrl = config.apiUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

        try {
            await fetch(`${apiUrl}/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': config.apiKey
                },
                body: JSON.stringify({
                    anonId,
                    siteId: config.siteId,
                    type,
                    path: window.location.pathname,
                    meta
                })
            })
        } catch (err) {
            console.error('Event tracking failed:', err)
        }
    }

    const trackConversion = async (eventType: string, value: number = 1) => {
        const anonId = localStorage.getItem('pf_anon_id')
        const apiUrl = config.apiUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

        try {
            await fetch(`${apiUrl}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': config.apiKey
                },
                body: JSON.stringify({
                    anonId,
                    siteId: config.siteId,
                    event: eventType,
                    value,
                    variant: variant?.variant,
                    path: window.location.pathname
                })
            })
        } catch (err) {
            console.error('Conversion tracking failed:', err)
        }
    }

    return {
        variant,
        loading,
        error,
        trackEvent,
        trackConversion
    }
}