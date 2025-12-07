import { useState, useEffect, useCallback, useRef } from 'react';
import { getPreferredLanguage, type LanguageOption } from '@/lib/language-config';

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onresult: (event: any) => void;
    onerror: (event: any) => void;
    onend: () => void;
}

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export function useSpeechRecognition(language?: LanguageOption, onTranscript?: (text: string) => void) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
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

                console.log(`🌐 Speech recognition configured for technical interview in English (en-US) to prevent transcription mixing`);

                recognitionRef.current.onresult = (event: any) => {
                    let finalTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                            // NOTE: We're now handling transcription via Gemini Live API's inputTranscription
                            // So we don't need to dispatch events from here anymore
                            console.log(`Speech recognition final result (English forced for technical interview):`, event.results[i][0].transcript);
                            if (onTranscript) {
                                onTranscript(event.results[i][0].transcript);
                            }
                        }
                    }
                };

                recognitionRef.current.onerror = (event: any) => {
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
    }, ['en-US']); // Force English regardless of selectedLanguage

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
