export interface Site {
    _id: string
    owner: string
    name: string
    domain: string
    siteId: string
    settings: {
        cookielessMode: boolean
        botFilterEnabled: boolean
        privacyMode: 'standard' | 'strict'
        allowedOrigins: string[]
        dataRetentionDays: number
    }
    status: 'active' | 'inactive' | 'suspended'
    stats: {
        totalVisitors: number
        totalEvents: number
        totalConversions: number
        conversionRate: number
    }
    createdAt: string
    updatedAt: string
}

export interface SiteKeys {
    siteId: string
    apiKey: string
    hmacSecret: string
}

export interface CreateSiteInput {
    name: string
    domain: string
    settings?: Partial<Site['settings']>
}

export interface UpdateSiteInput {
    name?: string
    domain?: string
    settings?: Partial<Site['settings']>
    status?: Site['status']
}