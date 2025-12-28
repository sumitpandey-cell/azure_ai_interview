// Mock environment variable BEFORE importing the module
process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'test-api-key-123';

import { generateFeedback, analyzeInterviewLength, INTERVIEW_THRESHOLDS } from '../lib/gemini-feedback';

// Mock the fetch API
global.fetch = jest.fn();

describe('Feedback Generation Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('analyzeInterviewLength', () => {
        it('should correctly analyze a too-short interview', () => {
            const transcript: any = [
                { speaker: 'ai', text: 'Hello', timestamp: 1 },
                { speaker: 'user', text: 'Hi', timestamp: 2 },
            ];

            const analysis = analyzeInterviewLength(transcript);

            expect(analysis.category).toBe('too-short');
            expect(analysis.totalTurns).toBe(2);
            expect(analysis.userTurns).toBe(1);
            expect(analysis.aiTurns).toBe(1);
        });

        it('should correctly analyze a short interview', () => {
            const transcript: any = [
                { speaker: 'ai', text: 'Question 1', timestamp: 1 },
                { speaker: 'user', text: 'Answer 1', timestamp: 2 },
                { speaker: 'ai', text: 'Question 2', timestamp: 3 },
                { speaker: 'user', text: 'Answer 2', timestamp: 4 },
                { speaker: 'ai', text: 'Question 3', timestamp: 5 },
                { speaker: 'user', text: 'Answer 3', timestamp: 6 },
            ];

            const analysis = analyzeInterviewLength(transcript);

            expect(analysis.category).toBe('short');
            expect(analysis.totalTurns).toBe(6);
            expect(analysis.userTurns).toBe(3);
            expect(analysis.aiTurns).toBe(3);
        });

        it('should correctly analyze a medium interview', () => {
            const transcript: any = Array.from({ length: 12 }, (_, i) => ({
                speaker: i % 2 === 0 ? 'ai' : 'user',
                text: `Message ${i}`,
                timestamp: i,
            }));

            const analysis = analyzeInterviewLength(transcript);

            expect(analysis.category).toBe('medium');
            expect(analysis.totalTurns).toBe(12);
        });

        it('should correctly analyze a long interview', () => {
            const transcript: any = Array.from({ length: 30 }, (_, i) => ({
                speaker: i % 2 === 0 ? 'ai' : 'user',
                text: `Message ${i}`,
                timestamp: i,
            }));

            const analysis = analyzeInterviewLength(transcript);

            expect(analysis.category).toBe('long');
            expect(analysis.totalTurns).toBe(30);
        });

        it('should handle both "speaker" and "sender" field names', () => {
            const transcriptWithSpeaker: any = [
                { speaker: 'ai', text: 'Hello', timestamp: 1 },
                { speaker: 'user', text: 'Hi', timestamp: 2 },
                { speaker: 'ai', text: 'How are you?', timestamp: 3 },
                { speaker: 'user', text: 'Good', timestamp: 4 },
            ];

            const transcriptWithSender: any = [
                { sender: 'ai', text: 'Hello', id: 1 },
                { sender: 'user', text: 'Hi', id: 2 },
                { sender: 'ai', text: 'How are you?', id: 3 },
                { sender: 'user', text: 'Good', id: 4 },
            ];

            const analysisSpeaker = analyzeInterviewLength(transcriptWithSpeaker);
            const analysisSender = analyzeInterviewLength(transcriptWithSender);

            expect(analysisSpeaker.userTurns).toBe(2);
            expect(analysisSpeaker.aiTurns).toBe(2);
            expect(analysisSender.userTurns).toBe(2);
            expect(analysisSender.aiTurns).toBe(2);
        });

        it('should calculate average user response length', () => {
            const transcript: any = [
                { speaker: 'user', text: 'Short', timestamp: 1 },
                { speaker: 'user', text: 'This is a longer response', timestamp: 2 },
            ];

            const analysis = analyzeInterviewLength(transcript);

            expect(analysis.avgUserResponseLength).toBeGreaterThan(0);
        });

        it('should count total words correctly', () => {
            const transcript: any = [
                { speaker: 'ai', text: 'Hello world', timestamp: 1 },
                { speaker: 'user', text: 'Hi there friend', timestamp: 2 },
            ];

            const analysis = analyzeInterviewLength(transcript);

            expect(analysis.totalWordCount).toBe(5);
        });
    });

    describe('generateFeedback', () => {
        const mockSessionData: any = {
            id: 'test-session-123',
            interview_type: 'technical',
            position: 'Full Stack Developer',
            config: {
                skills: ['React', 'Node.js', 'TypeScript'],
                difficulty: 'Intermediate',
            },
        };

        it('should return minimal feedback for too-short interviews', async () => {
            const transcript: any = [
                { speaker: 'ai', text: 'Hello', timestamp: 1 },
                { speaker: 'user', text: 'Hi', timestamp: 2 },
            ];

            const feedback = await generateFeedback(transcript, mockSessionData);

            expect(feedback.executiveSummary).toContain('too brief');
            expect(feedback.overallSkills).toHaveLength(4);
            expect(feedback.overallSkills[0].score).toBe(0);
            expect(feedback.technicalSkills).toHaveLength(0);
        });

        it('should handle database transcript format with speaker field', async () => {
            const transcript: any = [
                {
                    text: 'Hello',
                    speaker: 'user',
                    timestamp: 1766315782704,
                },
                {
                    text: 'Hello and welcome! I\'m Arjuna AI.',
                    speaker: 'ai',
                    timestamp: 1766315784853,
                },
                {
                    text: 'My name is Smith Pandey and I\'m a full stack developer.',
                    speaker: 'user',
                    timestamp: 1766315818400,
                },
                {
                    text: 'Great, Smith. Could you explain React?',
                    speaker: 'ai',
                    timestamp: 1766315824968,
                },
                {
                    text: 'React is a JavaScript library for building user interfaces.',
                    speaker: 'user',
                    timestamp: 1766315830000,
                },
            ];

            // Mock successful API response
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    candidates: [{
                        content: {
                            parts: [{
                                text: JSON.stringify({
                                    executiveSummary: 'Good interview',
                                    strengths: ['Clear communication'],
                                    improvements: ['More technical depth'],
                                    overallSkills: [
                                        { name: 'Technical Knowledge', score: 70, feedback: 'Good understanding' },
                                        { name: 'Communication', score: 80, feedback: 'Clear responses' },
                                        { name: 'Problem Solving', score: 65, feedback: 'Logical approach' },
                                        { name: 'Cultural Fit', score: 75, feedback: 'Professional attitude' },
                                    ],
                                    technicalSkills: [
                                        { name: 'React', score: 70, feedback: 'Solid understanding' },
                                    ],
                                    actionPlan: ['Practice more coding'],
                                }),
                            }],
                        },
                    }],
                }),
            });

            const feedback = await generateFeedback(transcript, mockSessionData);

            expect(feedback).toBeDefined();
            expect(feedback.overallSkills).toHaveLength(4);
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        it('should call Gemini API with correct parameters', async () => {
            const transcript: any = Array.from({ length: 10 }, (_, i) => ({
                speaker: i % 2 === 0 ? 'ai' : 'user',
                text: `Message ${i}`,
                timestamp: Date.now() + i,
            }));

            // Mock successful API response
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    candidates: [{
                        content: {
                            parts: [{
                                text: JSON.stringify({
                                    executiveSummary: 'Test summary',
                                    strengths: ['Test strength'],
                                    improvements: ['Test improvement'],
                                    overallSkills: [
                                        { name: 'Technical Knowledge', score: 50, feedback: 'Test' },
                                        { name: 'Communication', score: 50, feedback: 'Test' },
                                        { name: 'Problem Solving', score: 50, feedback: 'Test' },
                                        { name: 'Cultural Fit', score: 50, feedback: 'Test' },
                                    ],
                                    technicalSkills: [],
                                    actionPlan: ['Test action'],
                                }),
                            }],
                        },
                    }],
                }),
            });

            await generateFeedback(transcript, mockSessionData);

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('generativelanguage.googleapis.com'),
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: expect.any(String),
                })
            );
        });

        it('should return fallback feedback on API error', async () => {
            const transcript: any = Array.from({ length: 10 }, (_, i) => ({
                speaker: i % 2 === 0 ? 'ai' : 'user',
                text: `Message ${i}`,
                timestamp: Date.now() + i,
            }));

            // Mock API error
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

            const feedback = await generateFeedback(transcript, mockSessionData);

            expect(feedback.executiveSummary).toContain('failed');
            expect(feedback.overallSkills[0].feedback).toContain('Analysis failed');
        });

        it('should handle company-specific interview context', async () => {
            const sessionWithCompany: any = {
                ...mockSessionData,
                config: {
                    ...mockSessionData.config,
                    companyInterviewConfig: {
                        companyTemplateId: 'google-123',
                        companyName: 'Google',
                        role: 'Senior SWE',
                        experienceLevel: 'Senior',
                    },
                },
            };

            const transcript: any = Array.from({ length: 10 }, (_, i) => ({
                speaker: i % 2 === 0 ? 'ai' : 'user',
                text: `Message ${i}`,
                timestamp: Date.now() + i,
            }));

            // Mock successful API response
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    candidates: [{
                        content: {
                            parts: [{
                                text: JSON.stringify({
                                    executiveSummary: 'Test summary',
                                    strengths: ['Test'],
                                    improvements: ['Test'],
                                    overallSkills: [
                                        { name: 'Technical Knowledge', score: 50, feedback: 'Test' },
                                        { name: 'Communication', score: 50, feedback: 'Test' },
                                        { name: 'Problem Solving', score: 50, feedback: 'Test' },
                                        { name: 'Cultural Fit', score: 50, feedback: 'Test' },
                                    ],
                                    technicalSkills: [],
                                    actionPlan: ['Test'],
                                }),
                            }],
                        },
                    }],
                }),
            });

            await generateFeedback(transcript, sessionWithCompany);

            const fetchCall = (fetch as jest.Mock).mock.calls[0];
            const requestBody = JSON.parse(fetchCall[1].body);
            const prompt = requestBody.contents[0].parts[0].text;

            expect(prompt).toContain('Google');
            expect(prompt).toContain('Senior SWE');
        });

        it('should filter out internal thoughts from transcript', async () => {
            const transcript: any = [
                { speaker: 'ai', text: '**Greeting**\nHello there', timestamp: 1 },
                { speaker: 'user', text: 'Hi\n* internal thought\nHow are you?', timestamp: 2 },
                { speaker: 'ai', text: 'Good\n(thinking)', timestamp: 3 },
                { speaker: 'user', text: 'Great', timestamp: 4 },
            ];

            // Mock successful API response
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    candidates: [{
                        content: {
                            parts: [{
                                text: JSON.stringify({
                                    executiveSummary: 'Test',
                                    strengths: ['Test'],
                                    improvements: ['Test'],
                                    overallSkills: [
                                        { name: 'Technical Knowledge', score: 50, feedback: 'Test' },
                                        { name: 'Communication', score: 50, feedback: 'Test' },
                                        { name: 'Problem Solving', score: 50, feedback: 'Test' },
                                        { name: 'Cultural Fit', score: 50, feedback: 'Test' },
                                    ],
                                    technicalSkills: [],
                                    actionPlan: ['Test'],
                                }),
                            }],
                        },
                    }],
                }),
            });

            await generateFeedback(transcript, mockSessionData);

            const fetchCall = (fetch as jest.Mock).mock.calls[0];
            const requestBody = JSON.parse(fetchCall[1].body);
            const prompt = requestBody.contents[0].parts[0].text;

            // Internal thoughts should be filtered out
            expect(prompt).not.toContain('**Greeting**');
            expect(prompt).not.toContain('* internal thought');
            expect(prompt).not.toContain('(thinking)');
        });
    });

    describe('INTERVIEW_THRESHOLDS', () => {
        it('should have correct threshold values', () => {
            expect(INTERVIEW_THRESHOLDS.MINIMUM_TURNS).toBe(4);
            expect(INTERVIEW_THRESHOLDS.SHORT_INTERVIEW).toBe(8);
            expect(INTERVIEW_THRESHOLDS.MEDIUM_INTERVIEW).toBe(15);
            expect(INTERVIEW_THRESHOLDS.LONG_INTERVIEW).toBe(25);
        });
    });
});
