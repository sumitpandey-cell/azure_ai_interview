export interface Campaign {
    id: string;
    title: string;
    position: string;
    is_active: boolean;
    created_at: string;
    applicant_count?: number;
    avg_score?: number;
}

export interface TopCandidate {
    id: string;
    full_name: string;
    email: string;
    score: number;
    campaign_title: string;
    created_at: string;
}

export interface Stats {
    activeCampaigns: number;
    totalApplicants: number;
    interviewsThisWeek: number;
    avgScore: number;
}
