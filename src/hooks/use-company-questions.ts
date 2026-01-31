import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CompanyQuestion } from '@/types/company-types';
import { toast } from 'sonner';

interface UseCompanyQuestionsOptions {
    companyId: string | null;
    count?: number;
    role?: string | null;
    questionType?: 'Technical' | 'Behavioral' | 'System Design' | 'Coding' | 'Case Study' | null;
}

interface UseCompanyQuestionsReturn {
    questions: CompanyQuestion[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useCompanyQuestions({
    companyId,
    count = 5,
    role = null,
    questionType = null,
}: UseCompanyQuestionsOptions): UseCompanyQuestionsReturn {
    const [questions, setQuestions] = useState<CompanyQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchQuestions = useCallback(async () => {
        if (!companyId) {
            setQuestions([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Build query for company_questions table
            let query = supabase
                .from('company_questions')
                .select('*')
                .eq('company_id', companyId)
                .eq('is_active', true);

            // Add role filter if provided
            if (role) {
                query = query.or(`role.eq.${role},role.is.null`);
            }

            // Add question type filter if provided
            if (questionType) {
                query = query.eq('question_type', questionType);
            }

            // Fetch all matching questions first
            const { data: allQuestions, error: fetchError } = await query;


            if (fetchError) {
                throw fetchError;
            }

            // Randomly select 'count' questions from the results
            let selectedQuestions = allQuestions || [];

            if (selectedQuestions.length > count) {
                // Shuffle and take first 'count' items
                selectedQuestions = selectedQuestions
                    .sort(() => Math.random() - 0.5)
                    .slice(0, count);
            }

            setQuestions(selectedQuestions as unknown as CompanyQuestion[]);
        } catch (err: unknown) {
            console.error('Error fetching company questions:', err);
            const errorMessage = (err as { message?: string }).message || 'Failed to fetch company questions';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [companyId, count, role, questionType]);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    return {
        questions,
        isLoading,
        error,
        refetch: fetchQuestions,
    };
}
