import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FeedbackData } from '@/lib/gemini-feedback';
import { CompanyQuestion } from '@/types/company-types';
import { CodingChallenge } from '@/types/coding-challenge-types';

interface Message {
    id: number;
    sender: 'user' | 'ai';
    text: string;
    timestamp?: string;
}

// Complete interview session data structure
interface InterviewSessionData {
    id: string;
    user_id: string;
    interview_type: string;
    position: string;
    status: string;
    config: {
        interviewMode?: 'general' | 'company';
        companyId?: string;
        companyName?: string;
        role?: string;
        experienceLevel?: string;
        skills?: string[];
        jobDescription?: string;
        difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
        selectedAvatar?: string;
        selectedVoice?: string;
        companyInterviewConfig?: {
            companyTemplateId: string;
            companyName: string;
            role: string;
            experienceLevel: string;
        };
    };
    created_at: string;
    duration_seconds?: number;
    transcript?: any;
    feedback?: any;
    score?: number;
}

interface InterviewState {
    // Current session data
    currentSession: InterviewSessionData | null;

    // AI feedback and transcript
    feedback: FeedbackData | null;
    transcript: Message[];

    // Loading states
    isLoading: boolean;
    error: string | null;
    isSaving: boolean;
    saveError: string | null;

    // Company interview state
    companyTemplateId: string | null;
    companyQuestions: CompanyQuestion[];

    // Coding challenge state
    codingChallenges: CodingChallenge[];
    currentCodingQuestion: CompanyQuestion | null;

    // Actions
    setCurrentSession: (session: InterviewSessionData | null) => void;
    updateSessionConfig: (config: Partial<InterviewSessionData['config']>) => void;
    setFeedback: (feedback: FeedbackData) => void;
    setTranscript: (transcript: Message[]) => void;
    setLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
    setSaving: (isSaving: boolean) => void;
    setSaveError: (error: string | null) => void;
    setCompanyData: (templateId: string, questions: CompanyQuestion[]) => void;
    clearCompanyData: () => void;
    addCodingChallenge: (challenge: CodingChallenge) => void;
    setCurrentCodingQuestion: (question: CompanyQuestion | null) => void;
    clearFeedback: () => void;
    clearSession: () => void;
}

export const useInterviewStore = create<InterviewState>()(
    persist(
        (set, get) => ({
            // Current session data
            currentSession: null,

            // AI feedback and transcript
            feedback: null,
            transcript: [],

            // Loading states
            isLoading: false,
            error: null,
            isSaving: false,
            saveError: null,

            // Company interview state
            companyTemplateId: null,
            companyQuestions: [],

            // Coding challenge state
            codingChallenges: [],
            currentCodingQuestion: null,

            // Actions
            setCurrentSession: (session) => set({ currentSession: session }),

            updateSessionConfig: (config) => set((state) => ({
                currentSession: state.currentSession ? {
                    ...state.currentSession,
                    config: { ...state.currentSession.config, ...config }
                } : null
            })),

            setFeedback: (feedback) => set({ feedback, isLoading: false, error: null }),
            setTranscript: (transcript) => set({ transcript }),
            setLoading: (isLoading) => set({ isLoading }),
            setError: (error) => set({ error, isLoading: false }),
            setSaving: (isSaving) => set({ isSaving }),
            setSaveError: (error) => set({ saveError: error, isSaving: false }),

            setCompanyData: (templateId, questions) => set({
                companyTemplateId: templateId,
                companyQuestions: questions
            }),

            clearCompanyData: () => set({
                companyTemplateId: null,
                companyQuestions: []
            }),

            addCodingChallenge: (challenge) => set((state) => ({
                codingChallenges: [...state.codingChallenges, challenge]
            })),

            setCurrentCodingQuestion: (question) => set({ currentCodingQuestion: question }),

            clearFeedback: () => set({ feedback: null }),

            clearSession: () => set({
                currentSession: null,
                feedback: null,
                transcript: [],
                companyTemplateId: null,
                companyQuestions: [],
                codingChallenges: [],
                currentCodingQuestion: null,
                error: null,
                saveError: null
            })
        }),
        {
            name: 'interview-store',
            partialize: (state) => ({
                currentSession: state.currentSession,
                companyTemplateId: state.companyTemplateId,
                companyQuestions: state.companyQuestions
            })
        }
    )
);
