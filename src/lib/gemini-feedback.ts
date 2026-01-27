// No import needed for direct API calls
import { INTERVIEW_CONFIG } from "@/config/interview-config";
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string;

interface Message {
    id?: number;
    speaker: 'user' | 'ai';
    sender?: 'user' | 'ai';  // Legacy support
    role?: string;           // LLM standard support
    text: string;
    timestamp?: number;
}

interface InterviewSessionData {
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
}

export interface FeedbackData {
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
    // What you said vs. What you should have said
    comparisons?: {
        question: string;
        actualAnswer: string;
        eliteAnswer: string;
        explanation: string;
    }[];
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
    return {
        executiveSummary: `This interview session was too brief (${analysis.totalTurns} exchanges) to provide a comprehensive assessment for the ${position} position. A meaningful technical interview typically requires at least ${minTurns} substantial exchanges to evaluate candidate capabilities effectively. We recommend scheduling a longer session to get valuable insights into your technical skills and problem-solving approach.`,
        strengths: [
            "Showed up and engaged with the interview process",
            "Demonstrated willingness to participate in technical assessment"
        ],
        improvements: [
            "Complete a full-length interview session for comprehensive evaluation",
            "Prepare for longer technical discussions to showcase your abilities",
            "Consider practicing with mock interviews to build confidence"
        ],
        overallSkills: [
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

    const difficultyContext = difficulty
        ? `\n\nINTERVIEW DIFFICULTY LEVEL: ${difficulty}\n${difficulty === 'Beginner'
            ? 'This is a beginner-level interview. Adjust expectations accordingly - focus on fundamental understanding rather than advanced expertise.'
            : difficulty === 'Intermediate'
                ? 'This is an intermediate-level interview. Expect solid foundational knowledge and some practical experience.'
                : 'This is an advanced-level interview. Expect deep technical knowledge, complex problem-solving, and extensive experience.'
        }`
        : '';

    const prompt = `You are an expert technical interviewer. Analyze this ${position} interview (${interviewType}, ${difficulty} level).
${skillsContext}${companyContext}${jdContext}

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

OUTPUT (JSON only):
{
  "executiveSummary": "2-3 sentences with specific examples and scores justification.",
  "strengths": ["Specific examples from transcript"],
  "improvements": ["Specific gaps with examples"],
  "comparisons": [
    {
      "question": "Interviewer's prompt",
      "actualAnswer": "Candidate's exact response",
      "eliteAnswer": "A high-quality, professional, and deep technical answer they SHOULD have given",
      "explanation": "Why this elite answer is superior"
    }
  ],
  "overallSkills": [
    {"name": "Technical Knowledge", "score": 0-100, "feedback": "Evidence-based, match score"},
    {"name": "Communication", "score": 0-100, "feedback": "Evidence-based"},
    {"name": "Problem Solving", "score": 0-100, "feedback": "Evidence-based"},
    {"name": "Cultural Fit", "score": 0-100, "feedback": "Evidence-based"}
  ],
  "technicalSkills": [${skills.length > 0 ? `{"name": "SKILL", "score": 0-100, "feedback": "Evidence only"}` : ''}],
  "actionPlan": ["Specific, actionable steps"]
}

MANDATORY FEATURE: 'comparisons'
Identify 3-5 most impactful exchanges where the candidate's answer was weak or could be significantly improved. For EACH, provide a gold-standard 'eliteAnswer'. This is the most valued part of the report.

Be brutally honest. Low scores with constructive feedback are more helpful than inflated scores.`;

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

        const parsedFeedback = JSON.parse(jsonString);

        // Validate feedback before returning
        const { validateFeedbackSafe, calculateFeedbackQuality } = await import('./feedback-validator');
        const validation = validateFeedbackSafe(parsedFeedback, lengthAnalysis.category);

        if (!validation.success) {
            console.error('❌ Feedback validation failed:', validation.error);
            throw new Error(`Invalid feedback structure: ${validation.error}`);
        }

        const qualityScore = calculateFeedbackQuality(validation.data!, lengthAnalysis.category);

        return validation.data! as FeedbackData;
    } catch (error) {
        console.error("Error generating feedback:", error);
        // Return fallback data in case of error
        return {
            executiveSummary: `Feedback generation failed. ${error instanceof Error ? error.message : "A technical error occurred"}. Please review the transcript manually.`,
            strengths: ["Unable to analyze strengths"],
            improvements: ["Unable to analyze improvements"],
            overallSkills: [
                { name: "Technical Knowledge", score: 0, feedback: "Analysis failed" },
                { name: "Communication", score: 0, feedback: "Analysis failed" },
                { name: "Problem Solving", score: 0, feedback: "Analysis failed" },
                { name: "Cultural Fit", score: 0, feedback: "Analysis failed" }
            ],
            technicalSkills: [],
            actionPlan: ["Please try again later"],
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
