import { useState, useEffect } from 'react';
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

    const fetchQuestions = async () => {
        if (!companyId) {
            setQuestions([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            console.log('Fetching questions for:', { companyId, role, questionType });
            // Build query for company_questions table
            let query = supabase
                .from('company_questions')
                .select('*')
                .eq('company_id', companyId)
                .eq('is_active', true);

            console.log("sfnkjnskjgnksngjk",query)
            // Add role filter if provided
            if (role) {
                query = query.or(`role.eq.${role},role.is.null`);
                console.log(query)
            }

            // Add question type filter if provided
            if (questionType) {
                query = query.eq('question_type', questionType);
            }

            // Fetch all matching questions first
            const { data: allQuestions, error: fetchError } = await query;

            console.log('Supabase response:', { allQuestions, fetchError });

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

            console.log('Final selected questions:', selectedQuestions);
            setQuestions(selectedQuestions as unknown as CompanyQuestion[]);
        } catch (err: any) {
            console.error('Error fetching company questions:', err);
            const errorMessage = err.message || 'Failed to fetch company questions';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, [companyId, count, role, questionType]);

    return {
        questions,
        isLoading,
        error,
        refetch: fetchQuestions,
    };
}
