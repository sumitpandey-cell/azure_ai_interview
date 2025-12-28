import { supabase } from "@/integrations/supabase/client";

export interface Template {
    id: string;
    title: string;
    description: string;
    icon_name: string;
    color: string;
    interview_type: 'Technical' | 'Behavioral' | 'Creative';
    skills: string[];
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    is_active: boolean;
    is_popular: boolean;
    category: string | null;
    created_at: string;
    updated_at: string;
}

export interface TemplateInsert {
    id: string;
    title: string;
    description: string;
    icon_name: string;
    color: string;
    interview_type: 'Technical' | 'Behavioral' | 'Creative';
    skills: string[];
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    is_active?: boolean;
    is_popular?: boolean;
    category?: string | null;
}

export interface TemplateUpdate {
    title?: string;
    description?: string;
    icon_name?: string;
    color?: string;
    interview_type?: 'Technical' | 'Behavioral' | 'Creative';
    skills?: string[];
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
    is_active?: boolean;
    is_popular?: boolean;
    category?: string | null;
}

/**
 * Template Service
 * Handles CRUD operations for interview templates
 */
export const templateService = {
    /**
     * Get all active templates
     */
    async getAllTemplates(): Promise<Template[]> {
        try {
            const { data, error } = await supabase
                .from('templates')
                .select('*')
                .eq('is_active', true)
                .order('title', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching templates:', error);
            return [];
        }
    },

    /**
     * Get template by ID
     */
    async getTemplateById(id: string): Promise<Template | null> {
        try {
            const { data, error } = await supabase
                .from('templates')
                .select('*')
                .eq('id', id)
                .eq('is_active', true)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error(`Error fetching template ${id}:`, error);
            return null;
        }
    },

    /**
     * Get popular templates
     */
    async getPopularTemplates(): Promise<Template[]> {
        try {
            const { data, error } = await supabase
                .from('templates')
                .select('*')
                .eq('is_active', true)
                .eq('is_popular', true)
                .order('title', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching popular templates:', error);
            return [];
        }
    },

    /**
     * Get templates by category
     */
    async getTemplatesByCategory(category: string): Promise<Template[]> {
        try {
            const { data, error } = await supabase
                .from('templates')
                .select('*')
                .eq('is_active', true)
                .eq('category', category)
                .order('title', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error(`Error fetching templates for category ${category}:`, error);
            return [];
        }
    },

    /**
     * Search templates by query (searches title, description, and skills)
     */
    async searchTemplates(query: string): Promise<Template[]> {
        try {
            const lowerQuery = query.toLowerCase();

            const { data, error } = await supabase
                .from('templates')
                .select('*')
                .eq('is_active', true);

            if (error) throw error;

            // Client-side filtering for more flexible search
            const filtered = (data || []).filter(template =>
                template.title.toLowerCase().includes(lowerQuery) ||
                template.description.toLowerCase().includes(lowerQuery) ||
                template.skills.some((skill: string) => skill.toLowerCase().includes(lowerQuery))
            );

            return filtered;
        } catch (error) {
            console.error('Error searching templates:', error);
            return [];
        }
    },

    /**
     * Create a new template (admin only)
     */
    async createTemplate(templateData: TemplateInsert): Promise<Template | null> {
        try {
            const { data, error } = await supabase
                .from('templates')
                .insert(templateData)
                .select()
                .single();

            if (error) throw error;
            console.log('✓ Template created:', data.id);
            return data;
        } catch (error) {
            console.error('Error creating template:', error);
            return null;
        }
    },

    /**
     * Update template (admin only)
     */
    async updateTemplate(id: string, updates: TemplateUpdate): Promise<Template | null> {
        try {
            const { data, error } = await supabase
                .from('templates')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            console.log('✓ Template updated:', id);
            return data;
        } catch (error) {
            console.error(`Error updating template ${id}:`, error);
            return null;
        }
    },

    /**
     * Soft delete template by setting is_active to false (admin only)
     */
    async deleteTemplate(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('templates')
                .update({ is_active: false })
                .eq('id', id);

            if (error) throw error;
            console.log('✓ Template deleted (soft):', id);
            return true;
        } catch (error) {
            console.error(`Error deleting template ${id}:`, error);
            return false;
        }
    },

    /**
     * Get templates count by category
     */
    async getTemplatesCountByCategory(): Promise<Record<string, number>> {
        try {
            const { data, error } = await supabase
                .from('templates')
                .select('category')
                .eq('is_active', true);

            if (error) throw error;

            const counts: Record<string, number> = {};
            (data || []).forEach(template => {
                const category = template.category || 'Other';
                counts[category] = (counts[category] || 0) + 1;
            });

            return counts;
        } catch (error) {
            console.error('Error getting template counts:', error);
            return {};
        }
    },
};
