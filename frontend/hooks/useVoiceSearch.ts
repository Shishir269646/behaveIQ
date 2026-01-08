// @/hooks/useVoiceSearch.ts
import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api'; // Import the api instance

// Define the shape of the recognition object
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: Event) => void;
    onend: () => void;
}

interface SpeechRecognitionEvent extends Event {
    results: {
        transcript: string;
    }[][];
}


// Extend window to include webkitSpeechRecognition
declare global {
    interface Window {
        webkitSpeechRecognition: new () => SpeechRecognition;
        SpeechRecognition: new () => SpeechRecognition;
    }
}


export const useVoiceSearch = (onSearchComplete: (results: any[]) => void) => {
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const isSupported = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

    useEffect(() => {
        if (!isSupported) {
            setError("Speech recognition is not supported in this browser.");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = async (event: SpeechRecognitionEvent) => {
            const transcript = event.results[0][0].transcript;
            setIsListening(false);
            // Call backend API for search
            try {
                const response = await api.post('/voice/search', { query: transcript });
                if (response.data.success) {
                    onSearchComplete(response.data.data.results);
                } else {
                    setError(response.data.message || 'Voice search failed.');
                }
            } catch (err: any) {
                setError(err.response?.data?.message || err.message || 'Failed to perform voice search.');
            }
        };

        recognition.onerror = (event: Event) => {
            setError(`Speech recognition error: ${event.type}`);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };
        
        recognitionRef.current = recognition;

    }, [isSupported, onSearchComplete]);

    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start();
                setIsListening(true);
                setError(null);
            } catch(e) {
                 setError("Speech recognition could not be started.");
                 setIsListening(false);
            }
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    return { isListening, error, startListening, stopListening, isSupported: !!isSupported };
};
