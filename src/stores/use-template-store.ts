import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { companyService } from '@/services/company.service';
import type { CompanyTemplate, CompanyQuestion, Domain, Topic } from '@/services/company.service';

interface TemplateState {
    // Templates data
    companies: CompanyTemplate[];
    selectedCompany: CompanyTemplate | null;
    questions: CompanyQuestion[];
    domains: Domain[];
    topics: Topic[];

    // Loading and error states
    loading: boolean;
    error: string | null;

    // Cache management
    lastFetch: number | null;
    cacheValid: boolean;

    // Actions
    fetchCompanies: () => Promise<void>;
    fetchCompanyBySlug: (slug: string) => Promise<void>;
    fetchCompanyQuestions: (companyId: string, filters?: {
        questionType?: string;
        difficulty?: string;
        role?: string;
        experienceLevel?: string;
    }) => Promise<void>;
    fetchDomains: () => Promise<void>;
    fetchTopics: (domainId?: string) => Promise<void>;
    selectCompany: (company: CompanyTemplate | null) => void;
    clearCache: () => void;
    setError: (error: string | null) => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useTemplateStore = create<TemplateState>()(
    persist(
        (set, get) => ({
            // Initial state
            companies: [],
            selectedCompany: null,
            questions: [],
            domains: [],
            topics: [],
            loading: false,
            error: null,
            lastFetch: null,
            cacheValid: false,

            // Fetch all companies
            fetchCompanies: async () => {
                const state = get();

                // Check cache validity
                if (state.cacheValid && state.lastFetch &&
                    Date.now() - state.lastFetch < CACHE_DURATION &&
                    state.companies.length > 0) {
                    return; // Use cached data
                }

                try {
                    set({ loading: true, error: null });
                    const companies = await companyService.getCompanies();
                    set({
                        companies,
                        loading: false,
                        lastFetch: Date.now(),
                        cacheValid: true,
                    });
                } catch (error) {
                    console.error('Error fetching companies:', error);
                    set({
                        error: 'Failed to load companies',
                        loading: false,
                    });
                }
            },

            // Fetch company by slug
            fetchCompanyBySlug: async (slug: string) => {
                try {
                    set({ loading: true, error: null });
                    const company = await companyService.getCompanyBySlug(slug);
                    set({
                        selectedCompany: company,
                        loading: false,
                    });
                } catch (error) {
                    console.error('Error fetching company:', error);
                    set({
                        error: 'Failed to load company details',
                        loading: false,
                    });
                }
            },

            // Fetch questions for a company
            fetchCompanyQuestions: async (companyId: string, filters) => {
                try {
                    set({ loading: true, error: null });
                    const questions = await companyService.getCompanyQuestions(companyId, filters);
                    set({
                        questions,
                        loading: false,
                    });
                } catch (error) {
                    console.error('Error fetching questions:', error);
                    set({
                        error: 'Failed to load questions',
                        loading: false,
                    });
                }
            },

            // Fetch all domains
            fetchDomains: async () => {
                try {
                    set({ loading: true, error: null });
                    const domains = await companyService.getDomains();
                    set({
                        domains,
                        loading: false,
                    });
                } catch (error) {
                    console.error('Error fetching domains:', error);
                    set({
                        error: 'Failed to load domains',
                        loading: false,
                    });
                }
            },

            // Fetch topics
            fetchTopics: async (domainId) => {
                try {
                    set({ loading: true, error: null });
                    const topics = await companyService.getTopics(domainId);
                    set({
                        topics,
                        loading: false,
                    });
                } catch (error) {
                    console.error('Error fetching topics:', error);
                    set({
                        error: 'Failed to load topics',
                        loading: false,
                    });
                }
            },

            // Select a company
            selectCompany: (company) => {
                set({ selectedCompany: company });
            },

            // Clear cache
            clearCache: () => {
                set({
                    cacheValid: false,
                    lastFetch: null,
                    companies: [],
                    selectedCompany: null,
                    questions: [],
                });
            },

            // Set error
            setError: (error) => {
                set({ error });
            },
        }),
        {
            name: 'template-store',
            partialize: (state) => ({
                companies: state.companies,
                lastFetch: state.lastFetch,
                cacheValid: false, // Always invalidate on app restart
            }),
        }
    )
);
