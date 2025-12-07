export interface SkillScore {
    name: string;
    score: number;
    feedback: string;
}

export interface PerformanceMetrics {
    sessionId: string;
    position: string;
    interviewType: string;
    completedAt: string;
    skills: SkillScore[];
    overallScore: number;
}

export interface PerformanceHistory {
    recentInterviews: PerformanceMetrics[];
    averageScores: {
        technicalKnowledge: number;
        communication: number;
        problemSolving: number;
        adaptability: number;
        overall: number;
    };
    trend: 'improving' | 'declining' | 'consistent' | 'insufficient_data';
}
