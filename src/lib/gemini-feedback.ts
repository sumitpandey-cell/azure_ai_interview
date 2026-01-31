// No import needed for direct API calls
import { INTERVIEW_CONFIG } from "@/config/interview-config";
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string;

export interface Message {
    id?: number;
    speaker: 'user' | 'ai';
    sender?: 'user' | 'ai';  // Legacy support
    role?: string;           // LLM standard support
    text: string;
    timestamp?: number;
}

export interface InterviewSessionData {
    id: string;
    interview_type: string;
    position: string;
    config: {
        interviewMode?: 'general' | 'company';
        companyName?: string;
        role?: string;
        experienceLevel?: string;
        skills?: string[];
        jobDescription?: string;
        difficulty?: string;
        companyInterviewConfig?: {
            companyTemplateId: string;
            companyName: string;
            role: string;
            experienceLevel: string;
        };
    };
    resumeContent?: string | null;
}

export interface FeedbackData {
    status?: 'success' | 'failed';
    error?: string;
    executiveSummary: string;
    strengths: string[];
    improvements: string[];
    // Overall assessment skills (always 4 categories)
    overallSkills: {
        name: string;
        score: number;
        feedback: string;
    }[];
    // Candidate-specified technical skills (from form)
    technicalSkills: {
        name: string;
        score: number;
        feedback: string;
    }[];
    actionPlan: string[];
    // Deprecated: kept for backward compatibility
    skills?: {
        name: string;
        score: number;
        feedback: string;
    }[];
}

// Interview length thresholds are now in INTERVIEW_CONFIG


export interface InterviewLengthAnalysis {
    totalTurns: number;
    userTurns: number;
    aiTurns: number;
    avgUserResponseLength: number;
    totalWordCount: number;
    category: 'too-short' | 'short' | 'medium' | 'long';
}


/**
 * Analyzes the interview transcript to determine length and quality metrics
 */
function analyzeInterviewLength(transcript: Message[]): InterviewLengthAnalysis {
    // Standardized role identification
    const getNormalizedRole = (msg: Message) => {
        const rawRole = (msg.role || msg.speaker || msg.sender || 'unknown').toLowerCase();
        if (['ai', 'assistant', 'model', 'agent'].includes(rawRole)) return 'ai';
        if (rawRole === 'user' || rawRole === 'candidate') return 'user';
        return 'unknown';
    };

    const userMessages = transcript.filter(msg => getNormalizedRole(msg) === 'user');
    const aiMessages = transcript.filter(msg => getNormalizedRole(msg) === 'ai');

    const totalWordCount = transcript.reduce((count, msg) => {
        return count + msg.text.trim().split(/\s+/).length;
    }, 0);

    const avgUserResponseLength = userMessages.length > 0
        ? userMessages.reduce((sum, msg) => sum + msg.text.length, 0) / userMessages.length
        : 0;

    const totalTurns = transcript.length;

    let category: InterviewLengthAnalysis['category'];
    if (totalTurns < INTERVIEW_CONFIG.LENGTH_CATEGORIES.TOO_SHORT) {
        category = 'too-short';
    } else if (totalTurns < INTERVIEW_CONFIG.LENGTH_CATEGORIES.SHORT) {
        category = 'short';
    } else if (totalTurns < INTERVIEW_CONFIG.LENGTH_CATEGORIES.MEDIUM) {
        category = 'medium';
    } else {
        category = 'long';
    }

    return {
        totalTurns,
        userTurns: userMessages.length,
        aiTurns: aiMessages.length,
        avgUserResponseLength,
        totalWordCount,
        category
    };
}

/**
 * Returns appropriate feedback for interviews that are too short to assess
 */
function getTooShortInterviewFeedback(position: string, analysis: InterviewLengthAnalysis): FeedbackData {
    const minTurns = INTERVIEW_CONFIG.LENGTH_CATEGORIES.TOO_SHORT;
    const reason = analysis.totalTurns < minTurns ? "insufficient conversation depth" : "brief session duration";

    return {
        executiveSummary: `This interview session for the ${position} position was too brief (${analysis.totalTurns} exchanges) to provide a meaningful technical assessment. Reports require a minimum level of engagement to evaluate skills accurately. Consequently, this session has been recorded with a score of 0. We recommend a longer, more detailed discussion in your next attempt to unlock full AI insights.`,
        strengths: [
            "Attempted the interview process",
            "Engaged with the initial setup"
        ],
        improvements: [
            "Aim for a session length of at least 10-15 minutes",
            "Provide more detailed, technical answers to questions",
            "Ensure you address the core technical competencies of the role"
        ],
        overallSkills: [
            {
                name: "Technical Knowledge",
                score: 0,
                feedback: `Score of 0 due to ${reason}. Not enough technical data was captured to evaluate knowledge.`
            },
            {
                name: "Communication",
                score: 0,
                feedback: "Communication skills couldn't be evaluated due to the extremely short nature of the exchange."
            },
            {
                name: "Problem Solving",
                score: 0,
                feedback: "No complex problem-solving scenarios were reached during this session."
            },
            {
                name: "Cultural Fit",
                score: 0,
                feedback: "Insufficient interaction to determine alignment with professional standards."
            }
        ],
        technicalSkills: [],
        actionPlan: [
            "Schedule a complete interview session lasting at least 15-20 minutes",
            "Prepare to engage with multiple technical questions and scenarios",
            "Practice explaining your thought process clearly during problem-solving",
            "Review common interview questions for your target position"
        ],
        // Backward compatibility
        skills: [
            {
                name: "Technical Knowledge",
                score: 0,
                feedback: "Insufficient interview duration to assess technical capabilities. Please complete a longer session for evaluation."
            },
            {
                name: "Communication",
                score: 0,
                feedback: "Limited interaction time prevents meaningful assessment of communication skills."
            },
            {
                name: "Problem Solving",
                score: 0,
                feedback: "No significant problem-solving scenarios were completed during this brief session."
            },
            {
                name: "Cultural Fit",
                score: 0,
                feedback: "Unable to evaluate cultural fit due to insufficient interview content."
            }
        ]
    };
}

/**
 * Generates length-specific instructions for the AI prompt
 */
function getLengthBasedInstructions(category: InterviewLengthAnalysis['category']): string {
    switch (category) {
        case 'short':
            return `
    SPECIAL INSTRUCTIONS FOR SHORT INTERVIEW:
    - Acknowledge the limited data available for assessment
    - Provide more general, encouraging feedback
    - Be more lenient with scoring (avoid very low scores unless clearly warranted)
    - Focus on what was observed rather than making extensive inferences
    - Suggest areas for further exploration in future interviews`;

        case 'medium':
            return `
    SPECIAL INSTRUCTIONS FOR MEDIUM-LENGTH INTERVIEW:
    - Provide balanced assessment with moderate detail
    - Include specific examples where available
    - Offer constructive suggestions for improvement
    - Balance strengths and areas for growth`;

        case 'long':
            return `
    SPECIAL INSTRUCTIONS FOR COMPREHENSIVE INTERVIEW:
    - Provide detailed, specific feedback with granular analysis
    - Include multiple examples from different parts of the interview
    - Offer nuanced scoring that reflects the depth of assessment possible
    - Provide detailed action plan based on thorough evaluation`;

        default:
            return '';
    }
}

// Export the analysis function for use in other parts of the application
export { analyzeInterviewLength, INTERVIEW_CONFIG };

export async function generateFeedback(
    transcript: Message[],
    sessionData: InterviewSessionData
): Promise<FeedbackData> {

    // Extract session context
    const { position, interview_type: interviewType, config } = sessionData;
    const skills = config.skills || [];
    const difficulty = config.difficulty || 'Intermediate';
    const jobDescription = config.jobDescription || null;

    const companyContext = config.companyInterviewConfig || config.companyName ?
        `\n\nCOMPANY CONTEXT: This interview was conducted for ${config.companyName || config.companyInterviewConfig?.companyName} for the role of ${config.role || config.companyInterviewConfig?.role}. Experience level expected: ${config.experienceLevel || config.companyInterviewConfig?.experienceLevel}.` : '';

    const jdContext = jobDescription ? `\n\nJOB DESCRIPTION:\n${jobDescription}` : '';
    const resumeContext = sessionData.resumeContent ? `\n\nCANDIDATE RESUME:\n${sessionData.resumeContent}` : '';

    // Analyze interview length before processing
    const lengthAnalysis = analyzeInterviewLength(transcript);

    // Return early if interview is too short
    if (lengthAnalysis.category === 'too-short') {
        return getTooShortInterviewFeedback(position, lengthAnalysis);
    }

    // Filter out internal thoughts and empty lines
    const transcriptText = transcript
        .map(msg => {
            // Remove internal thoughts (lines starting with * or () and bold headers)
            let cleanText = msg.text.replace(/\*\*[^*]+\*\*\s*/g, ''); // Remove bold headers like **Title**

            cleanText = cleanText
                .split('\n')
                .filter(line => !line.trim().startsWith('*') && !line.trim().startsWith('('))
                .join('\n');
            return { ...msg, text: cleanText };
        })
        .filter(msg => msg.text.trim().length > 0)
        .filter(msg => msg.text.trim().length > 0)
        .map(msg => {
            // Standardize speaker identification for the prompt
            const rawRole = (msg.role || msg.speaker || msg.sender || 'unknown').toLowerCase();
            const speaker = ['ai', 'assistant', 'model', 'agent'].includes(rawRole) ? 'AI' : 'USER';
            return `${speaker}: ${msg.text}`;
        })
        .join('\n');

    // Adjust prompt based on interview length
    const lengthSpecificInstructions = getLengthBasedInstructions(lengthAnalysis.category);

    // Build context about expected skills and difficulty
    const skillsContext = skills && skills.length > 0
        ? `\n\nEXPECTED SKILLS TO ASSESS:\nThis interview was designed to evaluate the following skills: ${skills.join(', ')}.\nFocus your assessment on these specific areas when evaluating the candidate's performance.`
        : '';

    // difficultyContext was defined but never used

    const prompt = `You are an expert technical interviewer. Analyze this ${position} interview (${interviewType}, ${difficulty} level).
${skillsContext}${companyContext}${jdContext}${resumeContext}

TRANSCRIPT:
${transcriptText}

METRICS: ${lengthAnalysis.totalTurns} exchanges, ${lengthAnalysis.totalWordCount} words, ${lengthAnalysis.category} interview
${lengthSpecificInstructions}

DIFFICULTY-BASED SCORING (MANDATORY):
${difficulty === 'Beginner' ? `
BEGINNER LEVEL - Be Encouraging but Honest:
- 70-100%: Shows basic understanding, can explain simple concepts
- 40-69%: Knows terminology, struggles with explanations
- 10-39%: Very limited knowledge, mostly incorrect
- 0-9%: No understanding demonstrated` : difficulty === 'Advanced' ? `
ADVANCED LEVEL - Be EXTREMELY STRICT:
- 90-100%: Deep expertise, discusses trade-offs, advanced patterns, production experience
- 70-89%: Solid advanced knowledge, explains complex concepts well
- 50-69%: Intermediate knowledge (NOT acceptable for advanced role)
- 30-49%: Basic knowledge only (major red flag)
- 0-29%: Insufficient for advanced position` : `
INTERMEDIATE LEVEL - Balanced Strictness:
- 80-100%: Strong knowledge, explains concepts clearly with examples
- 60-79%: Good understanding, some gaps acceptable
- 40-59%: Basic knowledge, significant improvement needed
- 20-39%: Limited knowledge, major gaps
- 0-19%: Insufficient knowledge`}

SCORING CRITERIA (0-100 for each):

Technical Knowledge:
- 90-100: Deep understanding, detailed examples, discusses trade-offs
- 70-89: Solid understanding, explains how things work
- 50-69: Basic concepts understood
- 30-49: Significant gaps
- 5-29: Very limited, mostly incorrect
- 0-4: No knowledge or refuses to answer

Communication:
- 90-100: Crystal clear, professional, well-structured
- 70-89: Clear with minor issues
- 50-69: Generally understandable
- 30-49: Significant barriers
- 0-29: Poor, hard to understand

Problem Solving:
- 90-100: Systematic, breaks down problems, multiple solutions
- 70-89: Logical thinking, structured approach
- 50-69: Basic reasoning
- 30-49: Limited attempts
- 0-29: Gives up quickly, no real attempt

Cultural Fit:
- 90-100: Professional, positive attitude, great collaboration signals
- 70-89: Good professionalism, generally positive/neutral
- 50-69: Acceptable behavior
- 30-49: Some concerns, negative outbursts or frustration
- 0-29: Unprofessional or poor attitude

STRICT RULES:
- Lists tech without explanation = Tech: 5-10%
- Gives up immediately = Problem Solving: 0-5%
- Can't explain basics = Tech: 0-10%
- Heavy language mixing = Communication: 5-15%
- "I don't know" without trying = Problem Solving: 0-10%

OUTPUT FORMAT - STRICT JSON ONLY (NO MARKDOWN, NO EXPLANATIONS):
CRITICAL: You MUST include ALL fields below. Missing any field will cause system failure.

{
  "executiveSummary": "2-3 sentences with specific examples and scores justification. REQUIRED.",
  "strengths": ["REQUIRED: At least 2 specific examples from transcript", "Another strength with evidence"],
  "improvements": ["REQUIRED: At least 2 specific gaps with examples", "Another improvement area"],
  "overallSkills": [
    {"name": "Technical Knowledge", "score": 0-100, "feedback": "Evidence-based, match score"},
    {"name": "Communication", "score": 0-100, "feedback": "Evidence-based"},
    {"name": "Problem Solving", "score": 0-100, "feedback": "Evidence-based"},
    {"name": "Cultural Fit", "score": 0-100, "feedback": "Evidence-based"}
  ],
  "technicalSkills": [${skills.length > 0 ? `{"name": "SKILL", "score": 0-100, "feedback": "Evidence only"}` : ''}],
  "actionPlan": ["REQUIRED: At least 2 specific, actionable steps", "Another actionable step"]
}

MANDATORY REQUIREMENTS:
1. 'strengths' array: MUST have at least 2 items, each with specific evidence
2. 'improvements' array: MUST have at least 2 items, each with specific examples
3. 'actionPlan' array: MUST have at least 2 actionable steps
4. 'overallSkills' array: MUST have exactly 4 skills as shown above

CRITICAL: Return ONLY valid JSON. Do not wrap in markdown code blocks. Do not add any text before or after the JSON.

Be brutally honest. Low scores with constructive feedback are more helpful than inflated scores.
Compare their answers against their resume claims. If they claim expertise in a skill but struggle during the interview, highlight this discrepancy.`;

    // Validate API key is available
    if (!API_KEY) {
        console.error('❌ NEXT_PUBLIC_GEMINI_API_KEY is not set');
        throw new Error('NEXT_PUBLIC_GEMINI_API_KEY environment variable is required. Please set it in your .env.local file.');
    }

    const cleanApiKey = API_KEY.replace(/[^a-zA-Z0-9_\-]/g, '');
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${cleanApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 8192,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`);
        }

        const data = await response.json();
        const textResponse = data.candidates[0].content.parts[0].text;

        // Clean up markdown code blocks if present
        const jsonString = textResponse.replace(/^```json\n|\n```$/g, '').replace(/^```\n|\n```$/g, '').trim();

        let parsedFeedback;
        try {
            parsedFeedback = JSON.parse(jsonString);
        } catch (parseError) {
            console.error('❌ Failed to parse Gemini response as JSON:', jsonString.substring(0, 500));
            throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
        }

        // Log the parsed feedback for debugging
        console.log('📋 Parsed feedback structure:', JSON.stringify({
            hasExecutiveSummary: !!parsedFeedback.executiveSummary,
            strengthsCount: parsedFeedback.strengths?.length || 0,
            improvementsCount: parsedFeedback.improvements?.length || 0,
            overallSkillsCount: parsedFeedback.overallSkills?.length || 0,
            technicalSkillsCount: parsedFeedback.technicalSkills?.length || 0,
            actionPlanCount: parsedFeedback.actionPlan?.length || 0,
            comparisonsCount: parsedFeedback.comparisons?.length || 0
        }));

        // Ensure required fields exist with fallback values and valid string lengths
        const normalizedFeedback = {
            executiveSummary: (parsedFeedback.executiveSummary && parsedFeedback.executiveSummary.length >= 30)
                ? parsedFeedback.executiveSummary
                : (parsedFeedback.executiveSummary || 'Feedback generation complete. Please review the detailed assessment below.'),
            strengths: (Array.isArray(parsedFeedback.strengths) && parsedFeedback.strengths.filter((s: unknown) => typeof s === 'string' && (s as string).length >= 3).length > 0)
                ? (parsedFeedback.strengths as string[]).filter((s: string) => s.length >= 3)
                : ['Demonstrated technical participation in the interview'],
            improvements: (Array.isArray(parsedFeedback.improvements) && (parsedFeedback.improvements as unknown[]).filter((s: unknown) => typeof s === 'string' && (s as string).length >= 3).length > 0)
                ? (parsedFeedback.improvements as string[]).filter((s: string) => s.length >= 3)
                : ['Engage in more detailed technical discussions to showcase depth'],
            overallSkills: Array.isArray(parsedFeedback.overallSkills) && parsedFeedback.overallSkills.length >= 3
                ? parsedFeedback.overallSkills
                : [
                    { name: 'Technical Knowledge', score: 0, feedback: 'Insufficient data for assessment' },
                    { name: 'Communication', score: 0, feedback: 'Insufficient data for assessment' },
                    { name: 'Problem Solving', score: 0, feedback: 'Insufficient data for assessment' },
                    { name: 'Cultural Fit', score: 0, feedback: 'Insufficient data for assessment' }
                ],
            technicalSkills: Array.isArray(parsedFeedback.technicalSkills) ? parsedFeedback.technicalSkills : [],
            actionPlan: (Array.isArray(parsedFeedback.actionPlan) && (parsedFeedback.actionPlan as unknown[]).filter((s: unknown) => typeof s === 'string' && (s as string).length >= 5).length > 0)
                ? (parsedFeedback.actionPlan as string[]).filter((s: string) => s.length >= 5)
                : ['Continue practicing mock interviews to build confidence'],
            // Backward compatibility
            skills: parsedFeedback.skills || (Array.isArray(parsedFeedback.overallSkills) ? parsedFeedback.overallSkills : null)
        };

        // Validate feedback before returning
        const { validateFeedbackSafe, calculateFeedbackQuality } = await import('./feedback-validator');

        console.log('🛡️ Validating normalized feedback...');
        const validation = validateFeedbackSafe(normalizedFeedback, lengthAnalysis.category);

        if (!validation.success) {
            console.error('❌ Feedback validation failed after normalization:', validation.error);
            console.error('📋 Normalized feedback content:', JSON.stringify(normalizedFeedback, null, 2));
            throw new Error(`Invalid feedback structure: ${validation.error}`);
        }

        calculateFeedbackQuality(validation.data!, lengthAnalysis.category);

        return validation.data! as FeedbackData;
    } catch (error) {
        console.error("Error generating feedback:", error);
        // Return fallback data in case of error with explicit failure flag
        return {
            status: 'failed',
            error: error instanceof Error ? error.message : "A technical error occurred during feedback generation.",
            executiveSummary: `Feedback generation failed. ${error instanceof Error ? error.message : "A technical error occurred"}. Please review the transcript manually or try regenerating.`,
            strengths: ["Unable to analyze strengths due to technical error"],
            improvements: ["Unable to analyze improvements due to technical error"],
            overallSkills: [
                { name: "Technical Knowledge", score: 0, feedback: "Analysis failed" },
                { name: "Communication", score: 0, feedback: "Analysis failed" },
                { name: "Problem Solving", score: 0, feedback: "Analysis failed" },
                { name: "Cultural Fit", score: 0, feedback: "Analysis failed" }
            ],
            technicalSkills: [],
            actionPlan: ["Please try regenerating the report"],
            // Backward compatibility
            skills: [
                { name: "Technical Knowledge", score: 0, feedback: "Analysis failed" },
                { name: "Communication", score: 0, feedback: "Analysis failed" },
                { name: "Problem Solving", score: 0, feedback: "Analysis failed" },
                { name: "Cultural Fit", score: 0, feedback: "Analysis failed" }
            ]
        };
    }
}
