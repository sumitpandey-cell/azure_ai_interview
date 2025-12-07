import { useEffect, useRef, useState, useCallback } from 'react';
import { AudioRecorder } from '../lib/audio-recorder';
import { AudioStreamer } from '../lib/audio-streamer';
import { LiveConfig, LiveIncomingMessage, LiveOutgoingMessage } from '../types/live-api';

// Extend LiveConfig to support transcript callback
export interface ExtendedLiveConfig extends LiveConfig {
    onTranscriptFragment?: (sender: 'ai' | 'user', text: string) => void;
    onInterruption?: () => void; // Called when user interrupts AI (barge-in detection)
}

const HOST = 'generativelanguage.googleapis.com';
const URI = `wss://${HOST}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

export function useLiveAPI(apiKey: string) {
    const [connected, setConnected] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [volume, setVolume] = useState(0);
    const wsRef = useRef<WebSocket | null>(null);
    const audioRecorderRef = useRef<AudioRecorder | null>(null);
    const audioStreamerRef = useRef<AudioStreamer | null>(null);
    const transcriptCallbackRef = useRef<((sender: 'ai' | 'user', text: string) => void) | null>(null);
    const interruptionCallbackRef = useRef<(() => void) | null>(null);

    const connect = useCallback(async (config: ExtendedLiveConfig) => {
        // Store the transcript and interruption callbacks
        transcriptCallbackRef.current = config.onTranscriptFragment || null;
        interruptionCallbackRef.current = config.onInterruption || null;
        if (!apiKey) {
            console.error("API Key is required");
            return;
        }

        // Prevent duplicate connections
        if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
            console.log("Connection already exists or is in progress, skipping...");
            return;
        }

        // Clean up any existing connection
        if (wsRef.current) {
            console.log("Cleaning up previous connection...");
            wsRef.current.close();
            wsRef.current = null;
        }

        // Initialize audio immediately to satisfy browser autoplay policies
        audioStreamerRef.current = new AudioStreamer();
        audioStreamerRef.current.addEventListener('queue-empty', () => {
            window.dispatchEvent(new CustomEvent('ai-audio-stopped'));
        });
        await audioStreamerRef.current.initialize();

        audioRecorderRef.current = new AudioRecorder();
        audioRecorderRef.current.addEventListener('data', ((e: CustomEvent) => {
            sendAudioChunk(e.detail);
        }) as EventListener);
        audioRecorderRef.current.addEventListener('volume', ((e: CustomEvent) => {
            setVolume(e.detail);
        }) as EventListener);

        const ws = new WebSocket(`${URI}?key=${apiKey}`);
        wsRef.current = ws;

        ws.onopen = async () => {
            console.log("Connected to Gemini Live API");
            setConnected(true);

            // Send setup message
            const setupMessage: LiveOutgoingMessage = {
                setup: config
            };
            console.log("Sending setup message:", JSON.stringify(setupMessage, null, 2));
            ws.send(JSON.stringify(setupMessage));
        };

        ws.onmessage = async (event) => {
            let data: LiveIncomingMessage;
            try {
                if (event.data instanceof Blob) {
                    const text = await event.data.text();
                    data = JSON.parse(text);
                } else {
                    data = JSON.parse(event.data);
                }
            } catch (e) {
                console.error("Error parsing message", e);
                console.error("Raw message data:", event.data);
                return;
            }

            // Handle setup complete - send initial message to trigger AI introduction
            if ('setupComplete' in data) {
                console.log("Setup complete, sending initial greeting");

                const greetingMessage: LiveOutgoingMessage = {
                    clientContent: {
                        turns: [{
                            role: "user",
                            parts: [{ text: "Hello, please introduce yourself and start the interview." }]
                        }],
                        turnComplete: true
                    }
                };
                ws.send(JSON.stringify(greetingMessage));

                // Start recording automatically
                if (audioRecorderRef.current) {
                    await audioRecorderRef.current.start();
                    setIsRecording(true);
                }
            }

            if ('serverContent' in data) {
                const { modelTurn, inputTranscription, outputTranscription, turnComplete, interrupted } = data.serverContent;

                // Handle interruption (barge-in detection)
                if (interrupted) {
                    console.warn('🛑 INTERRUPTION DETECTED - User barged in while AI was speaking');
                    console.log('   This is normal behavior for natural conversation flow');

                    // Notify the UI about the interruption
                    if (interruptionCallbackRef.current) {
                        interruptionCallbackRef.current();
                    }
                }

                // Handle AI text responses - use callback for direct processing
                if (modelTurn) {
                    for (const part of modelTurn.parts) {
                        console.log('Part type:', {
                            hasText: !!part.text,
                            hasAudio: !!part.inlineData,
                            audioType: part.inlineData?.mimeType
                        });

                        if (part.text) {
                            console.log('📝 AI Transcript Fragment:', part.text.substring(0, 50) + '...');
                            // Invoke callback directly if available
                            if (transcriptCallbackRef.current) {
                                transcriptCallbackRef.current('ai', part.text);
                            }
                        }
                        if (part.inlineData && part.inlineData.mimeType.startsWith('audio/pcm')) {
                            const audioData = base64ToArrayBuffer(part.inlineData.data);
                            audioStreamerRef.current?.addPCM16(audioData);
                        }
                    }
                }

                // Handle user speech transcription - use callback for direct processing
                if (inputTranscription?.text) {
                    const text = inputTranscription.text;
                    if (text) {
                        console.log('🎤 User Transcript Fragment:', text.substring(0, 50) + '...');
                        // Invoke callback directly if available
                        if (transcriptCallbackRef.current) {
                            transcriptCallbackRef.current('user', text);
                        }
                    }
                }

                // Handle AI audio transcription (speech-to-text of AI's audio output)
                if (outputTranscription?.text) {
                    const text = outputTranscription.text;
                    if (text) {
                        // Invoke callback directly if available
                        if (transcriptCallbackRef.current) {
                            transcriptCallbackRef.current('ai', text);
                        }
                    }
                }

                // Note: turnComplete is now handled by the receiving component's accumulation logic
                if (turnComplete) {
                    console.log('✅ Turn complete');
                }
            }
        };

        ws.onclose = (event) => {
            console.log("Disconnected from Gemini Live API");
            console.log("Close code:", event.code);
            console.log("Close reason:", event.reason);
            console.log("Was clean:", event.wasClean);
            setConnected(false);
            setIsRecording(false);
        };

        ws.onerror = (error) => {
            console.error("WebSocket Error:", error);
            console.error("Error type:", error.type);
        };
    }, [apiKey]);

    const disconnect = useCallback(() => {
        wsRef.current?.close();
        audioRecorderRef.current?.stop();
        audioStreamerRef.current?.stop();
        setConnected(false);
        setIsRecording(false);
    }, []);

    const startRecording = useCallback(async () => {
        if (!audioRecorderRef.current) return;
        await audioRecorderRef.current.start();
        setIsRecording(true);
    }, []);

    const stopRecording = useCallback(() => {
        audioRecorderRef.current?.stop();
        setIsRecording(false);
    }, []);

    const pauseRecording = useCallback(() => {
        if (!audioRecorderRef.current || !isRecording) return;
        console.log('Pausing audio recording (for coding challenge)');
        audioRecorderRef.current.stop();
        setIsRecording(false);
    }, [isRecording]);

    const resumeRecording = useCallback(async () => {
        if (!audioRecorderRef.current || isRecording) return;
        console.log('Resuming audio recording (after coding challenge)');
        await audioRecorderRef.current.start();
        setIsRecording(true);
    }, [isRecording]);

    const sendAudioChunk = (data: ArrayBuffer) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const base64Audio = arrayBufferToBase64(data);
        const message: LiveOutgoingMessage = {
            realtimeInput: {
                mediaChunks: [
                    {
                        mimeType: "audio/pcm;rate=16000",
                        data: base64Audio
                    }
                ]
            }
        };
        wsRef.current.send(JSON.stringify(message));
    };

    const sendTextMessage = useCallback((text: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const message: LiveOutgoingMessage = {
            clientContent: {
                turns: [{
                    role: "user",
                    parts: [{ text }]
                }],
                turnComplete: true
            }
        };
        wsRef.current.send(JSON.stringify(message));
    }, []);

    const suspendAudioOutput = useCallback(async () => {
        await audioStreamerRef.current?.suspend();
    }, []);

    const resumeAudioOutput = useCallback(async () => {
        await audioStreamerRef.current?.resume();
    }, []);

    return {
        connect,
        disconnect,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        sendTextMessage,
        suspendAudioOutput,
        resumeAudioOutput,
        connected,
        isRecording,
        volume
    };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}
