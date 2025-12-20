
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface PersonaFlowConfig {
    siteId: string | null;
    apiKey: string | null;
    apiUrl: string;
    debug: boolean;
    autoTrack: boolean;
}

const config: PersonaFlowConfig = {
    siteId: null,
    apiKey: null,
    apiUrl: API_URL,
    debug: false,
    autoTrack: true
};

const ANON_ID_KEY = 'pf_anon_id';
const VARIANT_KEY = 'pf_variant';

let anonId: string | null = null;
let currentVariant: any = null;
let scrollDepth: number = 0;

async function fetcher<T = any>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey || '', // Add API key to headers
            ...(init?.headers || {})
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Something went wrong');
    }

    return response.json();
}

function log(...args: any[]): void {
    if (config.debug) {
        console.log('[PersonaFlow]', ...args);
    }
}

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function getOrCreateAnonId(): string {
    let id = localStorage.getItem(ANON_ID_KEY);
    if (!id) {
        id = 'anon_' + generateId();
        localStorage.setItem(ANON_ID_KEY, id);
    }
    return id;
}

function applyToElements(selector: string, callback: (element: Element) => void): void {
    const elements = document.querySelectorAll(selector);
    elements.forEach(callback);
}

function applyVariant(variant: any): void {
    const content = variant.content;

    applyToElements('[data-pf-headline]', (el) => {
        el.textContent = content.headline;
    });

    applyToElements('[data-pf-subheadline]', (el) => {
        el.textContent = content.subheadline;
    });

    applyToElements('[data-pf-cta]', (el) => {
        if (content.ctaText) {
            el.textContent = content.ctaText;
        }
        if (content.ctaColor) {
            (el as HTMLElement).style.backgroundColor = content.ctaColor;
        }
    });

    log('Variant applied:', variant.variant);
}

async function loadPersonalization(): Promise<void> {
    const device = window.innerWidth < 768 ? 'mobile' : 'desktop';
    const url = `${config.apiUrl}/personalize?site=${config.siteId}&anon=${anonId}&path=${window.location.pathname}&device=${device}`;

    try {
        const data = await fetcher(url, {
            headers: {
                'x-api-key': config.apiKey || ''
            }
        });
        if (data.success && data.data) {
            currentVariant = data.data;
            localStorage.setItem(VARIANT_KEY, JSON.stringify(data.data));
            applyVariant(data.data);

            const event = new CustomEvent('personaflow:loaded', {
                detail: data.data
            });
            window.dispatchEvent(event);
        }
    } catch (error) {
        console.error('PersonaFlow error:', error);
    }
}

async function trackEvent(type: string, meta?: Record<string, any>): Promise<void> {
    const eventData = {
        anonId: anonId,
        siteId: config.siteId,
        type: type,
        path: window.location.pathname,
        meta: meta || {},
        variant: currentVariant ? currentVariant.variant : null,
        device: window.innerWidth < 768 ? 'mobile' : 'desktop',
        timestamp: new Date().toISOString()
    };

    try {
        await fetcher(`${config.apiUrl}/events`, {
            method: 'POST',
            body: JSON.stringify(eventData),
        });
    } catch (error) {
        console.error('Event tracking failed:', error);
    }

    log('Event tracked:', type, meta);
}

async function trackConversion(eventType: string, value?: number): Promise<void> {
    const data = {
        anonId: anonId,
        siteId: config.siteId,
        event: eventType,
        value: value || 1,
        variant: currentVariant ? currentVariant.variant : null,
        path: window.location.pathname
    };

    try {
        await fetcher(`${config.apiUrl}/feedback`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    } catch (error) {
        console.error('Conversion tracking failed:', error);
    }

    log('Conversion tracked:', eventType, value);
}

function setupScrollTracking(): void {
    let lastScrollTime = 0;

    window.addEventListener('scroll', () => {
        const now = Date.now();
        if (now - lastScrollTime < 500) return;
        lastScrollTime = now;

        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = window.scrollY;
        const depth = Math.round((scrolled / scrollHeight) * 100);

        if (depth >= scrollDepth + 25) {
            scrollDepth = Math.floor(depth / 25) * 25;
            trackEvent('scroll', { depth: scrollDepth / 100 });
        }
    });
}

function setupClickTracking(): void {
    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (!target) return;

        const tagName = target.tagName.toLowerCase();

        if (tagName === 'button' || tagName === 'a') {
            trackEvent('click', {
                elementId: target.id || null,
                elementClass: target.className || null,
                elementText: target.textContent?.substring(0, 50) || null
            });
        }
    });
}

export function init(options: { siteId: string; apiKey: string; apiUrl?: string; debug?: boolean; autoTrack?: boolean }): void {
    if (!options.siteId) {
        console.error('PersonaFlow: siteId is required');
        return;
    }
    if (!options.apiKey) {
        console.error('PersonaFlow: apiKey is required');
        return;
    }

    config.siteId = options.siteId;
    config.apiKey = options.apiKey;
    if (options.apiUrl) config.apiUrl = options.apiUrl;
    if (typeof options.debug === 'boolean') config.debug = options.debug;
    if (typeof options.autoTrack === 'boolean') config.autoTrack = options.autoTrack;

    anonId = getOrCreateAnonId();

    loadPersonalization();

    trackEvent('page_view', {
        referrer: document.referrer,
        title: document.title
    });

    if (config.autoTrack) {
        setupScrollTracking();
        setupClickTracking();
    }

    log('PersonaFlow initialized');
}

export function getVariant(): any {
    return currentVariant;
}

export function getAnonId(): string | null {
    return anonId;
}

const PersonaFlow = {
    init,
    trackEvent,
    trackConversion,
    getVariant,
    getAnonId
};

export default PersonaFlow;
