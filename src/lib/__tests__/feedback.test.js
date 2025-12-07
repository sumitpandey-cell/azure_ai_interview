/**
 * Feedback Generation and Merging Test Suite
 * 
 * Run with: node src/lib/__tests__/feedback.test.js
 * Or add to package.json: "test": "node src/lib/__tests__/feedback.test.js"
 */

const assert = require('assert').strict;

// Test 1: Merge feedback by timestamp - instant is newer
function testMergeFeedbackInstantNewer() {
    const dbFeedback = {
        executiveSummary: 'Old summary',
        strengths: ['Old strength'],
        improvements: [],
        skills: [{ name: 'Test', score: 50, feedback: 'Old' }],
        actionPlan: [],
        generatedAt: '2025-01-01T10:00:00Z'
    };

    const instantFeedback = {
        executiveSummary: 'New summary',
        strengths: ['New strength'],
        improvements: ['New improvement'],
        skills: [{ name: 'Test', score: 85, feedback: 'New' }],
        actionPlan: ['New action'],
        generatedAt: '2025-01-01T10:05:00Z'
    };

    const mergeFeedback = (dbFeedback, instant) => {
        if (!dbFeedback && !instant) return {};
        if (!dbFeedback) return instant;
        if (!instant) return dbFeedback;

        const dbTs = dbFeedback.generatedAt ? Date.parse(dbFeedback.generatedAt) : 0;
        const instTs = instant.generatedAt ? Date.parse(instant.generatedAt) : 0;

        if (instTs >= dbTs) {
            return {
                ...dbFeedback,
                ...instant,
                generatedAt: instant.generatedAt || dbFeedback.generatedAt,
            };
        }

        return dbFeedback;
    };

    const merged = mergeFeedback(dbFeedback, instantFeedback);

    assert.strictEqual(merged.executiveSummary, 'New summary', 'Should use instant summary when newer');
    assert.deepEqual(merged.strengths, ['New strength'], 'Should use instant strengths');
    assert.strictEqual(merged.skills[0].score, 85, 'Should use instant skill score');
    console.log('✓ Test 1: Merge feedback - instant is newer');
}

// Test 2: Merge feedback by timestamp - DB is newer
function testMergeFeedbackDBNewer() {
    const dbFeedback = {
        executiveSummary: 'New DB summary',
        strengths: ['DB strength'],
        improvements: [],
        skills: [{ name: 'Test', score: 90, feedback: 'DB' }],
        actionPlan: [],
        generatedAt: '2025-01-01T10:10:00Z'
    };

    const instantFeedback = {
        executiveSummary: 'Old instant summary',
        strengths: ['Old strength'],
        improvements: [],
        skills: [{ name: 'Test', score: 60, feedback: 'Old' }],
        actionPlan: [],
        generatedAt: '2025-01-01T10:05:00Z'
    };

    const mergeFeedback = (dbFeedback, instant) => {
        if (!dbFeedback && !instant) return {};
        if (!dbFeedback) return instant;
        if (!instant) return dbFeedback;

        const dbTs = dbFeedback.generatedAt ? Date.parse(dbFeedback.generatedAt) : 0;
        const instTs = instant.generatedAt ? Date.parse(instant.generatedAt) : 0;

        if (instTs >= dbTs) {
            return { ...dbFeedback, ...instant, generatedAt: instant.generatedAt || dbFeedback.generatedAt };
        }

        return dbFeedback;
    };

    const merged = mergeFeedback(dbFeedback, instantFeedback);

    assert.strictEqual(merged.executiveSummary, 'New DB summary', 'Should use DB summary when newer');
    assert.strictEqual(merged.skills[0].score, 90, 'Should use DB skill score');
    console.log('✓ Test 2: Merge feedback - DB is newer');
}

// Test 3: Merge feedback - only DB exists
function testMergeFeedbackOnlyDB() {
    const dbFeedback = {
        executiveSummary: 'DB only summary',
        strengths: ['DB strength'],
        improvements: [],
        skills: [],
        actionPlan: []
    };

    const mergeFeedback = (dbFeedback, instant) => {
        if (!dbFeedback && !instant) return {};
        if (!dbFeedback) return instant;
        if (!instant) return dbFeedback;

        const dbTs = dbFeedback.generatedAt ? Date.parse(dbFeedback.generatedAt) : 0;
        const instTs = instant.generatedAt ? Date.parse(instant.generatedAt) : 0;

        if (instTs >= dbTs) {
            return { ...dbFeedback, ...instant, generatedAt: instant.generatedAt || dbFeedback.generatedAt };
        }

        return dbFeedback;
    };

    const merged = mergeFeedback(dbFeedback, null);

    assert.strictEqual(merged.executiveSummary, 'DB only summary', 'Should return DB feedback when instant is null');
    console.log('✓ Test 3: Merge feedback - only DB exists');
}

// Test 4: Merge feedback - only instant exists
function testMergeFeedbackOnlyInstant() {
    const instantFeedback = {
        executiveSummary: 'Instant only summary',
        strengths: ['Instant strength'],
        improvements: [],
        skills: [],
        actionPlan: [],
        generatedAt: '2025-01-01T10:00:00Z'
    };

    const mergeFeedback = (dbFeedback, instant) => {
        if (!dbFeedback && !instant) return {};
        if (!dbFeedback) return instant;
        if (!instant) return dbFeedback;

        const dbTs = dbFeedback.generatedAt ? Date.parse(dbFeedback.generatedAt) : 0;
        const instTs = instant.generatedAt ? Date.parse(instant.generatedAt) : 0;

        if (instTs >= dbTs) {
            return { ...dbFeedback, ...instant, generatedAt: instant.generatedAt || dbFeedback.generatedAt };
        }

        return dbFeedback;
    };

    const merged = mergeFeedback(null, instantFeedback);

    assert.strictEqual(merged.executiveSummary, 'Instant only summary', 'Should return instant feedback when DB is null');
    console.log('✓ Test 4: Merge feedback - only instant exists');
}

// Test 5: Merge feedback - both null
function testMergeFeedbackBothNull() {
    const mergeFeedback = (dbFeedback, instant) => {
        if (!dbFeedback && !instant) return {};
        if (!dbFeedback) return instant;
        if (!instant) return dbFeedback;

        const dbTs = dbFeedback.generatedAt ? Date.parse(dbFeedback.generatedAt) : 0;
        const instTs = instant.generatedAt ? Date.parse(instant.generatedAt) : 0;

        if (instTs >= dbTs) {
            return { ...dbFeedback, ...instant, generatedAt: instant.generatedAt || dbFeedback.generatedAt };
        }

        return dbFeedback;
    };

    const merged = mergeFeedback(null, null);

    assert.deepEqual(merged, {}, 'Should return empty object when both are null');
    console.log('✓ Test 5: Merge feedback - both null');
}

// Test 6: Fallback feedback structure
function testFallbackFeedbackStructure() {
    const fallbackFeedback = {
        executiveSummary: 'Feedback generation failed due to a technical issue. Please review the transcript manually.',
        strengths: ['Unable to analyze strengths'],
        improvements: ['Unable to analyze improvements'],
        skills: [
            { name: 'Technical Knowledge', score: 0, feedback: 'Analysis failed' },
            { name: 'Communication', score: 0, feedback: 'Analysis failed' },
            { name: 'Problem Solving', score: 0, feedback: 'Analysis failed' },
            { name: 'Cultural Fit', score: 0, feedback: 'Analysis failed' }
        ],
        actionPlan: ['Please try again later']
    };

    // Verify structure
    assert(fallbackFeedback.hasOwnProperty('executiveSummary'), 'Should have executiveSummary');
    assert(Array.isArray(fallbackFeedback.strengths), 'Should have strengths array');
    assert(Array.isArray(fallbackFeedback.improvements), 'Should have improvements array');
    assert(Array.isArray(fallbackFeedback.skills), 'Should have skills array');
    assert(fallbackFeedback.skills.length === 4, 'Should have 4 skills');
    assert(Array.isArray(fallbackFeedback.actionPlan), 'Should have actionPlan array');

    // Verify all skill scores are 0
    fallbackFeedback.skills.forEach(skill => {
        assert.strictEqual(skill.score, 0, `Skill ${skill.name} should have score 0`);
    });

    console.log('✓ Test 6: Fallback feedback structure is valid');
}

// Test 7: JSON parsing edge cases - markdown code fences
function testMarkdownCodeFenceStripping() {
    const jsonWithFences = `\`\`\`json
{
    "executiveSummary": "Test summary",
    "strengths": ["Test"],
    "improvements": [],
    "skills": [{ "name": "Test", "score": 80, "feedback": "Good" }],
    "actionPlan": []
}
\`\`\``;

    // Replicate the strip logic from gemini-feedback.ts
    const jsonString = jsonWithFences
        .replace(/^```json\n|\n```$/g, '')
        .replace(/^```\n|\n```$/g, '')
        .trim();

    const parsed = JSON.parse(jsonString);
    assert.strictEqual(parsed.executiveSummary, 'Test summary', 'Should correctly strip markdown fences');
    console.log('✓ Test 7: Markdown code fence stripping');
}

// Test 8: Score calculation from skills array
function testOverallScoreCalculation() {
    const feedbackData = {
        skills: [
            { name: 'Technical Knowledge', score: 80, feedback: 'Good' },
            { name: 'Communication', score: 70, feedback: 'OK' },
            { name: 'Problem Solving', score: 90, feedback: 'Great' },
            { name: 'Cultural Fit', score: 60, feedback: 'Acceptable' }
        ]
    };

    // Replicate score calculation from InterviewReport
    const overallScore = Math.round(
        (feedbackData.skills || []).reduce((acc, s) => acc + (s.score || 0), 0) /
            ((feedbackData.skills || []).length || 1)
    );

    assert.strictEqual(overallScore, 75, 'Overall score should be average of all skills (80+70+90+60)/4 = 75');
    console.log('✓ Test 8: Overall score calculation from skills');
}

// Test 9: Empty skills array score calculation
function testEmptySkillsScoreCalculation() {
    const feedbackData = {
        skills: []
    };

    const overallScore = Math.round(
        (feedbackData.skills || []).reduce((acc, s) => acc + (s.score || 0), 0) /
            ((feedbackData.skills || []).length || 1)
    );

    assert.strictEqual(overallScore, 0, 'Overall score should be 0 when skills array is empty');
    console.log('✓ Test 9: Empty skills array score calculation');
}

// Test 10: Missing generatedAt timestamp defaults to 0
function testMissingTimestampDefaults() {
    const feedbackWithoutTs = {
        executiveSummary: 'Test'
    };

    const ts = feedbackWithoutTs.generatedAt ? Date.parse(feedbackWithoutTs.generatedAt) : 0;
    assert.strictEqual(ts, 0, 'Missing timestamp should default to 0');
    console.log('✓ Test 10: Missing timestamp defaults to 0');
}

// Run all tests
function runTests() {
    console.log('\n🧪 Running Feedback & Merging Test Suite\n');

    try {
        testMergeFeedbackInstantNewer();
        testMergeFeedbackDBNewer();
        testMergeFeedbackOnlyDB();
        testMergeFeedbackOnlyInstant();
        testMergeFeedbackBothNull();
        testFallbackFeedbackStructure();
        testMarkdownCodeFenceStripping();
        testOverallScoreCalculation();
        testEmptySkillsScoreCalculation();
        testMissingTimestampDefaults();

        console.log('\n✅ All 10 tests passed!\n');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

runTests();
