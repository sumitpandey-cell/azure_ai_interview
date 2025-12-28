/**
 * Test script for LiveKit Token API
 * 
 * Usage: 
 * 1. Make sure the dev server is running (npm run dev)
 * 2. Run this script: npx tsx tests/test_token_api.ts <SESSION_ID>
 */

const SESSION_ID = process.argv[2];
const BASE_URL = 'http://localhost:3000';

if (!SESSION_ID) {
    console.error('Please provide a SESSION_ID as an argument');
    console.log('Usage: npx tsx tests/test_token_api.ts <SESSION_ID>');
    process.exit(1);
}

async function testTokenApi() {
    console.log(`Testing LiveKit token API for session: ${SESSION_ID}`);

    try {
        const response = await fetch(`${BASE_URL}/api/livekit_token?sessionId=${SESSION_ID}`);

        console.log('\n--- API Response ---');
        console.log('Status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', errorText);
            return;
        }

        const data = await response.json() as any;

        if (data.token && data.url) {
            console.log('✅ Success: Received token and URL');
        } else {
            console.log('❌ Failure: Missing token or URL in response');
            console.log(data);
        }

        console.log('\nCheck your terminal logs where the dev server is running to see "Session context prepared for agent"');
        console.log('It should now include "questions" and "isCompanySpecific: true" if the session is a company interview.');

    } catch (error: any) {
        console.error('❌ API Error:', error.message);
    }
}

testTokenApi();
