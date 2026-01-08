// @/hooks/useEvents.ts
import { useState, useEffect } from 'react';
import { CircleUser, FileText, MousePointerClick, Link as LinkIcon, ShoppingCart, LogOut } from "lucide-react";
import { api } from '@/lib/api';
import { useAppStore } from '@/store'; // ADDED

export type EventType = 'page_view' | 'click' | 'session_start' | 'add_to_cart' | 'purchase' | 'session_end';

export interface Event {
    id: string;
    type: EventType;
    user: string;
    details: string;
    timestamp: string; // Using string for simplicity, could be Date object
}

export const useEvents = (isLive: boolean = false) => {
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const selectedWebsite = useAppStore((state) => state.website); // ADDED

    useEffect(() => {
        const fetchInitialEvents = async () => {
            if (!selectedWebsite?._id) { // ADDED
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);
            try {
                // In a real application, you might fetch initial events here
                // For live events, you might use websockets
                const response = await api.get<Event[]>(`/events?websiteId=${selectedWebsite._id}`); // MODIFIED
                setEvents(response.data.data);
            } catch (err: any) {
                setError(err.response?.data?.message || err.message || "Failed to fetch events.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialEvents();

        if (isLive) {
            // This would typically be a WebSocket connection for real-time
            // For now, we simulate adding new events via polling or a mock generator
            const interval = setInterval(() => {
                // Here, you would ideally fetch a new event from the backend
                // For demonstration, we'll keep the mock event generator
                // In a real app, this would be an API call or WebSocket push
                const newEvent: Event = {
                    id: `evt_${Math.random().toString(36).substring(2, 6)}`,
                    type: 'page_view', // Example type
                    user: `user_${Math.floor(Math.random() * 900) + 100}`,
                    details: `/pages/${Math.floor(Math.random() * 900) + 100}`, // MODIFIED
                    timestamp: new Date().toLocaleTimeString(),
                };
                setEvents(prevEvents => {
                    const currentEvents = Array.isArray(prevEvents) ? prevEvents : [];
                    return [newEvent, ...currentEvents.slice(0, 9)];
                }); // Keep latest 10 events
            }, 3000);

            return () => clearInterval(interval);
        }
    }, [isLive, selectedWebsite?._id]); // MODIFIED dependencies

    return { events, isLoading, error };
};