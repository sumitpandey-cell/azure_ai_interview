/**
 * Interface for session context data
 */
export interface SessionContext {
    position?: string;
    interviewType?: string;
    duration?: number;
    companyName?: string;
    skills?: string[];
    difficulty?: string;
    experienceLevel?: string;
}
/**
 * Loads the system prompt with session-specific customization
 */
export declare function loadSystemPrompt(sessionContext?: SessionContext): string;
/**
 * Customizes the system prompt with interview-specific details
 */
export declare function customizePrompt(basePrompt: string, options: SessionContext): string;
//# sourceMappingURL=prompt-loader.d.ts.map