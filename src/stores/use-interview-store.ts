import { create } from 'zustand';
import { FeedbackData } from '@/lib/gemini-feedback';
import { CompanyQuestion } from '@/types/company-types';
import { CodingChallenge } from '@/types/coding-challenge-types';

interface Message {
    id: number;
    sender: 'user' | 'ai';
    text: string;
    timestamp?: string;
}

interface InterviewState {
    feedback: FeedbackData | null;
    transcript: Message[];
    isLoading: boolean;
    error: string | null;
    // Persistence state
    isSaving: boolean;
    saveError: string | null;
    // Company interview state
    companyTemplateId: string | null;
    companyQuestions: CompanyQuestion[];
    // Coding challenge state
    codingChallenges: CodingChallenge[];
    currentCodingQuestion: CompanyQuestion | null;
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
}

export const useInterviewStore = create<InterviewState>((set) => ({
    feedback: null,
    transcript: [],
    isLoading: false,
    error: null,
    isSaving: false,
    saveError: null,
    companyTemplateId: null,
    companyQuestions: [],
    codingChallenges: [],
    currentCodingQuestion: null,
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
    clearFeedback: () => set({
        feedback: null,
        transcript: [],
        isLoading: false,
        error: null,
        companyTemplateId: null,
        companyQuestions: [],
        codingChallenges: [],
        currentCodingQuestion: null
    }),
}));
