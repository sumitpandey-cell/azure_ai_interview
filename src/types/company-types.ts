// Type definitions for company-based interview templates

export interface CompanyTemplate {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  industry: string | null;
  description: string | null;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | null;
  common_roles: string[];
  metadata: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyQuestion {
  id: string;
  company_id: string;
  question_text: string;
  question_type: 'Technical' | 'Behavioral' | 'System Design' | 'Coding' | 'Case Study';
  difficulty: 'Easy' | 'Medium' | 'Hard' | null;
  role: string | null;
  experience_level: 'Entry' | 'Mid' | 'Senior' | 'Staff' | 'Principal' | null;
  tags: string[];
  metadata: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyInterviewConfig {
  companyTemplateId: string;
  companyName: string;
  role: string;
  experienceLevel?: string;
  selectedQuestions: CompanyQuestion[];
}

export interface InterviewSessionConfig {
  skills?: string[];
  jobDescription?: string | null;
  duration?: number;
  companyInterviewConfig?: CompanyInterviewConfig;
}
