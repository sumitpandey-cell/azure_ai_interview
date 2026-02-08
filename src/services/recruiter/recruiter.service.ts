import { supabase } from "@/integrations/supabase/client";
import { Campaign, TopCandidate, Stats } from "../../types/recruiter-types";

export const recruiterService = {
    /**
     * Get recruiter's organization ID
     */
    async getProfileOrg(userId: string): Promise<string | null> {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', userId)
            .single();

        if (error || !profile?.org_id) return null;
        return profile.org_id;
    },

    /**
     * Fetch all dashboard data for a recruiter
     */
    async fetchDashboardData(userId: string) {
        const orgId = await this.getProfileOrg(userId);
        if (!orgId) return null;

        // 1. Fetch campaigns
        const { data: campaignsData, error: campaignsError } = await supabase
            .from('hiring_campaigns' as any)
            .select('*')
            .eq('org_id', orgId)
            .order('created_at', { ascending: false });

        if (campaignsError) throw campaignsError;

        // 2. Fetch sessions for stats
        const campaignsWithStats = await Promise.all(
            (campaignsData || []).map(async (campaign: any) => {
                const { data: sessions } = await supabase
                    .from('interview_sessions')
                    .select('id, score, created_at')
                    .eq('campaign_id', campaign.id);

                const applicantCount = sessions?.length || 0;
                const scores = (sessions as any[])?.filter(s => s.score !== null).map(s => s.score) || [];
                const avgScore = scores.length > 0
                    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                    : 0;

                return {
                    ...campaign,
                    applicant_count: applicantCount,
                    avg_score: avgScore
                };
            })
        );

        // 3. Calculate Overall Stats
        const activeCampaignsCount = campaignsWithStats.filter(c => c.is_active).length;
        const totalApplicantsCount = campaignsWithStats.reduce((sum, c) => sum + (c.applicant_count || 0), 0);

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const { data: recentSessions } = await supabase
            .from('interview_sessions')
            .select('id, campaign_id')
            .in('campaign_id', campaignsWithStats.map(c => c.id))
            .gte('created_at', oneWeekAgo.toISOString());

        const interviewsThisWeekCount = recentSessions?.length || 0;

        const allScores = campaignsWithStats
            .filter(c => c.avg_score && c.avg_score > 0)
            .map(c => c.avg_score || 0);
        const overallAvgScore = allScores.length > 0
            ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
            : 0;

        const stats: Stats = {
            activeCampaigns: activeCampaignsCount,
            totalApplicants: totalApplicantsCount,
            interviewsThisWeek: interviewsThisWeekCount,
            avgScore: overallAvgScore
        };

        // 4. Fetch top candidates
        const { data: topSessionsData } = await supabase
            .from('interview_sessions')
            .select('id, score, created_at, user_id, campaign_id, candidate_name, candidate_email')
            .in('campaign_id', (campaignsWithStats as any[]).map(c => c.id))
            .not('score', 'is', null)
            .order('score', { ascending: false })
            .limit(4);

        const formattedCandidates: TopCandidate[] = await Promise.all(
            (topSessionsData || []).map(async (session: any) => {
                let profile = null;
                if (session.user_id) {
                    const { data } = await supabase
                        .from('profiles')
                        .select('full_name, email')
                        .eq('id', session.user_id)
                        .single();
                    profile = data;
                }

                const campaign = campaignsWithStats.find(c => c.id === session.campaign_id);

                return {
                    id: session.id,
                    full_name: profile?.full_name || session.candidate_name || 'Anonymous',
                    email: profile?.email || session.candidate_email || '',
                    score: session.score || 0,
                    campaign_title: campaign?.title || 'Unknown Campaign',
                    created_at: session.created_at
                };
            })
        );

        return {
            campaigns: campaignsWithStats,
            stats,
            topCandidates: formattedCandidates
        };
    }
};
