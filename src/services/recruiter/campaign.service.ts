import { supabase, publicSupabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export interface Campaign {
    id: string;
    org_id: string;
    created_by: string;
    title: string;
    position: string;
    description: string | null;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | null;
    access_token: string;
    is_active: boolean;
    expiry_date: string | null;
    max_duration: number;
    candidate_email: string | null;
    config: Json;
    created_at: string;
    updated_at: string;
}

export interface CreateCampaignData {
    title: string;
    position: string;
    description?: string;
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
    expiryDate?: string;
    maxDuration?: number;
    candidateEmail?: string;
    skills?: string[];
    config?: Json;
}

export const campaignService = {
    /**
     * Get all campaigns for the user's organization
     */
    async getCampaigns() {
        try {
            const { data, error } = await supabase
                .from("hiring_campaigns" as any)
                .select(`
                    id,
                    org_id,
                    created_by,
                    title,
                    position,
                    description,
                    difficulty,
                    access_token,
                    is_active,
                    expiry_date,
                    max_duration,
                    candidate_email,
                    config,
                    created_at,
                    updated_at,
                    interview_sessions (
                        id,
                        status,
                        score
                    )
                `)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        } catch (error: any) {
            console.error("Error fetching campaigns:", error?.message || error);
            return [];
        }
    },

    /**
     * Create a new hiring campaign
     */
    async createCampaign(data: CreateCampaignData) {
        try {
            // 1. Get user's organization
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error("User not authenticated");
            }

            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("*")
                .eq('id', user.id)
                .single();

            console.log("DEBUG: Fetching profile for campaign creation:", {
                profile,
                error: profileError,
                org_id: (profile as any)?.org_id
            });

            if (profileError) {
                console.error("DEBUG: Profile fetch error:", profileError);
                throw new Error(`Failed to fetch profile: ${profileError.message}`);
            }

            if (!(profile as any)?.org_id) {
                console.error("DEBUG: No org_id found on profile:", profile);
                throw new Error("User organization not found (org_id is null)");
            }

            // 2. Generate access token
            const accessToken = Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15);

            // 3. Insert campaign
            const { data: campaign, error } = await supabase
                .from("hiring_campaigns" as any)
                .insert({
                    org_id: (profile as any).org_id,
                    created_by: (await supabase.auth.getUser()).data.user?.id,
                    title: data.title,
                    position: data.position,
                    description: data.description || "",
                    difficulty: data.difficulty || "Intermediate",
                    access_token: accessToken,
                    expiry_date: data.expiryDate || null,
                    max_duration: data.maxDuration || 60,
                    candidate_email: data.candidateEmail || null,
                    config: {
                        ...(data.config as Record<string, any> || {}),
                        skills: data.skills || [],
                    },
                } as unknown as never)
                .select()
                .single();

            if (error) throw error;
            return campaign;
        } catch (error) {
            console.error("Error creating campaign:", error);
            throw error;
        }
    },

    /**
     * Get campaign by access token (Public)
     */
    async getCampaignByToken(token: string) {
        try {
            const { data, error } = await publicSupabase
                .from("hiring_campaigns" as any)
                .select(`
                    id,
                    org_id,
                    created_by,
                    title,
                    position,
                    description,
                    difficulty,
                    access_token,
                    is_active,
                    expiry_date,
                    max_duration,
                    candidate_email,
                    config,
                    created_at,
                    updated_at,
                    interview_sessions (
                        id,
                        candidate_email
                    )
                `)
                .eq("access_token", token)
                .single();

            if (error) throw error;
            return data;
        } catch (error: any) {
            console.error("❌ [CAMPAIGN_SERVICE] Detailed Error fetching campaign by token:");
            console.error(JSON.stringify(error, null, 2));
            return null;
        }
    },

    /**
     * Get campaign by ID with sessions
     */
    async getCampaignById(id: string) {
        try {
            const { data, error } = await supabase
                .from("hiring_campaigns" as any)
                .select(`
                    id,
                    org_id,
                    created_by,
                    title,
                    position,
                    description,
                    difficulty,
                    access_token,
                    is_active,
                    expiry_date,
                    max_duration,
                    candidate_email,
                    config,
                    created_at,
                    updated_at,
                    interview_sessions (
                        id,
                        candidate_name,
                        candidate_email,
                        status,
                        score,
                        created_at,
                        completed_at,
                        feedback
                    )
                `)
                .eq("id", id)
                .single();

            if (error) throw error;
            return data;
        } catch (error: any) {
            console.error("Error fetching campaign by ID:", error?.message || error, error?.details);
            return null;
        }
    },

    /**
     * Get all candidates for the organization's campaigns
     */
    async getCandidates() {
        try {
            const { data, error } = await supabase
                .from("interview_sessions")
                .select(`
                    id,
                    candidate_name,
                    candidate_email,
                    status,
                    score,
                    created_at,
                    completed_at,
                    score,
                    campaign:hiring_campaigns!inner (
                        id,
                        title,
                        position
                    )
                `)
                .not("campaign_id", "is", null)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as any[];
        } catch (error) {
            console.error("Error fetching candidates:", error);
            return [];
        }
    },
    /**
     * Mark a campaign as consumed (one-time use)
     */
    async markCampaignConsumed(id: string) {
        try {
            const { error } = await supabase
                .from("hiring_campaigns" as any)
                .update({ is_active: false } as never)
                .eq("id", id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Error marking campaign as consumed:", error);
            return false;
        }
    },

    /**
     * Atomically claim a campaign link (one-time use)
     */
    async claimCampaign(id: string) {
        try {
            // Using RPC to bypass RLS for guests claiming one-time links
            const { data, error } = await (supabase.rpc as any)('claim_campaign', {
                p_campaign_id: id
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error claiming campaign:", error);
            return false;
        }
    }
};
