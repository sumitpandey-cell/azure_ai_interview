import { z } from 'zod';

/**
 * Feedback Validator
 * 
 * Validates AI-generated feedback to ensure quality and consistency
 * Updated to handle different interview lengths appropriately
 */

// Define the schema for feedback data
const SkillSchema = z.object({
    name: z.string().min(1, "Skill name cannot be empty"),
    score: z.number().min(0, "Score cannot be negative").max(100, "Score cannot exceed 100"),
    feedback: z.string().min(5, "Feedback must be at least 5 characters")  // Reduced from 10 to be more lenient
});

// More flexible schema that adjusts based on interview length
export const FeedbackSchema = z.object({
    executiveSummary: z.string()
        .min(30, "Executive summary too short")  // Reduced from 50
        .max(2000, "Executive summary too long"),
    strengths: z.array(z.string().min(3))  // Reduced from 5
        .min(1, "At least one strength required")
        .max(10, "Too many strengths"),
    improvements: z.array(z.string().min(3))  // Reduced from 5
        .min(1, "At least one improvement required")
        .max(10, "Too many improvements"),
    skills: z.array(SkillSchema)
        .min(3, "At least 3 skills required")
        .max(6, "Too many skills"),
    actionPlan: z.array(z.string().min(5))  // Reduced from 10
        .min(1, "At least one action item required")
        .max(10, "Too many action items")
});

export type ValidatedFeedback = z.infer<typeof FeedbackSchema>;

// Interview length categories for validation adjustments
export type InterviewLengthCategory = 'too-short' | 'short' | 'medium' | 'long';

/**
 * Validates feedback data with length-aware sanity checks
 */
export function validateFeedback(
    feedback: unknown, 
    interviewLength: InterviewLengthCategory = 'medium'
): ValidatedFeedback {
    // Schema validation
    const validated = FeedbackSchema.parse(feedback);

    // Length-aware sanity checks
    const avgScore = validated.skills.reduce((sum, s) => sum + s.score, 0) / validated.skills.length;

    // Adjust validation strictness based on interview length
    if (interviewLength === 'short') {
        // Be more strict about score caps for short interviews
        if (avgScore > 75) {
            console.warn('⚠️ Score too high for short interview - should be capped at 75% for limited assessment');
        }
        
        if (avgScore > 65 && validated.skills.length < 4) {
            console.warn('⚠️ High score in short interview with few skills assessed');
        }
        
        // Allow placeholder content for short interviews
        const allowedPlaceholders = ['insufficient data', 'limited assessment', 'brief session', 'not assessed', 'limited questions', 'few questions'];
        const hasAllowedPlaceholders = [
            ...validated.skills.map(s => s.feedback),
            validated.executiveSummary
        ].some(text =>
            allowedPlaceholders.some(placeholder =>
                text.toLowerCase().includes(placeholder)
            )
        );

        if (hasAllowedPlaceholders) {
            console.log('✅ Short interview contains appropriate limitation language');
        }
        
        // Check if executive summary mentions question count limitation
        const mentionsQuestionCount = validated.executiveSummary.toLowerCase().includes('question') || 
                                     validated.executiveSummary.toLowerCase().includes('limited') ||
                                     validated.executiveSummary.toLowerCase().includes('brief');
        
        if (!mentionsQuestionCount) {
            console.warn('⚠️ Short interview should mention question count limitation in executive summary');
        }
    } else {
        // Standard validation for medium/long interviews
        if (avgScore > 80 && validated.improvements.length < 2) {
            console.warn('⚠️ High score but few improvements - may be inconsistent');
        }

        if (avgScore < 40 && validated.strengths.length > 3) {
            console.warn('⚠️ Low score but many strengths - may be inconsistent');
        }

        // Check for empty or placeholder content in longer interviews
        const placeholders = ['pending', 'n/a', 'tbd', 'todo'];
        const hasPlaceholders = [
            ...validated.strengths,
            ...validated.improvements,
            ...validated.actionPlan,
            validated.executiveSummary
        ].some(text =>
            placeholders.some(placeholder =>
                text.toLowerCase().includes(placeholder)
            )
        );

        if (hasPlaceholders) {
            console.warn('⚠️ Feedback contains placeholder text');
        }
    }

    // Check for duplicate skills (applies to all lengths)
    const skillNames = validated.skills.map(s => s.name.toLowerCase());
    const uniqueSkills = new Set(skillNames);
    if (skillNames.length !== uniqueSkills.size) {
        throw new Error('Duplicate skills detected in feedback');
    }

    return validated;
}

/**
 * Validates feedback with error recovery and interview length context
 */
export function validateFeedbackSafe(
    feedback: unknown,
    interviewLength: InterviewLengthCategory = 'medium'
): {
    success: boolean;
    data?: ValidatedFeedback;
    error?: string;
} {
    try {
        const validated = validateFeedback(feedback, interviewLength);
        return { success: true, data: validated };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors.map(err =>
                `${err.path.join('.')}: ${err.message}`
            ).join(', ');
            return {
                success: false,
                error: `Validation failed: ${errorMessages}`
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown validation error'
        };
    }
}

/**
 * Calculates quality score for feedback with length awareness (0-100)
 */
export function calculateFeedbackQuality(
    feedback: ValidatedFeedback,
    interviewLength: InterviewLengthCategory = 'medium'
): number {
    let score = 100;

    // Adjust quality expectations based on interview length
    if (interviewLength === 'short') {
        // More strict scoring for short interviews to encourage proper score capping
        if (feedback.executiveSummary.length < 50) score -= 15;  // Increased penalty
        if (feedback.strengths.length < 2) score -= 10;
        if (feedback.improvements.length < 2) score -= 10;
        if (feedback.actionPlan.length < 2) score -= 10;
        
        // Check if scores are properly capped for short interviews
        const avgSkillScore = feedback.skills.reduce((sum, s) => sum + s.score, 0) / feedback.skills.length;
        if (avgSkillScore > 75) {
            score -= 20; // Heavy penalty for not respecting score caps
            console.warn('⚠️ Skills scores not properly capped for short interview');
        }
        
        // Bonus for acknowledging interview limitations
        const limitationPhrases = ['limited', 'brief', 'short', 'insufficient', 'few questions', 'limited questions'];
        const feedbackText = feedback.executiveSummary.toLowerCase();
        const hasLimitationLanguage = limitationPhrases.some(phrase => 
            feedbackText.includes(phrase)
        );
        
        if (hasLimitationLanguage) {
            score += 15; // Increased bonus for acknowledging limitations
        }
        
    } else if (interviewLength === 'medium') {
        // Standard scoring for medium interviews
        if (feedback.executiveSummary.length < 100) score -= 8;
        if (feedback.strengths.length < 3) score -= 8;
        if (feedback.improvements.length < 3) score -= 8;
        if (feedback.actionPlan.length < 3) score -= 8;
        
    } else if (interviewLength === 'long') {
        // More strict scoring for long interviews
        if (feedback.executiveSummary.length < 150) score -= 10;
        if (feedback.strengths.length < 4) score -= 10;
        if (feedback.improvements.length < 4) score -= 10;
        if (feedback.actionPlan.length < 4) score -= 10;
        
        // Bonus for detailed analysis in long interviews
        if (feedback.skills.every(s => s.feedback.length > 80)) score += 15;
    }

    // Deduct for generic feedback (applies to all lengths)
    const genericPhrases = ['good', 'great', 'excellent', 'needs improvement', 'could be better'];
    const allFeedbackText = [
        feedback.executiveSummary,
        ...feedback.strengths,
        ...feedback.improvements,
        ...feedback.skills.map(s => s.feedback),
        ...feedback.actionPlan
    ].join(' ').toLowerCase();

    const genericCount = genericPhrases.filter(phrase =>
        allFeedbackText.includes(phrase)
    ).length;

    const genericPenalty = interviewLength === 'short' ? 3 : 5; // More lenient for short interviews
    score -= Math.min(genericCount * genericPenalty, 20);

    // Bonus for specific, detailed feedback
    if (feedback.executiveSummary.length > 200) score += 5;
    
    const minFeedbackLength = interviewLength === 'short' ? 30 : 50;
    if (feedback.skills.every(s => s.feedback.length > minFeedbackLength)) score += 10;

    return Math.max(0, Math.min(100, score));
}
