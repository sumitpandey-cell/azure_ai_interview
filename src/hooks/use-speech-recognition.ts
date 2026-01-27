import { useState, useEffect, useCallback, useRef } from 'react';
import { getPreferredLanguage, type LanguageOption } from '@/lib/language-config';

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onresult: (event: { resultIndex: number; results: { isFinal: boolean;[index: number]: { transcript: string } }[] }) => void;
    onerror: (event: { error: string }) => void;
    onend: () => void;
}

declare global {
    interface Window {
        SpeechRecognition: { new(): SpeechRecognition };
        webkitSpeechRecognition: { new(): SpeechRecognition };
    }
}

export function useSpeechRecognition(language?: LanguageOption, onTranscript?: (text: string) => void) {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    // Use provided language or get from preferences
    const selectedLanguage = language || getPreferredLanguage();

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            if (recognitionRef.current) {
                recognitionRef.current.continuous = true;
                recognitionRef.current.interimResults = true;
                // For technical interviews, force English to prevent script mixing issues
                // Use English for technical content regardless of user's default language preference
                recognitionRef.current.lang = 'en-US'; // Always use English for technical interviews

                recognitionRef.current.onresult = (event) => {
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            if (onTranscript) {
                                onTranscript(event.results[i][0].transcript);
                            }
                        }
                    }
                };

                recognitionRef.current.onerror = (event) => {
                    console.error('Speech recognition error', event.error);
                    if (event.error === 'language-not-supported') {
                        console.warn(`⚠️ Language not supported, falling back to English for technical interview`);
                    }
                    setIsListening(false);
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };
            }
        }
        // Re-initialize when language changes (but force English for technical interviews)
    }, [onTranscript]); // Force English regardless of selectedLanguage

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (error) {
                console.error("Error starting speech recognition:", error);
            }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, [isListening]);

    return {
        isListening,
        startListening,
        stopListening,
        selectedLanguage,
        hasSupport: !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    };
}
