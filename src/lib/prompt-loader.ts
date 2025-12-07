import { CompanyQuestion } from '@/types/company-types';
import { PerformanceHistory } from '@/types/performance-types';
import generalInterviewTemplate from '@/prompts/general-interview.txt?raw';
import companyInterviewTemplate from '@/prompts/company-interview.txt?raw';

interface PromptVariables {
    interviewType: string;
    position: string;
    companyName?: string;
    timeLeftMinutes?: number;
    questions?: CompanyQuestion[];
    skills?: string[];
    difficulty?: string;
    performanceHistory?: PerformanceHistory;
    jobDescription?: string;
}

/**
 * Formats a list of company questions for injection into the system prompt
 */
function formatQuestionsForPrompt(questions: CompanyQuestion[]): string {
    return questions
        .map((q, index) => {
            const typeLabel = `[${q.question_type}]`;
            const difficultyLabel = q.difficulty ? ` (${q.difficulty})` : '';
            const roleLabel = q.role ? ` - Role: ${q.role}` : '';

            return `${index + 1}. ${typeLabel}${difficultyLabel}${roleLabel}
   ${q.question_text}`;
        })
        .join('\n\n');
}

/**
 * Generates time constraint text based on remaining minutes
 */
function generateTimeConstraint(timeLeftMinutes?: number): string {
    if (!timeLeftMinutes) {
        return 'Manage your time effectively throughout the interview.';
    }

    return `You have approximately ${timeLeftMinutes} minutes remaining for this interview. Manage your time accordingly.`;
}

/**
 * Formats performance history into a readable text block for the AI
 */
function formatPerformanceHistory(performanceHistory?: PerformanceHistory): string {
    if (!performanceHistory || performanceHistory.recentInterviews.length === 0) {
        return 'This is the candidate\'s first interview. No previous performance data available.';
    }

    const { recentInterviews, averageScores, trend } = performanceHistory;
    const interviewCount = recentInterviews.length;

    let historyText = `\n## CANDIDATE PERFORMANCE HISTORY\n\n`;
    historyText += `The candidate has completed ${interviewCount} previous interview${interviewCount > 1 ? 's' : ''}.\n\n`;

    // Add average scores
    historyText += `**Average Scores Across Last ${interviewCount} Interview${interviewCount > 1 ? 's' : ''}:**\n`;
    historyText += `- Technical Knowledge: ${averageScores.technicalKnowledge}%\n`;
    historyText += `- Communication: ${averageScores.communication}%\n`;
    historyText += `- Problem Solving: ${averageScores.problemSolving}%\n`;
    historyText += `- Adaptability: ${averageScores.adaptability}%\n`;
    historyText += `- Overall Average: ${averageScores.overall}%\n\n`;

    // Add trend information
    const trendText = trend === 'improving' ? 'IMPROVING ↗️' :
        trend === 'declining' ? 'DECLINING ↘️' :
            trend === 'consistent' ? 'CONSISTENT →' : 'INSUFFICIENT DATA';
    historyText += `**Performance Trend:** ${trendText}\n\n`;

    // Add recent interview details
    historyText += `**Recent Interview Details:**\n`;
    recentInterviews.forEach((interview, index) => {
        const date = new Date(interview.completedAt).toLocaleDateString();
        historyText += `${index + 1}. ${interview.position} (${interview.interviewType}) - ${date} - Score: ${interview.overallScore}%\n`;
    });

    historyText += `\n**How to Use This Information:**\n`;
    historyText += `- Adjust question difficulty based on their average scores\n`;
    historyText += `- Focus more on areas where they scored below 60%\n`;
    historyText += `- Acknowledge improvements if the trend is positive\n`;
    historyText += `- Provide encouragement if scores are declining\n`;
    historyText += `- Challenge them appropriately in their strong areas (scores above 75%)\n`;
    historyText += `- Be patient and supportive in their weak areas (scores below 50%)\n`;

    return historyText;
}

/**
 * Loads and processes the general interview system prompt
 */
export function loadGeneralInterviewPrompt(variables: PromptVariables): string {
    let prompt = generalInterviewTemplate;

    // Replace placeholders
    prompt = prompt.replace(/\{\{INTERVIEW_TYPE\}\}/g, variables.interviewType);
    prompt = prompt.replace(/\{\{POSITION\}\}/g, variables.position);
    prompt = prompt.replace(/\{\{TIME_CONSTRAINT\}\}/g, generateTimeConstraint(variables.timeLeftMinutes));

    // Add performance history if available
    const performanceHistoryText = formatPerformanceHistory(variables.performanceHistory);
    prompt = prompt.replace(/\{\{PERFORMANCE_HISTORY\}\}/g, performanceHistoryText);

    // Add skills and difficulty information if available
    if (variables.skills && variables.skills.length > 0) {
        const skillsText = `\n\nFocus on assessing the following skills: ${variables.skills.join(', ')}.`;
        prompt += skillsText;
    }

    if (variables.difficulty) {
        const difficultyText = `\nThe difficulty level for this interview is: ${variables.difficulty}. Adjust your questions accordingly.`;
        prompt += difficultyText;
    }

    if (variables.jobDescription) {
        const jobDescText = `\n\n## JOB DESCRIPTION\n\nThe candidate is applying for a position with the following job description:\n\n${variables.jobDescription}\n\nTailor your questions to assess if the candidate meets the requirements mentioned in this job description.`;
        prompt += jobDescText;
    }

    return prompt.trim();
}

/**
 * Loads and processes the company-specific interview system prompt
 */
export function loadCompanyInterviewPrompt(variables: PromptVariables): string {
    if (!variables.companyName || !variables.questions || variables.questions.length === 0) {
        console.warn('Company interview prompt requested but missing company name or questions. Falling back to general prompt.');
        return loadGeneralInterviewPrompt(variables);
    }

    let prompt = companyInterviewTemplate;

    // Replace placeholders
    prompt = prompt.replace(/\{\{COMPANY_NAME\}\}/g, variables.companyName);
    prompt = prompt.replace(/\{\{POSITION\}\}/g, variables.position);
    prompt = prompt.replace(/\{\{INTERVIEW_TYPE\}\}/g, variables.interviewType);
    prompt = prompt.replace(/\{\{TIME_CONSTRAINT\}\}/g, generateTimeConstraint(variables.timeLeftMinutes));
    prompt = prompt.replace(/\{\{QUESTIONS_LIST\}\}/g, formatQuestionsForPrompt(variables.questions));

    // Add performance history if available
    const performanceHistoryText = formatPerformanceHistory(variables.performanceHistory);
    prompt = prompt.replace(/\{\{PERFORMANCE_HISTORY\}\}/g, performanceHistoryText);

    // Add job description if available
    if (variables.jobDescription) {
        const jobDescText = `\n\n## JOB DESCRIPTION\n\nThe candidate is applying for a position with the following job description:\n\n${variables.jobDescription}\n\nTailor your questions to assess if the candidate meets the requirements mentioned in this job description.`;
        prompt += jobDescText;
    }

    return prompt.trim();
}

export function loadSystemPrompt(variables: PromptVariables): string {
    // Determine if this is a company-specific interview
    const isCompanyInterview = variables.companyName && variables.questions && variables.questions.length > 0;

    let basePrompt: string;
    if (isCompanyInterview) {
        console.log(`Loading company interview prompt for ${variables.companyName} with ${variables.questions?.length} questions`);
        basePrompt = loadCompanyInterviewPrompt(variables);
    } else {
        console.log('Loading general interview prompt');
        basePrompt = loadGeneralInterviewPrompt(variables);
    }

    return basePrompt;
}

/**
 * Detects if a question is a coding question
 */
export function isCodingQuestion(question: CompanyQuestion): boolean {
    return question.question_type === 'Coding';
}

/**
 * Detects coding keywords in text (for fallback detection)
 */
export function containsCodingKeywords(text: string): boolean {
    const codingKeywords = [
        'write a function',
        'implement',
        'write code',
        'code this',
        'solve this problem',
        'algorithm',
        'write a program',
        'create a function',
        'coding challenge',
        'programming problem',
        'leetcode',
        'hackerrank'
    ];

    const lowerText = text.toLowerCase();
    return codingKeywords.some(keyword => lowerText.includes(keyword));
}
