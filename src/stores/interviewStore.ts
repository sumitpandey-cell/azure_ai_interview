import { create } from 'zustand';
import type { Json } from '@/integrations/supabase/types';

export interface TranscriptEntry {
    speaker: 'user' | 'ai';
    text: string;
    timestamp: number;
    isComplete: boolean;
}

export interface InterviewFeedback {
    sessionId: string;
    feedback: Json;
    score: number;
    generatedAt: number;
}

export interface SessionData {
    id: string;
    position: string;
    interview_type: string;
    status: string;
    config: Json;
    created_at?: string;
}

interface InterviewStore {
    // Transcripts
    transcripts: TranscriptEntry[];
    addTranscript: (transcript: TranscriptEntry) => void;
    updateLastTranscript: (transcript: TranscriptEntry) => void;
    clearTranscripts: () => void;

    // Feedback
    recentFeedback: InterviewFeedback | null;
    setRecentFeedback: (feedback: InterviewFeedback) => void;
    clearRecentFeedback: () => void;

    // Session state
    currentSessionId: string | null;
    currentSessionData: SessionData | null;
    setCurrentSessionId: (sessionId: string) => void;
    setCurrentSessionData: (sessionData: SessionData) => void;
}

export const useInterviewStore = create<InterviewStore>((set) => ({
    // Transcripts
    transcripts: [],

    addTranscript: (transcript) => set((state) => {
        // Check for duplicates in the last 3 entries
        const isDuplicate = state.transcripts.slice(-3).some(
            (entry) =>
                entry.speaker === transcript.speaker &&
                entry.text === transcript.text &&
                entry.isComplete === transcript.isComplete
        );

        if (isDuplicate) {
            return state;
        }

        // Add and sort by timestamp to ensure correct order
        const newTranscripts = [...state.transcripts, transcript].sort((a, b) => a.timestamp - b.timestamp);
        return { transcripts: newTranscripts };
    }),

    updateLastTranscript: (transcript) => set((state) => {
        const lastIndex = state.transcripts.length - 1;

        // Only update if there's an existing partial transcript from the same speaker
        if (
            lastIndex >= 0 &&
            state.transcripts[lastIndex].speaker === transcript.speaker &&
            !state.transcripts[lastIndex].isComplete
        ) {
            const updated = [...state.transcripts];
            updated[lastIndex] = transcript;
            return { transcripts: updated };
        }

        // Check for duplicates (same speaker, same text) to prevent double-adding complete messages
        if (
            lastIndex >= 0 &&
            state.transcripts[lastIndex].speaker === transcript.speaker &&
            state.transcripts[lastIndex].text === transcript.text
        ) {
            return state;
        }

        // Otherwise, add as new transcript and sort
        const newTranscripts = [...state.transcripts, transcript].sort((a, b) => a.timestamp - b.timestamp);
        return { transcripts: newTranscripts };
    }),

    clearTranscripts: () => set({ transcripts: [] }),

    // Feedback
    recentFeedback: null,

    setRecentFeedback: (feedback) => {
        set({ recentFeedback: feedback });
    },

    clearRecentFeedback: () => set({ recentFeedback: null }),

    // Session state
    currentSessionId: null,
    currentSessionData: null,
    setCurrentSessionId: (sessionId) => set({ currentSessionId: sessionId }),
    setCurrentSessionData: (sessionData) => {
        set({
            currentSessionData: sessionData,
            currentSessionId: sessionData.id
        });
    },
}));
