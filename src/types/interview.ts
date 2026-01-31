import { CompanyQuestion } from "./company-types";

export interface CompanyInterviewConfig {
    companyTemplateId: string;
    companyName: string;
    role: string;
    experienceLevel?: string;
    companyId?: string;
    selectedQuestions?: CompanyQuestion[];
}

export interface SessionConfig {
    interviewMode?: 'general' | 'company';
    skills?: string[];
    jobDescription?: string;
    duration?: number;
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | string;
    selectedAvatar?: string;
    selectedVoice?: string;
    useResume?: boolean;
    companyName?: string;
    role?: string;
    experienceLevel?: string;
    company?: { name: string };
    companyInterviewConfig?: CompanyInterviewConfig;
    currentStage?: 'setup' | 'live' | 'completed';
}
