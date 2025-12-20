export interface Variant {
    _id: string
    site: string
    siteId: string
    name: string
    key: string
    description?: string
    content: {
        headline: string
        subheadline: string
        ctaText: string
        ctaColor: string
        heroImage?: string
        layout: 'centered' | 'left' | 'right' | 'split'
        customCSS?: string
        customHTML?: string
    }
    targetingRules: {
        segments?: string[]
        minVisits?: number
        maxVisits?: number
        intentScoreMin?: number
        intentScoreMax?: number
        devices?: string[]
        paths?: string[]
        utmSource?: string[]
    }
    metrics: {
        impressions: number
        clicks: number
        conversions: number
        ctr: number
        conversionRate: number
        avgTimeOnPage: number
    }
    isControl: boolean
    trafficAllocation: number
    status: 'draft' | 'active' | 'paused' | 'archived'
    priority: number
    createdAt: string
    updatedAt: string
}

export interface CreateVariantInput {
    name: string
    key: string
    description?: string
    content: Variant['content']
    targetingRules?: Variant['targetingRules']
    trafficAllocation?: number
    priority?: number
}

export interface UpdateVariantInput extends Partial<CreateVariantInput> {
    status?: Variant['status']
}