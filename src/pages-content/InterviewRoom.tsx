"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useParams, useSearchParams } ;
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, User, Sparkles, ChevronRight, ChevronLeft, Loader2, Code, Wifi, WifiOff, Activity, Brain } from "lucide-react";
import { toast } from "sonner";
import { useLiveAPI } from "@/hooks/use-live-api";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { generateFeedback } from "@/lib/gemini-feedback";
import { useInterviewStore } from "@/stores/use-interview-store";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
import { useSubscription } from "@/hooks/use-subscription";
import { useCompanyQuestions } from "@/hooks/use-company-questions";
import { useDebouncedCallback } from "use-debounce";

import { CompanyQuestion } from "@/types/company-types";
import { CodingChallengeModal } from "@/components/CodingChallengeModal";
import { supabase } from "@/integrations/supabase/client";


const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string;

interface SessionData {
    id: string;
    interview_type: string;
    position: string;
    duration_minutes?: number;
    config?: {
        companyInterviewConfig?: {
            companyTemplateId: string;
            companyName: string;
            role: string;
            experienceLevel: string;
        };
        [key: string]: any;
    };
}

import { loadSystemPrompt, containsCodingKeywords } from "@/lib/prompt-loader";
import { PerformanceHistory } from "@/types/performance-types";

const generateSystemInstruction = (
    session: SessionData | null,
    timeRemaining: number,
    companyQuestions?: any[],
    performanceHistory?: PerformanceHistory,
    avatarName?: string
): string => {
    if (!session) {
        return `You are ${avatarName || 'Aura'}, a Senior Technical Interviewer. You are an intelligent AI assistant.

For technical interviews, always transcribe English technical terms in English script regardless of accent (e.g., "chat app", "Socket.IO", "implementation").`;
    }

    const { interview_type, position } = session;
    const companyName = (session as any).config?.companyInterviewConfig?.companyName;
    const skills = (session as any).config?.skills;
    const difficulty = (session as any).config?.difficulty;
    const jobDescription = (session as any).config?.jobDescription;

    // Use the new prompt loader system with language context and performance history
    const basePrompt = loadSystemPrompt({
        interviewType: interview_type,
        position: position,
        companyName: companyName,
        timeLeftMinutes: timeRemaining,
        questions: companyQuestions && companyQuestions.length > 0 ? companyQuestions : undefined,
        skills: skills,
        difficulty: difficulty,
        performanceHistory: performanceHistory,
        jobDescription: jobDescription
    });

    // Replace "Aura" with the selected avatar name in the prompt
    const personalizedPrompt = basePrompt.replace(/You are Aura/g, `You are ${avatarName || 'Aura'}`);

    const fullPrompt = `You are ${avatarName || 'Aura'}, an intelligent AI assistant conducting a professional technical interview.

CRITICAL TRANSCRIPTION REQUIREMENTS:
- Always transcribe English technical terms in English script regardless of accent (e.g., "chat app", "Socket.IO", "implementation")
- Detect the language spoken by the candidate accurately
- Do NOT transcribe one language using another language's script
- Maintain proper script for each language (English in Latin, Hindi in Devanagari, etc.)
- SCRIPT CORRECTION RULE: If you receive input that is transliterated (e.g., Hindi meaning written in English script like "Main ghar ja raha hoon"), you MUST mentally convert it to its correct script (e.g., "मैं घर जा रहा हूँ") before processing. Treat the input as if it was written in the correct script.

${personalizedPrompt}`;

    console.log('🤖 FULL GENERATED SYSTEM PROMPT:');
    console.log('=====================================');
    console.log(fullPrompt);
    console.log('=====================================');

    return fullPrompt;
};

interface Message {
    id: number;
    sender: "ai" | "user";
    text: string;
}

export default function InterviewRoom() {
    const { sessionId } = useParams();
    const [searchParams] = useSearchParams();



    const { fetchSessionDetail, completeInterviewSession, fetchSessions, fetchStats, fetchRecentPerformanceMetrics } = useOptimizedQueries();

    // Sanitize API Key - check if it exists first
    const cleanApiKey = API_KEY ? API_KEY.replace(/[^a-zA-Z0-9_\-]/g, '') : '';
    const { connect, disconnect, startRecording, stopRecording, pauseRecording, resumeRecording, sendTextMessage, suspendAudioOutput, resumeAudioOutput, connected, isRecording, volume } = useLiveAPI(cleanApiKey);
    const { setFeedback, setTranscript, setSaving, setSaveError, addCodingChallenge, setCurrentCodingQuestion, currentCodingQuestion, clearFeedback } = useInterviewStore();
    // Track if browser speech recognition is working
    const browserSpeechWorkingRef = useRef(false);
    const lastBrowserTranscriptTimeRef = useRef(0);

    const { startListening, stopListening, hasSupport } = useSpeechRecognition(undefined, (text) => {
        // Mark that browser speech is working
        browserSpeechWorkingRef.current = true;
        lastBrowserTranscriptTimeRef.current = Date.now();

        // User is speaking - update state
        setIsUserSpeaking(true);
        lastUserSpeechTimeRef.current = Date.now();

        if (handleTranscriptFragmentRef.current) {
            handleTranscriptFragmentRef.current('user', text);
        }

        // Clear user speaking state after 2 seconds of no speech
        setTimeout(() => {
            const timeSinceLastSpeech = Date.now() - lastUserSpeechTimeRef.current;
            if (timeSinceLastSpeech >= 2000) {
                setIsUserSpeaking(false);
            }
        }, 2000);
    });
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [session, setSession] = useState<SessionData | null>(null);
    const [sessionLoaded, setSessionLoaded] = useState(false);
    const startTimeRef = useRef<number | null>(null);
    const messageIdRef = useRef(0);
    const hasConnectedRef = useRef(false); // Track if connection has been initiated
    const { remaining_minutes, recordUsage, type: subscriptionType } = useSubscription();
    const [timeLeft, setTimeLeft] = useState(remaining_minutes * 60);

    // Coding challenge state
    const [isCodingModalOpen, setIsCodingModalOpen] = useState(false);
    const [isInterviewPaused, setIsInterviewPaused] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isEnding, setIsEnding] = useState(false);
    const [isCodingChallengeAvailable, setIsCodingChallengeAvailable] = useState(false);

    // ========================================
    // OPTIMIZATION STATES
    // ========================================

    // Visual Feedback Optimizations
    const [aiThinking, setAiThinking] = useState(false);
    const [showTranscript, setShowTranscript] = useState(false);
    const [userVolume, setUserVolume] = useState(0);

    // Connection Health Monitoring
    const [connectionHealth, setConnectionHealth] = useState({
        latency: 0,
        packetsLost: 0,
        reconnectAttempts: 0,
        quality: 'good' as 'excellent' | 'good' | 'poor'
    });

    // Performance Optimizations
    const messageQueue = useRef<string[]>([]);
    const isProcessingQueue = useRef(false);
    const errorRecoveryRef = useRef(0);
    const lastPingTime = useRef(0);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Audio Capture Control (Internal - doesn't affect recording state)
    const shouldSuppressAudioRef = useRef(false); // Suppress audio when AI speaks, but keep mic on
    const [isUserSpeaking, setIsUserSpeaking] = useState(false); // Track when user is actually speaking
    const lastUserSpeechTimeRef = useRef(0); // Track last time user spoke

    // Message Management
    const MAX_MESSAGES_IN_MEMORY = 50;
    const archivedMessagesRef = useRef<Message[]>([]);



    // Fetch company questions if this is a company interview
    const companyTemplateId = session?.config?.companyInterviewConfig?.companyTemplateId;
    const { questions: companyQuestions, isLoading: loadingQuestions } = useCompanyQuestions({
        companyId: companyTemplateId || null,
        count: 5,
        role: session?.config?.companyInterviewConfig?.role || null
    });

    // Initialize timeLeft based on session duration or default to subscription time
    useEffect(() => {
        if (session?.duration_minutes) {
            // Use the duration from the interview session
            setTimeLeft(session.duration_minutes * 60);
        } else {
            // Fallback to subscription remaining time
            setTimeLeft(remaining_minutes * 60);
        }
    }, [session, remaining_minutes]);

    // Timer logic
    useEffect(() => {
        const timer = setInterval(() => {
            // Don't increment elapsed time if interview is paused
            if (!isInterviewPaused) {
                setElapsedTime((prev) => prev + 1);
            }

            // Count down if session has duration OR if subscription is not unlimited
            const shouldCountDown = session?.duration_minutes || (subscriptionType !== 'paid' || remaining_minutes < 999999);

            if (shouldCountDown && !isInterviewPaused) {
                setTimeLeft((prev) => {
                    if (prev === 120) { // 2 minutes left
                        toast.warning("2 minutes remaining in your interview!");
                    }
                    if (prev <= 1) {
                        clearInterval(timer);
                        toast.info("Interview time has ended");
                        handleEndCall();
                        return 0;
                    }
                    return prev - 1;
                });
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [subscriptionType, remaining_minutes, session, isInterviewPaused]);

    // AI speaking animation based on volume + Internal audio suppression
    useEffect(() => {
        const wasSpeaking = isAiSpeaking;
        const isSpeaking = volume > 0.01;

        setIsAiSpeaking(isSpeaking);

        // ========================================
        // INTERNAL AUDIO SUPPRESSION WHEN AI SPEAKS
        // Keep mic recording but suppress audio capture internally
        // ========================================
        if (isSpeaking && !wasSpeaking) {
            // AI just started speaking - suppress candidate audio internally
            console.log('🔇 AI started speaking - suppressing candidate audio (mic stays on)');
            shouldSuppressAudioRef.current = true;
        } else if (!isSpeaking && wasSpeaking) {
            // AI just stopped speaking - allow candidate audio
            console.log('🎤 AI stopped speaking - allowing candidate audio');
            // Small delay to ensure AI has completely finished
            setTimeout(() => {
                if (!isAiSpeaking && volume <= 0.01) {
                    shouldSuppressAudioRef.current = false;
                }
            }, 300); // 300ms delay to avoid cutting off AI
        }
    }, [volume, isAiSpeaking]);

    // Fetch session data
    useEffect(() => {
        if (sessionId) {
            fetchSession();
        }
    }, [sessionId]);

    const fetchSession = async () => {
        try {
            const data = await fetchSessionDetail(sessionId!);

            if (data) {
                setSession({
                    id: data.id,
                    interview_type: data.interview_type,
                    position: data.position,
                    config: data.config // Ensure config is passed
                });
            } else {
                setSession(null);
            }
        } catch (error) {
            setSession(null);
        } finally {
            setSessionLoaded(true);
        }
    };

    // ========================================
    // OPTIMIZATION UTILITY FUNCTIONS
    // ========================================

    // Connection Health Monitoring with Notifications
    const monitorConnection = useCallback(() => {
        const pingStart = Date.now();
        lastPingTime.current = pingStart;

        // Simulate ping/pong - in real implementation, this would use WebSocket ping
        setTimeout(() => {
            const latency = Date.now() - pingStart;

            setConnectionHealth(prev => {
                let quality: 'excellent' | 'good' | 'poor' = 'excellent';
                if (latency > 200) quality = 'good';
                if (latency > 500) quality = 'poor';

                // Show toast notification when quality changes
                if (prev.quality !== quality) {
                    if (quality === 'poor') {
                        toast.error("⚠️ Poor connection detected", {
                            description: `High latency: ${latency}ms. Consider checking your internet connection.`,
                            duration: 5000,
                        });
                    } else if (quality === 'good' && prev.quality === 'poor') {
                        toast.success("✅ Connection improved", {
                            description: `Latency: ${latency}ms`,
                            duration: 3000,
                        });
                    } else if (quality === 'excellent' && prev.quality !== 'excellent') {
                        toast.success("🚀 Excellent connection", {
                            description: `Latency: ${latency}ms`,
                            duration: 2000,
                        });
                    }
                }

                return {
                    ...prev,
                    latency,
                    quality
                };
            });
        }, 100);
    }, []);

    // Adaptive Audio Configuration based on connection quality
    const getAdaptiveAudioConfig = useCallback(() => {
        switch (connectionHealth.quality) {
            case 'excellent':
                return { sampleRate: 48000, bitrate: 128, maxTokens: 800 };
            case 'good':
                return { sampleRate: 24000, bitrate: 64, maxTokens: 600 };
            case 'poor':
                return { sampleRate: 16000, bitrate: 32, maxTokens: 400 };
        }
    }, [connectionHealth.quality]);

    // Message Queue Processing for rate limiting
    const queueMessage = useCallback((message: string) => {
        messageQueue.current.push(message);
        processMessageQueue();
    }, []);

    const processMessageQueue = useCallback(async () => {
        if (isProcessingQueue.current || messageQueue.current.length === 0) return;

        isProcessingQueue.current = true;
        while (messageQueue.current.length > 0) {
            const message = messageQueue.current.shift();
            if (message) {
                try {
                    await sendTextMessage(message);
                    await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
                } catch (error) {
                    console.error('Error sending queued message:', error);
                }
            }
        }
        isProcessingQueue.current = false;
    }, [sendTextMessage]);

    // Error Recovery with Exponential Backoff
    const recoverFromError = useCallback(async (error: Error) => {
        errorRecoveryRef.current++;

        if (errorRecoveryRef.current > 3) {
            toast.error("Multiple errors detected. Please refresh the page.", {
                duration: 10000,
                action: {
                    label: "Refresh",
                    onClick: () => window.location.reload()
                }
            });
            return;
        }

        console.log(`Attempting error recovery (attempt ${errorRecoveryRef.current})...`);

        try {
            await disconnect();
            await new Promise(resolve => setTimeout(resolve, 2000 * errorRecoveryRef.current));
            // Connection will be re-established by the connection effect
            hasConnectedRef.current = false;
        } catch (recoveryError) {
            console.error('Error during recovery:', recoveryError);
        }
    }, [disconnect]);

    // Reconnection with Exponential Backoff
    const reconnectWithBackoff = useCallback(async (attempt = 1) => {
        const maxAttempts = 5;
        const baseDelay = 1000;

        if (attempt > maxAttempts) {
            toast.error("Unable to reconnect. Please refresh the page.", {
                duration: Infinity,
                action: {
                    label: "Refresh",
                    onClick: () => window.location.reload()
                }
            });
            return;
        }

        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Reconnecting in ${delay}ms (attempt ${attempt}/${maxAttempts})...`);

        setConnectionHealth(prev => ({
            ...prev,
            reconnectAttempts: attempt
        }));

        await new Promise(resolve => setTimeout(resolve, delay));

        try {
            hasConnectedRef.current = false; // Allow reconnection
            // The connection effect will handle reconnection
        } catch (error) {
            console.error(`Reconnection attempt ${attempt} failed:`, error);
            reconnectWithBackoff(attempt + 1);
        }
    }, []);

    // Message Cleanup for Memory Management
    useEffect(() => {
        if (messages.length > MAX_MESSAGES_IN_MEMORY) {
            const archived = messages.slice(0, messages.length - MAX_MESSAGES_IN_MEMORY);
            archivedMessagesRef.current = [...archivedMessagesRef.current, ...archived];

            // Store in sessionStorage as backup
            try {
                sessionStorage.setItem('archived_messages', JSON.stringify(archivedMessagesRef.current));
            } catch (e) {
                console.warn('Failed to archive messages to sessionStorage:', e);
            }

            setMessages(messages.slice(-MAX_MESSAGES_IN_MEMORY));
            console.log(`Archived ${archived.length} messages. Total archived: ${archivedMessagesRef.current.length}`);
        }
    }, [messages]);

    // Debounced Transcript Update to Zustand
    const debouncedTranscriptUpdate = useDebouncedCallback(
        (newMessages: Message[]) => {
            // Combine archived and current messages for complete transcript
            const fullTranscript = [...archivedMessagesRef.current, ...newMessages];
            setTranscript(fullTranscript);
        },
        300 // Update every 300ms instead of on every fragment
    );

    // Connection Health Monitoring Loop
    useEffect(() => {
        if (!connected) return;

        const healthCheckInterval = setInterval(() => {
            monitorConnection();
        }, 5000); // Check every 5 seconds

        return () => clearInterval(healthCheckInterval);
    }, [connected, monitorConnection]);

    // Camera handling
    useEffect(() => {
        let stream: MediaStream | null = null;

        const startCamera = async () => {
            if (isCameraOn) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                } catch (err) {
                    toast.error("Could not access camera");
                    setIsCameraOn(false);
                }
            } else {
                if (videoRef.current) {
                    videoRef.current.srcObject = null;
                }
            }
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isCameraOn]);

    // Transcript handling - Use ref to avoid reconnection loops
    const handleTranscriptFragmentRef = useRef<((sender: 'ai' | 'user', text: string) => void) | null>(null);

    // Update the ref whenever dependencies change, but don't recreate the function
    useEffect(() => {
        handleTranscriptFragmentRef.current = (sender: 'ai' | 'user', text: string) => {
            // Validate input
            if (!sender || !text) {
                console.warn('Invalid transcript fragment received:', { sender, text });
                return;
            }



            // Clean AI internal thoughts from display
            let cleanedText = text;
            if (sender === 'ai') {
                // Only remove **Bold markers** but keep the text content
                cleanedText = cleanedText.replace(/\*\*/g, '');

                // Remove empty lines
                cleanedText = cleanedText.split('\n')
                    .filter(line => line.trim())
                    .join('\n')
                    .trim();
            }

            // Skip if text is empty after cleaning
            if (!cleanedText.trim()) {
                console.log(`Skipping empty text from ${sender} after filtering`);
                return;
            }

            // If this is a user transcript from Gemini, check if browser speech is working
            // If browser speech has been working recently (within last 5 seconds), ignore Gemini's user transcript
            if (sender === 'user') {
                const timeSinceLastBrowserTranscript = Date.now() - lastBrowserTranscriptTimeRef.current;
                if (browserSpeechWorkingRef.current && timeSinceLastBrowserTranscript < 5000) {
                    console.log('🔇 Ignoring Gemini user transcript because browser speech recognition is working');
                    return;
                }
                console.log('✅ Using Gemini user transcript (browser speech not working or inactive)');

                // User is speaking - update state
                setIsUserSpeaking(true);
                lastUserSpeechTimeRef.current = Date.now();
                setAiThinking(false);

                // Clear user speaking state after 2 seconds of no speech
                setTimeout(() => {
                    const timeSinceLastSpeech = Date.now() - lastUserSpeechTimeRef.current;
                    if (timeSinceLastSpeech >= 2000) {
                        setIsUserSpeaking(false);
                    }
                }, 2000);
            }

            // AI is responding, no longer thinking
            if (sender === 'ai') {
                setAiThinking(false);
                setIsUserSpeaking(false); // User stopped speaking when AI responds
            }


            // Enhanced coding question detection
            // Strategy 1: Marker-based detection (Primary & Most Accurate)
            if (sender === 'ai' && cleanedText.includes('[CODING_CHALLENGE]')) {
                console.log('✅ Detected coding question via marker [CODING_CHALLENGE]');
                console.log('Current question index:', currentQuestionIndex);
                console.log('Total company questions:', companyQuestions.length);

                // Remove the marker from the text to be displayed
                const textWithoutMarker = cleanedText.replace('[CODING_CHALLENGE]', '').trim();

                // Update the message with clean text if there is any remaining text
                if (textWithoutMarker) {
                    setMessages((prev) => {
                        const lastMessageIndex = prev.length > 0 ? prev.length - 1 : -1;
                        const lastMessage = prev[lastMessageIndex];

                        if (lastMessage && lastMessage.sender === sender) {
                            const updated = [...prev.slice(0, -1), { ...lastMessage, text: lastMessage.text + textWithoutMarker }];
                            console.log(`✅ Appended to AI message. Total messages: ${updated.length}`);
                            return updated;
                        } else {
                            messageIdRef.current += 1;
                            const newMessage = {
                                id: messageIdRef.current,
                                sender,
                                text: textWithoutMarker,
                                timestamp: new Date().toISOString()
                            };
                            const updated = [...prev, newMessage];
                            console.log(`✅ Created new AI message. Total messages: ${updated.length}. Message: "${textWithoutMarker.substring(0, 30)}..."`);
                            return updated;
                        }
                    });
                }

                // Auto-open coding modal after AI finishes speaking
                // We'll use a small delay to ensure AI has finished speaking
                if (!isCodingModalOpen && !isInterviewPaused) {
                    console.log('⏳ Scheduling auto-open of coding modal...');

                    // Strategy: Search through ALL coding questions to find one that hasn't been asked yet
                    // We'll look for the first coding question starting from currentQuestionIndex
                    let questionToUse = companyQuestions
                        .slice(currentQuestionIndex)
                        .find(q => q.question_type === 'Coding');

                    // If we didn't find one from currentQuestionIndex onwards, it might be that
                    // the AI is asking questions out of order. Let's search all questions.
                    if (!questionToUse && companyQuestions.length > 0) {
                        console.log('⚠️ No coding question found from current index, searching all questions...');
                        questionToUse = companyQuestions.find(q => q.question_type === 'Coding');
                    }

                    // If still no question found in company questions, create a generic one
                    if (!questionToUse) {
                        console.log('⚠️ No coding question found in company questions, creating generic one');
                        questionToUse = {
                            id: 'generic-coding-' + Date.now(),
                            company_id: 'general',
                            question_text: textWithoutMarker || 'Please solve the coding problem described by the interviewer.',
                            question_type: 'Coding',
                            difficulty: 'Medium',
                            role: 'General',
                            experience_level: null,
                            tags: ['coding', 'general'],
                            metadata: {},
                            is_active: true,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        };
                    }

                    console.log('📝 Selected coding question:', questionToUse.question_text.substring(0, 50) + '...');

                    // Set the question first
                    setCurrentCodingQuestion(questionToUse);

                    // Wait 2 seconds for AI to finish speaking, then auto-open
                    setTimeout(() => {
                        console.log('🚀 Auto-opening coding modal');
                        setIsCodingModalOpen(true);
                        setIsInterviewPaused(true);
                        // Only pause user's microphone, let AI continue speaking
                        pauseRecording();
                        toast.success("Coding challenge started! Write your solution below.");

                        // Update question index ONLY if it's from company questions and we found it in the list
                        const questionIndex = companyQuestions.findIndex(q => q.id === questionToUse!.id);
                        if (questionIndex !== -1 && questionIndex >= currentQuestionIndex) {
                            console.log(`Updating question index from ${currentQuestionIndex} to ${questionIndex + 1}`);
                            setCurrentQuestionIndex(questionIndex + 1);
                        }
                    }, 2000); // 2 second delay to let AI finish speaking
                }

                // We handled the message update manually (or skipped if empty), so we return
                return;
            }

            setMessages((prev) => {
                // Find the last message from the same sender to append to it
                const lastMessageIndex = prev.length > 0 ? prev.length - 1 : -1;
                const lastMessage = prev[lastMessageIndex];

                if (lastMessage && lastMessage.sender === sender) {
                    // Append to existing line from same sender
                    const updated = [...prev.slice(0, -1), { ...lastMessage, text: lastMessage.text + cleanedText }];
                    console.log(`✅ Appended to ${sender} message. Total messages: ${updated.length}`);
                    return updated;
                } else {
                    // Create new message line
                    messageIdRef.current += 1;
                    const newMessage = {
                        id: messageIdRef.current,
                        sender,
                        text: cleanedText,
                        timestamp: new Date().toISOString()
                    };
                    const updated = [...prev, newMessage];
                    console.log(`✅ Created new ${sender} message. Total messages: ${updated.length}. Message: "${cleanedText.substring(0, 30)}..."`);
                    return updated;
                }
            });

            // Strategy 2: Keyword-based detection (Fallback)
            if (sender === 'ai' && companyQuestions.length > 0 && !isCodingModalOpen && !isInterviewPaused) {
                if (containsCodingKeywords(cleanedText)) {
                    // Find the next unasked coding question
                    const nextCodingQuestion = companyQuestions
                        .slice(currentQuestionIndex)
                        .find(q => q.question_type === 'Coding');

                    if (nextCodingQuestion) {
                        console.log(`Detected coding question via keywords: ${nextCodingQuestion.question_text.substring(0, 50)}...`);

                        // Longer delay for keyword detection to ensure question is fully asked
                        setTimeout(() => {
                            if (!isCodingModalOpen) { // Double check
                                console.log('Opening coding modal (keyword detection)');
                                setCurrentCodingQuestion(nextCodingQuestion);
                                setIsCodingModalOpen(true);
                                setIsInterviewPaused(true);

                                const newIndex = companyQuestions.indexOf(nextCodingQuestion);
                                if (newIndex !== -1) {
                                    setCurrentQuestionIndex(newIndex + 1);
                                }

                                // Only pause user's mic, let AI keep speaking
                                pauseRecording();
                            }
                        }, 3000); // 3s delay for fallback
                    }
                }
            }
        };
    }, [companyQuestions, currentQuestionIndex, isCodingModalOpen, isInterviewPaused, setCurrentCodingQuestion, pauseRecording, suspendAudioOutput]);

    // Stable callback wrapper that never changes
    const handleTranscriptFragment = useCallback((sender: 'ai' | 'user', text: string) => {
        if (handleTranscriptFragmentRef.current) {
            handleTranscriptFragmentRef.current(sender, text);
        }
    }, []);


    // Sync messages to Zustand store with debouncing for performance
    useEffect(() => {
        if (messages.length > 0) {
            messages.forEach((msg, idx) => {
                console.log(`   [${idx}] ${msg.sender.toUpperCase()}: ${msg.text.substring(0, 50)}...`);
            });
            // Use debounced update instead of immediate
            debouncedTranscriptUpdate(messages);
        }
    }, [messages, debouncedTranscriptUpdate]);

    // Auto-connect on mount after session is loaded
    useEffect(() => {
        if (!API_KEY || !sessionLoaded) {
            return;
        }

        // Check if this is a company interview
        const isCompanyInterview = !!session?.config?.companyInterviewConfig?.companyTemplateId;

        // If it is a company interview, we must wait for questions to be loaded.
        // We proceed only if:
        // 1. It's NOT a company interview
        // 2. OR It IS a company interview AND we have questions
        // 3. OR It IS a company interview AND loading is finished (and we have 0 questions - edge case)
        if (isCompanyInterview && companyQuestions.length === 0) {
            console.log('Waiting for company questions to load...');
            return;
        }

        // Prevent multiple connections - only connect once
        if (hasConnectedRef.current) {
            console.log('Connection already initiated, skipping...');
            return;
        }

        console.log('Starting connection initialization...');
        const initConnection = async () => {
            hasConnectedRef.current = true;

            try {
                // Fetch performance history before generating system instruction
                console.log('📊 Fetching candidate performance history...');
                const performanceHistory = await fetchRecentPerformanceMetrics();

                if (performanceHistory.recentInterviews.length > 0) {
                    console.log(`✅ Found ${performanceHistory.recentInterviews.length} previous interviews`);
                    console.log('📈 Average scores:', performanceHistory.averageScores);
                    console.log('📊 Trend:', performanceHistory.trend);
                } else {
                    console.log('📊 No previous interview history found - this is the candidate\'s first interview');
                }

                // Get selected avatar from session config
                const selectedAvatarId = (session as any)?.config?.selectedAvatar;
                const { getAvatarById, getDefaultAvatar } = await import('@/config/interviewer-avatars');
                const selectedAvatar = selectedAvatarId ? getAvatarById(selectedAvatarId) : getDefaultAvatar();
                const avatarName = selectedAvatar?.name || 'Aura';
                const avatarVoice = selectedAvatar?.voice || 'Fenrir';

                console.log(`🎭 Selected Avatar: ${avatarName} (Voice: ${avatarVoice})`);

                const systemInstruction = await generateSystemInstruction(
                    session,
                    Math.floor(timeLeft / 60),
                    companyQuestions.length > 0 ? companyQuestions : undefined,
                    performanceHistory,
                    avatarName  // Pass avatar name to system instruction
                );

                try {
                    // Get adaptive configuration based on connection quality
                    const adaptiveConfig = getAdaptiveAudioConfig();

                    await connect({
                        model: "models/gemini-2.5-flash-native-audio-preview-09-2025",
                        generationConfig: {
                            responseModalities: ["AUDIO"],
                            // Generation settings optimized for complete responses with adaptive quality
                            temperature: 0.9,              // Balanced creativity and speed
                            maxOutputTokens: adaptiveConfig.maxTokens,  // Adaptive based on connection quality
                            topP: 0.95,                    // Nucleus sampling for quality
                            topK: 35,                      // Reduce token consideration for speed
                            speechConfig: {
                                voiceConfig: {
                                    prebuiltVoiceConfig: {
                                        voiceName: avatarVoice
                                    },
                                },
                            }
                        },
                        systemInstruction: {
                            parts: [{ text: systemInstruction }]
                        },
                        // OPTIMIZED AUTOMATIC VAD - Ultra-Low Latency Configuration
                        // Aggressive settings for fastest possible response time
                        realtimeInputConfig: {
                            automaticActivityDetection: {
                                // START OF SPEECH: HIGH sensitivity - Detects speech IMMEDIATELY
                                // - Picks up speech quickly, no delay
                                // - Ensures AI hears you right away
                                // - Critical for responsive conversation
                                startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH',

                                // END OF SPEECH: HIGH sensitivity - Ends turn quickly
                                // - Reduces latency significantly
                                // - Makes conversation feel snappier
                                // - Triggers AI response generation earlier
                                endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',

                                // AUDIO CAPTURE: 400ms prefix padding
                                // - Captures audio before speech detection
                                // - Ensures first words aren't cut off
                                // - Industry standard for voice AI
                                prefixPaddingMs: 400,

                                // TURN-TAKING: 300ms (0.3 seconds) silence detection - OPTIMIZED!
                                // - Ultra-aggressive setting for minimal latency
                                // - Responds almost instantly after user stops
                                // - Reduced from 500ms for even faster responses
                                silenceDurationMs: 300
                            }
                        },
                        // Enable input transcription
                        inputAudioTranscription: {},
                        outputAudioTranscription: {},
                        onTranscriptFragment: handleTranscriptFragment
                    });
                    startTimeRef.current = Date.now();
                    console.log('✅ Connection established successfully');
                    console.log('🎤 Recording status:', isRecording);
                    console.log('🔗 Connected status:', connected);
                } catch (error) {
                    console.error("❌ Failed to connect to Gemini Live API:");
                    console.error("Error details:", error);
                    console.error("Error type:", typeof error);
                    console.error("Error message:", error instanceof Error ? error.message : String(error));
                    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');

                    toast.error("Failed to connect to AI interviewer. Please check your API key and try again.");
                    hasConnectedRef.current = false; // Reset on error to allow retry
                }
            } catch (outerError) {
                console.error("❌ Error in connection initialization:", outerError);
                hasConnectedRef.current = false;
            }
        };

        initConnection();

        return () => {
            console.log('Cleaning up connection...');
            disconnect();
            hasConnectedRef.current = false; // Reset on cleanup
        };
    }, [sessionLoaded, connect, disconnect, companyQuestions, loadingQuestions, session, handleTranscriptFragment]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getTimerColor = () => {
        if (subscriptionType === 'paid' && remaining_minutes > 999999) return 'text-white'; // Unlimited
        if (timeLeft < 60) return 'text-red-500 animate-pulse';
        if (timeLeft < 300) return 'text-yellow-500';
        return 'text-white';
    };

    const handleEndCall = async () => {
        if (isEnding) return;
        setIsEnding(true);
        console.log('Ending call...');

        // Capture all necessary data BEFORE navigation
        const capturedMessages = [...messages];
        const capturedSessionId = sessionId;
        const capturedSession = session;
        const capturedElapsedTime = elapsedTime;

        try {
            // Stop recording and disconnect
            if (isRecording) {
                await stopRecording();
            }
            disconnect();
            stopListening();

            // Calculate actual duration
            const durationMinutes = Math.floor(capturedElapsedTime / 60);

            // Complete the session with basic info
            if (capturedSessionId) {
                await completeInterviewSession(capturedSessionId, {
                    status: 'completed',
                    duration_minutes: durationMinutes,
                });
            }

            // Record usage
            await recordUsage(durationMinutes);

            // IMPORTANT: Clear previous feedback from Zustand to show loading state
            clearFeedback();

            // Store transcript in Zustand immediately
            setTranscript(capturedMessages);

            // Navigate to DASHBOARD instead of report page
            router.push('/dashboard');

            // Show persistent toast with loader for feedback generation
            const feedbackToastId = toast.loading("🤖 Generating your interview feedback...", {
                duration: Infinity, // Keep it until we dismiss it
            });

            // ========================================
            // BACKGROUND PROCESSING STARTS HERE
            // ========================================

            console.log('🔍 [Background] Generating feedback...');

            // Generate feedback in background
            (async () => {
                let feedbackWithTs;

                try {
                    // Extract skills and difficulty from session config
                    const sessionSkills = (capturedSession as any).config?.skills;
                    const sessionDifficulty = (capturedSession as any).config?.difficulty;

                    // Generate feedback with template context
                    const feedback = await generateFeedback(
                        capturedMessages,
                        capturedSession.position,
                        capturedSession.interview_type,
                        sessionSkills,
                        sessionDifficulty
                    );
                    console.log('✅ [Background] Feedback generated successfully');

                    feedbackWithTs = { ...feedback, generatedAt: new Date().toISOString() };

                    // Store in Zustand - this will update the UI immediately
                    setFeedback(feedbackWithTs as any);

                    // Dismiss the loading toast and show success with action button
                    toast.dismiss(feedbackToastId);
                    toast.success("✨ Interview report generated successfully!", {
                        duration: 15000,
                        description: "Your detailed feedback is ready to view.",
                        action: {
                            label: "View Report",
                            onClick: () => {
                                router.push(`/interview/${capturedSessionId}/report`);
                            }
                        }
                    });
                } catch (feedbackError) {
                    console.error('❌ [Background] Error generating feedback:', feedbackError);

                    // Fallback feedback
                    feedbackWithTs = {
                        executiveSummary: "Feedback generation encountered an error.",
                        strengths: ["Unable to analyze"],
                        improvements: ["Unable to analyze"],
                        skills: [
                            { name: "Technical Knowledge", score: 0, feedback: "Analysis failed" },
                            { name: "Communication", score: 0, feedback: "Analysis failed" },
                            { name: "Problem Solving", score: 0, feedback: "Analysis failed" },
                            { name: "Cultural Fit", score: 0, feedback: "Analysis failed" }
                        ],
                        actionPlan: ["Please review transcript manually"],
                        generatedAt: new Date().toISOString()
                    };
                    setFeedback(feedbackWithTs as any);

                    // Dismiss loading toast and show error
                    toast.dismiss(feedbackToastId);
                    toast.error("❌ Failed to generate report", {
                        duration: 4000,
                        description: "Please try viewing the report manually from the Reports section."
                    });
                }

                // Calculate average score
                const averageScore = Math.round(
                    (feedbackWithTs.skills || []).reduce((acc: number, s: any) => acc + (s.score || 0), 0) /
                    ((feedbackWithTs.skills || []).length || 1)
                );

                // Save to database in parallel
                setSaving(true);

                const doSaveWithRetry = async (attempt = 1) => {
                    try {
                        const sessionUpdate: any = {
                            duration_minutes: durationMinutes,
                            score: averageScore,
                            transcript: capturedMessages,
                            feedback: feedbackWithTs,
                            status: 'completed'
                        };

                        await completeInterviewSession(capturedSessionId!, sessionUpdate);

                        setSaving(false);
                        setSaveError(null);
                        console.log('✅ [Background] Saved to database');

                        // Trigger refetch of sessions and stats to update Dashboard/Reports
                        // The cache was already invalidated by completeInterviewSession
                        // Now we force a refetch to update the UI
                        console.log('🔄 Triggering data refetch to update components...');

                        // Use a small delay to ensure DB has fully committed
                        setTimeout(async () => {
                            try {
                                // This will fetch fresh data since cache was invalidated
                                await Promise.all([
                                    fetchSessions(true),  // Force refresh
                                    fetchStats(true)       // Force refresh
                                ]);
                                console.log('✅ Components refreshed with new data');
                            } catch (refetchError) {
                                console.error('Error refetching data:', refetchError);
                            }
                        }, 300);

                    } catch (err: any) {
                        console.error(`❌ [Background] Save attempt ${attempt} failed:`, err?.message || err);

                        if (attempt < 3) {
                            const backoff = 1000 * Math.pow(2, attempt - 1);
                            setTimeout(() => doSaveWithRetry(attempt + 1), backoff);
                        } else {
                            setSaving(false);
                            setSaveError(err?.message || 'Failed to save interview');

                            toast.error("Failed to save to database", {
                                duration: 3000,
                            });
                        }
                    }
                };

                await doSaveWithRetry();
            })().catch(err => {
                console.error('❌ [Background] Unhandled error:', err);
                toast.dismiss(feedbackToastId);
                toast.error("An unexpected error occurred", {
                    duration: 3000,
                });
            });

        } catch (error) {
            console.error("Error ending call:", error);
            toast.error("Failed to end interview properly");
            setIsEnding(false);
        }
    };

    // Handle coding challenge submission
    const handleCodingSubmit = (code: string, language: string, timeSpent: number) => {
        if (!currentCodingQuestion) return;

        console.log('Coding challenge submitted, resuming audio');

        // Save to store
        addCodingChallenge({
            id: crypto.randomUUID(),
            question: currentCodingQuestion.question_text,
            code,
            language,
            timeSpent,
            submittedAt: new Date().toISOString()
        });

        // Send code to Aura for examination with context
        const timeSpentMinutes = Math.floor(timeSpent / 60);
        const timeSpentSeconds = timeSpent % 60;
        const timeSpentText = timeSpentMinutes > 0
            ? `${timeSpentMinutes} minute${timeSpentMinutes !== 1 ? 's' : ''} and ${timeSpentSeconds} second${timeSpentSeconds !== 1 ? 's' : ''}`
            : `${timeSpentSeconds} second${timeSpentSeconds !== 1 ? 's' : ''}`;

        const codeMessage = `I've completed the coding challenge. Time spent: ${timeSpentText}. Here's my ${language} solution:\n\`\`\`${language}\n${code}\n\`\`\`\n\nPlease review my solution and provide feedback.`;

        // Add to messages
        setMessages(prev => [...prev, {
            id: Date.now(),
            sender: 'user',
            text: codeMessage,
            timestamp: new Date().toISOString()
        }]);

        // Resume interview and audio
        setIsCodingModalOpen(false);
        setIsInterviewPaused(false);
        setCurrentCodingQuestion(null);

        // Resume audio recording and output
        resumeRecording();
        resumeAudioOutput();

        // Send the message to Aura
        sendTextMessage(codeMessage);

        toast.success("Code submitted! Aura will review it now.");
    };

    // Handle coding challenge abort
    const handleCodingAbort = () => {
        console.log('Coding challenge aborted, resuming audio');

        // Notify Aura that the candidate skipped the coding question
        const abortMessage = "I'd like to skip this coding question and move on to the next part of the interview.";

        setMessages(prev => [...prev, {
            id: Date.now(),
            sender: 'user',
            text: abortMessage,
            timestamp: new Date().toISOString()
        }]);

        setIsCodingModalOpen(false);
        setIsInterviewPaused(false);
        setCurrentCodingQuestion(null);

        // Resume audio recording and output
        resumeRecording();
        resumeAudioOutput();

        // Send the message to Aura
        sendTextMessage(abortMessage);

        toast.info("Coding challenge skipped. Interview resumed.");
    };

    const toggleMic = async () => {
        if (isRecording) {
            stopRecording();
            stopListening();
        } else {
            try {
                await startRecording();
                startListening();
            } catch (error) {
                console.error("Failed to start recording:", error);
                toast.error("Failed to start microphone. Please check permissions.");
            }
        }
    };

    // ========================================
    // KEYBOARD SHORTCUTS
    // ========================================
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Ctrl+Space: Toggle microphone
            if (e.code === 'Space' && e.ctrlKey) {
                e.preventDefault();
                toggleMic();
                toast.info(isRecording ? "Microphone muted" : "Microphone unmuted", {
                    duration: 1000
                });
            }
            // Ctrl+E: End interview
            if (e.code === 'KeyE' && e.ctrlKey) {
                e.preventDefault();
                handleEndCall();
            }
            // Ctrl+T: Toggle transcript visibility
            if (e.code === 'KeyT' && e.ctrlKey) {
                e.preventDefault();
                setShowTranscript(prev => !prev);
                toast.info(showTranscript ? "Transcript hidden" : "Transcript visible", {
                    duration: 1000
                });
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [toggleMic, handleEndCall, isRecording, showTranscript]);

    // ========================================
    // SMART PAUSE/RESUME ON TAB VISIBILITY
    // ========================================
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // User switched tabs - pause recording to save resources
                if (isRecording && !isInterviewPaused) {
                    pauseRecording();
                    console.log('📱 Tab inactive - paused recording');
                }
            } else {
                // User returned - resume if not manually paused
                if (!isRecording && !isInterviewPaused && connected) {
                    resumeRecording();
                    console.log('📱 Tab active - resumed recording');
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isRecording, isInterviewPaused, connected, pauseRecording, resumeRecording]);

    // ========================================
    // NETWORK ONLINE/OFFLINE DETECTION
    // ========================================
    useEffect(() => {
        const handleOnline = () => {
            console.log('🌐 Network connection restored');
            toast.success("✅ Internet connection restored", {
                description: "Reconnecting to interview...",
                duration: 3000,
            });
            // Trigger reconnection if we were disconnected
            if (!connected && hasConnectedRef.current) {
                hasConnectedRef.current = false; // Allow reconnection
            }
        };

        const handleOffline = () => {
            console.log('🌐 Network connection lost');
            toast.error("⚠️ No internet connection", {
                description: "Please check your network connection. Interview will auto-resume when connection is restored.",
                duration: Infinity, // Keep showing until online
                id: 'offline-toast', // Unique ID to dismiss later
            });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check initial state
        if (!navigator.onLine) {
            handleOffline();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            toast.dismiss('offline-toast'); // Dismiss offline toast on unmount
        };
    }, [connected]);


    // ========================================
    // RESOURCE CLEANUP
    // ========================================
    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => {
                    track.stop();
                    track.enabled = false;
                });
            }

            // Clear reconnect timeout
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }

            console.log('🧹 Cleaned up interview room resources');
        };
    }, []);

    return (
        <div className="relative h-screen w-screen bg-slate-950 overflow-hidden">
            {/* Fullscreen Video Background */}
            <div className="absolute inset-0">
                {!isCameraOn ? (
                    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-slate-900 to-slate-950 pb-20">
                        <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-700 mb-4">
                            <User className="h-12 w-12 sm:h-16 sm:w-16 text-slate-500" />
                        </div>
                        <p className="text-lg font-medium text-slate-400">Camera is turned off</p>
                    </div>
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
                    />
                )}
            </div>

            {/* Overlay Gradient for better text visibility */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

            {/* ========================================
                OPTIMIZATION UI ELEMENTS
                ======================================== */}

            {/* Interview Progress Bar */}
            {useMemo(() => {
                const totalDuration = session?.duration_minutes ? session.duration_minutes * 60 : (remaining_minutes * 60);
                const progress = ((totalDuration - timeLeft) / totalDuration) * 100;
                return (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800/50 z-30">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 transition-all duration-1000"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                    </div>
                );
            }, [timeLeft, session, remaining_minutes])}

            {/* AI Thinking Indicator */}
            {aiThinking && (
                <div className="absolute top-20 sm:top-24 right-3 sm:right-6 z-20 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-purple-500/20 backdrop-blur-md border border-purple-500/50 px-3 sm:px-4 py-2 rounded-full shadow-lg">
                        <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4 animate-pulse text-purple-400" />
                            <span className="text-xs sm:text-sm font-medium text-purple-300">Thinking...</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Connection Health Monitor */}
            {connected && (
                <div className="absolute top-3 sm:top-6 left-1/2 -translate-x-1/2 z-20">
                    <div className={`px-2.5 sm:px-3 py-1 rounded-full backdrop-blur-md border text-[10px] sm:text-xs font-medium flex items-center gap-1.5 shadow-lg transition-all duration-300 ${connectionHealth.quality === 'excellent'
                        ? 'bg-green-500/20 border-green-500/50 text-green-400'
                        : connectionHealth.quality === 'good'
                            ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                            : 'bg-red-500/20 border-red-500/50 text-red-400'
                        }`}>
                        {connectionHealth.quality === 'excellent' ? (
                            <Wifi className="h-3 w-3" />
                        ) : connectionHealth.quality === 'good' ? (
                            <Activity className="h-3 w-3" />
                        ) : (
                            <WifiOff className="h-3 w-3 animate-pulse" />
                        )}
                        <span className="hidden sm:inline">
                            {connectionHealth.latency}ms
                        </span>
                    </div>
                </div>
            )}

            {/* Poor Connection Warning Banner */}
            {connected && connectionHealth.quality === 'poor' && (
                <div className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-30 w-11/12 sm:w-auto animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-red-500/90 backdrop-blur-md border border-red-400 rounded-lg px-4 py-3 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <WifiOff className="h-5 w-5 text-white animate-pulse" />
                            <div>
                                <p className="text-white font-semibold text-sm">Poor Connection Detected</p>
                                <p className="text-red-100 text-xs">
                                    Latency: {connectionHealth.latency}ms • Check your internet connection
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Disconnection Warning */}
            {!connected && sessionLoaded && (
                <div className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-30 w-11/12 sm:w-auto animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-orange-500/90 backdrop-blur-md border border-orange-400 rounded-lg px-4 py-3 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <Loader2 className="h-5 w-5 text-white animate-spin" />
                            <div>
                                <p className="text-white font-semibold text-sm">
                                    {connectionHealth.reconnectAttempts > 0
                                        ? `Reconnecting... (Attempt ${connectionHealth.reconnectAttempts}/5)`
                                        : 'Connecting to AI Interviewer...'
                                    }
                                </p>
                                <p className="text-orange-100 text-xs">
                                    Please wait while we establish connection
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Live Transcript Overlay */}
            {showTranscript && messages.length > 0 && (
                <div className="absolute bottom-32 sm:bottom-36 left-3 sm:left-6 right-3 sm:right-6 max-h-48 z-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <ScrollArea className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg p-3 sm:p-4 shadow-2xl">
                        <div className="space-y-2">
                            {messages.slice(-5).map((msg, idx) => (
                                <div key={msg.id} className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    <p className={`text-xs sm:text-sm ${msg.sender === 'ai'
                                        ? 'text-purple-300'
                                        : 'text-cyan-300'
                                        }`}>
                                        <strong className="font-semibold">
                                            {msg.sender === 'ai' ? 'AI' : 'You'}:
                                        </strong>{' '}
                                        {msg.text.length > 150 ? msg.text.substring(0, 150) + '...' : msg.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-white/10 text-center">
                            <p className="text-[10px] text-slate-400">
                                Press Ctrl+T to hide • Showing last 5 messages
                            </p>
                        </div>
                    </ScrollArea>
                </div>
            )}

            {/* Timer - Top Left */}
            <div className="absolute top-3 sm:top-6 left-3 sm:left-6 z-20">
                <div className={`bg-black/60 backdrop-blur-md border border-white/10 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full font-mono text-[10px] sm:text-sm font-medium tracking-wider flex items-center gap-1.5 sm:gap-2 shadow-lg ${getTimerColor()}`}>
                    <div className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full animate-pulse ${timeLeft < 60 ? 'bg-red-500' : 'bg-green-500'}`} />
                    {subscriptionType === 'paid' && remaining_minutes > 999999 ? formatTime(elapsedTime) : formatTime(timeLeft)}
                </div>
            </div>

            {/* Aura AI Card - Top Right */}
            <div className="absolute top-3 sm:top-6 right-3 sm:right-6 z-20">
                <Card className="bg-black/60 backdrop-blur-xl border-white/10 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl w-44 sm:w-64 shadow-2xl">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        {/* Aura Avatar */}
                        <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 relative overflow-hidden shadow-lg">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/50 to-blue-600/50 animate-pulse" />
                            <Sparkles className="h-4 w-4 sm:h-6 sm:w-6 text-white relative z-10" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-white text-xs sm:text-base font-bold truncate bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                                Arjuna AI
                            </h3>
                            <p className="text-slate-400 text-[9px] sm:text-xs truncate">
                                {connected ? "AI Interviewer • Connected" : "Connecting..."}
                            </p>
                        </div>
                        {connected && (
                            <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                                <div className="h-2 w-0.5 sm:h-3 sm:w-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="h-2 w-0.5 sm:h-3 sm:w-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="h-2 w-0.5 sm:h-3 sm:w-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        )}
                    </div>

                    {/* Aura Speaking Visualizer */}
                    <div className="h-8 sm:h-16 flex items-center justify-center gap-0.5 sm:gap-1">
                        {[...Array(12)].map((_, i) => (
                            <div
                                key={i}
                                className={`w-0.5 sm:w-1.5 rounded-full transition-all duration-150 ease-in-out ${isAiSpeaking ? 'animate-pulse' : ''
                                    }`}
                                style={{
                                    background: isAiSpeaking
                                        ? `linear-gradient(to top, rgb(168, 85, 247), rgb(59, 130, 246), rgb(34, 211, 238))`
                                        : 'rgb(100, 116, 139)',
                                    height: isAiSpeaking ? `${Math.random() * 100}%` : '4px',
                                    opacity: isAiSpeaking ? 1 : 0.3
                                }}
                            />
                        ))}
                    </div>
                </Card>
            </div>

            {/* User Label - Bottom Left */}
            <div className="absolute bottom-20 sm:bottom-28 left-3 sm:left-6 z-20">
                <div className="bg-black/60 backdrop-blur-md border border-white/10 text-white px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full font-medium text-xs sm:text-sm shadow-lg">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <span>You</span>

                    </div>
                </div>
            </div>

            {/* Microphone Status - Bottom Right */}
            <div className="absolute bottom-20 sm:bottom-28 right-3 sm:right-6 z-20">
                <div className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-md border flex items-center gap-1.5 sm:gap-2 shadow-lg ${!isRecording
                    ? 'bg-red-500/20 border-red-500/50 text-red-400'
                    : isUserSpeaking
                        ? 'bg-green-500/20 border-green-500/50 text-green-400'
                        : isAiSpeaking
                            ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                            : 'bg-green-500/20 border-green-500/50 text-green-400'
                    }`}>
                    {!isRecording ? (
                        <MicOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    ) : isUserSpeaking ? (
                        <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-pulse" />
                    ) : isAiSpeaking ? (
                        <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4 opacity-50" />
                    ) : (
                        <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                    <span className="text-xs sm:text-sm font-medium hidden sm:inline">
                        {!isRecording ? "Muted" : isUserSpeaking ? "Speaking" : isAiSpeaking ? "AI Speaking" : "Listening"}
                    </span>
                </div>
            </div>

            {/* Floating Controls - Bottom Center */}
            <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-30">
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-full p-3 sm:p-4 shadow-2xl">
                    <div className="flex items-center gap-3 sm:gap-6">
                        {/* Mic Toggle */}
                        <Button
                            variant="outline"
                            size="icon"
                            className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full border-0 shadow-lg transition-all duration-300 ${isRecording
                                ? 'bg-slate-700/80 text-white hover:bg-slate-600'
                                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                }`}
                            onClick={toggleMic}
                            title={isRecording ? "Mute" : "Unmute"}
                        >
                            {isRecording ? <Mic className="h-5 w-5 sm:h-6 sm:w-6" /> : <MicOff className="h-5 w-5 sm:h-6 sm:w-6" />}
                        </Button>

                        {/* End Call */}
                        <Button
                            variant="destructive"
                            size="icon"
                            className="h-14 w-14 sm:h-16 sm:w-16 rounded-full shadow-2xl hover:scale-105 transition-transform bg-red-600 hover:bg-red-700 border-2 border-red-500"
                            onClick={handleEndCall}
                            disabled={isEnding}
                            title="End Interview"
                        >
                            {isEnding ? <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin" /> : <PhoneOff className="h-6 w-6 sm:h-8 sm:w-8" />}
                        </Button>

                        {/* Camera Toggle */}
                        <Button
                            variant="outline"
                            size="icon"
                            className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full border-0 shadow-lg transition-all duration-300 ${isCameraOn
                                ? 'bg-slate-700/80 text-white hover:bg-slate-600'
                                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                }`}
                            onClick={() => setIsCameraOn(!isCameraOn)}
                            title={isCameraOn ? "Turn off camera" : "Turn on camera"}
                        >
                            {isCameraOn ? <Video className="h-5 w-5 sm:h-6 sm:w-6" /> : <VideoOff className="h-5 w-5 sm:h-6 sm:w-6" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Coding Challenge Modal */}
            <CodingChallengeModal
                isOpen={isCodingModalOpen}
                question={currentCodingQuestion?.question_text || ''}
                onSubmit={handleCodingSubmit}
                onAbort={handleCodingAbort}
            />

            {/* Keyboard Shortcuts Help - Shows briefly at start (Desktop only) */}
            {connected && elapsedTime < 10 && (
                <div className="hidden sm:block absolute bottom-44 sm:bottom-48 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-black/90 backdrop-blur-xl border border-purple-500/30 rounded-lg px-4 py-3 shadow-2xl">
                        <p className="text-xs sm:text-sm text-purple-300 font-medium mb-2 text-center">⌨️ Keyboard Shortcuts</p>
                        <div className="space-y-1 text-[10px] sm:text-xs text-slate-300">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-400">Toggle Mic:</span>
                                <kbd className="px-2 py-0.5 bg-slate-700 rounded text-white font-mono">Ctrl+Space</kbd>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-400">End Interview:</span>
                                <kbd className="px-2 py-0.5 bg-slate-700 rounded text-white font-mono">Ctrl+E</kbd>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-400">Toggle Transcript:</span>
                                <kbd className="px-2 py-0.5 bg-slate-700 rounded text-white font-mono">Ctrl+T</kbd>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
