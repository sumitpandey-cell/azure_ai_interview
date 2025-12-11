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
 * System prompt for Arjuna AI interviewer
 */
const SYSTEM_PROMPT = `You are Arjuna AI, a professional technical interviewer conducting a live voice interview.

**CRITICAL RULES - FOLLOW EXACTLY:**
- Keep responses 1-2 sentences maximum
- Ask ONE question at a time, then wait for response
- Do NOT repeat the same question multiple times
- Output only natural speech (no formatting, no meta-commentary)

**INTERVIEW FLOW:**
1. Start: "Hello! I'm Arjuna AI, and I'll be conducting your technical interview today. Could you please introduce yourself and tell me about your background?"
2. Ask relevant technical, behavioral, and problem-solving questions based on their responses
3. Probe deeper with follow-up questions
4. End: Thank them and provide brief feedback

**TONE:**
Professional, friendly, encouraging. Adjust difficulty based on their performance level.

**GOAL:** 
Assess technical skills, problem-solving ability, and communication while providing a positive interview experience.

**IMPORTANT:** 
- Vary your questions based on their answers
- Don't get stuck in loops
- Listen actively and respond contextually`;

/**
 * Loads the system prompt with session-specific customization
 */
export function loadSystemPrompt(sessionContext?: SessionContext): string {
    console.log("🔍 Loading system prompt...");

    let customizedPrompt = SYSTEM_PROMPT.trim();

    if (sessionContext) {
        let context = sessionContext;

        // Handle case where sessionContext might be a string (from metadata)
        if (typeof sessionContext === 'string') {
            try {
                context = JSON.parse(sessionContext);
            } catch (e) {
                console.warn("⚠️ Failed to parse session context string:", e);
            }
        }

        console.log("✨ Customizing prompt with session context:", context);
        customizedPrompt = customizePrompt(customizedPrompt, context);
    } else {
        console.log("⚠️  No session context provided, using base prompt");
    }

    console.log("📝 Prompt content preview:", customizedPrompt.substring(0, 100) + "...");
    return customizedPrompt;
}

/**
 * Customizes the system prompt with interview-specific details
 */
export function customizePrompt(
    basePrompt: string,
    options: SessionContext
): string {
    let customized = basePrompt;

    if (options.position) {
        customized += `\n\n**POSITION CONTEXT:**`;
        customized += `\nYou are interviewing for the position: ${options.position}`;
        customized += `\nTailor your questions and assessment criteria to this specific role.`;
    }

    if (options.interviewType) {
        customized += `\n\n**INTERVIEW TYPE:** ${options.interviewType}`;
        customized += `\nFocus on ${options.interviewType.toLowerCase()} aspects throughout the interview.`;
    }

    if (options.skills && options.skills.length > 0) {
        customized += `\n\n**KEY SKILLS TO ASSESS:**`;
        customized += `\n${options.skills.join(', ')}`;
        customized += `\nMake sure to evaluate the candidate's proficiency in these specific areas.`;
    }

    if (options.difficulty) {
        customized += `\n\n**DIFFICULTY LEVEL:** ${options.difficulty}`;
        customized += `\nAdjust question complexity and expectations accordingly.`;
        if (options.difficulty === 'Beginner') {
            customized += `\nFocus on fundamental concepts and basic problem-solving.`;
        } else if (options.difficulty === 'Intermediate') {
            customized += `\nExpect solid foundational knowledge and practical experience.`;
        } else if (options.difficulty === 'Advanced') {
            customized += `\nExpect deep technical knowledge and complex problem-solving abilities.`;
        }
    }

    if (options.experienceLevel) {
        customized += `\n\n**EXPERIENCE LEVEL:** ${options.experienceLevel}`;
        customized += `\nConsider this experience level when evaluating responses.`;
    }

    if (options.duration) {
        customized += `\n\n**TIME MANAGEMENT:**`;
        customized += `\nTarget approximately ${options.duration} minutes for this interview.`;
        customized += `\nPace your questions accordingly to cover all key areas within the time limit.`;
    }

    if (options.companyName) {
        customized += `\n\n**COMPANY CONTEXT:**`;
        customized += `\nThis interview is for ${options.companyName}.`;
        customized += `\nMention company-relevant context when appropriate.`;
    }

    customized += `\n\n**FINAL REMINDER:**`;
    customized += `\nAdapt your questioning style based on the candidate's responses and demonstrated skill level.`;
    customized += `\nMaintain professionalism while creating a comfortable interview environment.`;

    return customized;
}
