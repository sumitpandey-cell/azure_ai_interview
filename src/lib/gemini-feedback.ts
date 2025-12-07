
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string;

interface Message {
    id: number;
    sender: 'user' | 'ai';
    text: string;
}

export interface FeedbackData {
    executiveSummary: string;
    strengths: string[];
    improvements: string[];
    skills: {
        name: string;
        score: number;
        feedback: string;
    }[];
    actionPlan: string[];
}

// Interview length thresholds
const INTERVIEW_THRESHOLDS = {
    MINIMUM_TURNS: 4, // Minimum meaningful exchanges
    SHORT_INTERVIEW: 8, // Less than this = short interview
    MEDIUM_INTERVIEW: 15, // Good length for assessment
    LONG_INTERVIEW: 25, // Comprehensive interview
} as const;

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
    const userMessages = transcript.filter(msg => msg.sender === 'user');
    const aiMessages = transcript.filter(msg => msg.sender === 'ai');

    const totalWordCount = transcript.reduce((count, msg) => {
        return count + msg.text.trim().split(/\s+/).length;
    }, 0);

    const avgUserResponseLength = userMessages.length > 0
        ? userMessages.reduce((sum, msg) => sum + msg.text.length, 0) / userMessages.length
        : 0;

    const totalTurns = transcript.length;

    let category: InterviewLengthAnalysis['category'];
    if (totalTurns < INTERVIEW_THRESHOLDS.MINIMUM_TURNS) {
        category = 'too-short';
    } else if (totalTurns < INTERVIEW_THRESHOLDS.SHORT_INTERVIEW) {
        category = 'short';
    } else if (totalTurns < INTERVIEW_THRESHOLDS.MEDIUM_INTERVIEW) {
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
    return {
        executiveSummary: `This interview session was too brief (${analysis.totalTurns} exchanges) to provide a comprehensive assessment for the ${position} position. A meaningful technical interview typically requires at least ${INTERVIEW_THRESHOLDS.MINIMUM_TURNS} substantial exchanges to evaluate candidate capabilities effectively. We recommend scheduling a longer session to get valuable insights into your technical skills and problem-solving approach.`,
        strengths: [
            "Showed up and engaged with the interview process",
            "Demonstrated willingness to participate in technical assessment"
        ],
        improvements: [
            "Complete a full-length interview session for comprehensive evaluation",
            "Prepare for longer technical discussions to showcase your abilities",
            "Consider practicing with mock interviews to build confidence"
        ],
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
                name: "Adaptability",
                score: 0,
                feedback: "Unable to evaluate adaptability due to insufficient interview content."
            }
        ],
        actionPlan: [
            "Schedule a complete interview session lasting at least 15-20 minutes",
            "Prepare to engage with multiple technical questions and scenarios",
            "Practice explaining your thought process clearly during problem-solving",
            "Review common interview questions for your target position"
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
export { analyzeInterviewLength, INTERVIEW_THRESHOLDS };

export async function generateFeedback(
    transcript: Message[],
    position: string,
    interviewType: string,
    skills?: string[],
    difficulty?: string
): Promise<FeedbackData> {
    console.log("Analyzing interview transcript:", transcript.length, "messages");

    // Analyze interview length before processing
    const lengthAnalysis = analyzeInterviewLength(transcript);
    console.log("Interview analysis:", lengthAnalysis);

    // Return early if interview is too short
    if (lengthAnalysis.category === 'too-short') {
        console.log("Interview too short - returning minimal feedback");
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
        .map(msg => `${msg.sender.toUpperCase()}: ${msg.text}`)
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

    const prompt = `
    You are an expert technical interviewer and career coach. Analyze the following interview transcript for a ${position} position (${interviewType} interview).
${skillsContext}${difficultyContext}

TRANSCRIPT:
${transcriptText}

INTERVIEW METRICS:

* Total exchanges: ${lengthAnalysis.totalTurns}
* Category: ${lengthAnalysis.category.toUpperCase()}
* Total words: ${lengthAnalysis.totalWordCount}
${lengthSpecificInstructions}

CRITICAL: Be EXTREMELY STRICT in scoring for each category and score out of 100 and text feedback should match. Do not give ANY generous scores without clear evidence.

DETAILED SCORING CRITERIA FOR EACH SKILL:

**TECHNICAL KNOWLEDGE (0-100):**
- **90-100%**: Deep understanding, explains complex concepts, provides detailed examples, discusses trade-offs
- **70-89%**: Solid understanding, explains how technologies work, gives specific use cases
- **50-69%**: Can explain basic concepts, shows understanding beyond just naming technologies
- **30-49%**: Shows some understanding but with significant gaps or confusion
- **15-29%**: Very limited knowledge, mostly incorrect or confused explanations
- **5-14%**: Only lists technology names without ANY explanation or understanding
- **0-4%**: No technical knowledge demonstrated, completely incorrect, or refuses to answer

**COMMUNICATION (0-100):**
- **90-100%**: Crystal clear, professional, excellent fluency, well-structured responses
- **70-89%**: Clear communication, minor language issues don't affect understanding
- **50-69%**: Generally understandable with some communication gaps
- **30-49%**: Significant communication barriers, some responses unclear
- **15-29%**: Frequent communication issues, difficult to follow
- **5-14%**: Poor communication, language mixing makes responses hard to understand
- **0-4%**: Cannot communicate effectively, responses are incomprehensible

**PROBLEM SOLVING (0-100):**
- **90-100%**: Systematic approach, breaks down complex problems, considers multiple solutions
- **70-89%**: Shows logical thinking, attempts structured problem-solving
- **50-69%**: Basic problem-solving approach, shows some logical reasoning
- **30-49%**: Limited problem-solving attempts, struggles with systematic approach
- **15-29%**: Minimal problem-solving effort, shows confusion
- **5-14%**: Avoids problem-solving, gives up quickly without real attempt
- **0-4%**: Immediately gives up on problems, shows no problem-solving skills

**ADAPTABILITY (0-100):**
- **90-100%**: Seamlessly adapts to different topics, adjusts communication style effectively
- **70-89%**: Shows good flexibility, handles topic changes well
- **50-69%**: Some adaptability, adjusts reasonably to different questions
- **30-49%**: Limited adaptability, prefers staying in comfort zone
- **15-29%**: Struggles to adapt, rigid responses
- **5-14%**: Very limited adaptability, uncomfortable with topic changes
- **0-4%**: Cannot adapt to new topics or questions

ULTRA-STRICT SCORING RULES:
- **Lists technologies without explanation** = Technical Knowledge: 5-10%
- **Gives up on first problem without trying** = Problem Solving: 0-5%
- **Cannot explain basic concepts** = Technical Knowledge: 0-10%
- **Frequent language mixing that hinders technical discussion** = Communication: 5-15%
- **Shows no understanding of mentioned technologies** = Technical Knowledge: 0-5%
- **Immediately abandons problems** ("I leave that") = Problem Solving: 0-5%
- **Cannot articulate any technical concept clearly** = Technical Knowledge: 0-10%

MANDATORY: If candidate shows ZERO technical explanation ability, score Technical Knowledge 0-5%

INSTRUCTIONS FOR FAIR EVALUATION:

1. Ignore any system logs or AI internal thoughts.
2. Score only based on what the candidate actually demonstrated.

   * If a skill can’t be evaluated due to lack of data, mark it as: "Not Assessed" or give score 50.
   * Do NOT penalize missing or skipped answers.
3. Scale the depth and strictness of analysis according to the transcript length:

   * SHORT (${INTERVIEW_THRESHOLDS.SHORT_INTERVIEW} turns): limited evidence → evaluate with leniency.
   * MEDIUM (${INTERVIEW_THRESHOLDS.MEDIUM_INTERVIEW} turns): balanced scoring.
   * LONG (${INTERVIEW_THRESHOLDS.LONG_INTERVIEW}+): detailed and strict.
4. Normalize scoring by available evidence:

   * Assign high or low scores only when there is enough information.
   * A short answer cannot earn extreme scores unless quality is clear.
5. Base feedback and scoring ONLY on:

   * Technical correctness
   * Explanation quality
   * Demonstrated reasoning
   * Communication
   * Adaptability (when visible)

SCORING RULES (MANDATORY):

* Technical Knowledge
* Communication
* Problem Solving
* Adaptability

For each:

* Score strictly from 0–100, but proportional to observed evidence, not hypothetical expectations.
* Do not let one weak question dominate the overall judgment if answers elsewhere were strong.

OUTPUT FORMAT (JSON only):

{
"executiveSummary": "Include specific examples of strong/weak performance and justify overall assessment with evidence. If scores are very low (below 10%), clearly explain why based on transcript.",
"strengths": ["Be specific about what they did well with examples from transcript - if no strengths observed, state 'Limited technical demonstration in this interview'"],
"improvements": ["Be specific about gaps observed with examples from transcript - focus on fundamental skills needed"],
"skills": [
{ "name": "Technical Knowledge", "score": 0-100, "feedback": "Specific evidence from transcript. If 0-10%: explain exactly what technical knowledge was missing. If listing technologies without explanation, score 5-10% maximum." },
{ "name": "Communication", "score": 0-100, "feedback": "Specific examples. If language mixing prevents technical discussion, score 5-15% maximum." },
{ "name": "Problem Solving", "score": 0-100, "feedback": "Specific examples. If candidate gives up immediately without trying, score 0-5% maximum." },
{ "name": "Adaptability", "score": 0-100, "feedback": "Specific examples. If no evidence of adapting approach or depth, score accordingly." }
],
"actionPlan": ["Specific, actionable recommendations focusing on fundamental skill building"]
}

REMEMBER: Be brutally honest and realistic. A 5% score with constructive feedback is more helpful than an inflated 30% score.
For the example transcript provided:
- Technical Knowledge should be 5-10% (only lists "Node.js, Express, MongoDB" with ZERO explanation, cannot explain WebSocket implementation)
- Communication should be 10-15% (heavy language mixing makes technical discussion incomprehensible)
- Problem Solving should be 0-5% (immediately gives up: "As my mind was stuck so I leave that" - shows NO problem-solving attempt)
- Adaptability should be 15-25% (provides basic responses but no evidence of adapting approach or depth)

    `;

    const cleanApiKey = API_KEY.replace(/[^a-zA-Z0-9_\-]/g, '');
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${cleanApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
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
        console.log(`✅ Feedback validated successfully (quality: ${qualityScore}/100, length: ${lengthAnalysis.category})`);

        return validation.data! as FeedbackData;
    } catch (error) {
        console.error("Error generating feedback:", error);
        // Return fallback data in case of error
        return {
            executiveSummary: "Feedback generation failed due to a technical issue. Please review the transcript manually.",
            strengths: ["Unable to analyze strengths"],
            improvements: ["Unable to analyze improvements"],
            skills: [
                { name: "Technical Knowledge", score: 0, feedback: "Analysis failed" },
                { name: "Communication", score: 0, feedback: "Analysis failed" },
                { name: "Problem Solving", score: 0, feedback: "Analysis failed" },
                { name: "Cultural Fit", score: 0, feedback: "Analysis failed" }
            ],
            actionPlan: ["Please try again later"]
        };
    }
}
