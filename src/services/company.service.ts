import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type CompanyTemplate = Tables<"company_templates">;
export type CompanyQuestion = Tables<"company_questions">;
export type Domain = Tables<"domains">;
export type Topic = Tables<"topics">;

/**
 * Company Service
 * Handles company templates, questions, domains, and topics
 */
export const companyService = {
    /**
     * Get all active companies
     */
    async getCompanies(): Promise<CompanyTemplate[]> {
        try {
            const { data, error } = await supabase
                .from("company_templates")
                .select("*")
                .eq("is_active", true)
                .order("name", { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Error fetching companies:", error);
            return [];
        }
    },

    /**
     * Get company by slug
     */
    async getCompanyBySlug(slug: string): Promise<CompanyTemplate | null> {
        try {
            const { data, error } = await supabase
                .from("company_templates")
                .select("*")
                .eq("slug", slug)
                .eq("is_active", true)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error fetching company:", error);
            return null;
        }
    },

    /**
     * Get questions for a company
     */
    async getCompanyQuestions(
        companyId: string,
        filters?: {
            questionType?: string;
            difficulty?: string;
            role?: string;
            experienceLevel?: string;
        }
    ): Promise<CompanyQuestion[]> {
        try {
            let query = supabase
                .from("company_questions")
                .select("*")
                .eq("company_id", companyId)
                .eq("is_active", true);

            if (filters?.questionType) {
                query = query.eq("question_type", filters.questionType as any);
            }
            if (filters?.difficulty) {
                query = query.eq("difficulty", filters.difficulty as any);
            }
            if (filters?.role) {
                query = query.eq("role", filters.role as any);
            }
            if (filters?.experienceLevel) {
                query = query.eq("experience_level", filters.experienceLevel as any);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Error fetching company questions:", error);
            return [];
        }
    },

    /**
     * Get all domains
     */
    async getDomains(): Promise<Domain[]> {
        try {
            const { data, error } = await supabase
                .from("domains")
                .select("*")
                .order("name", { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Error fetching domains:", error);
            return [];
        }
    },

    /**
     * Get topics for a domain
     */
    async getTopics(domainId?: string): Promise<Topic[]> {
        try {
            let query = supabase
                .from("topics")
                .select("*")
                .order("name", { ascending: true });

            if (domainId) {
                query = query.eq("domain_id", domainId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Error fetching topics:", error);
            return [];
        }
    },
};
