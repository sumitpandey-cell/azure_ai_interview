
import dotenv from 'dotenv';
dotenv.config();

console.log('LIVEKIT_URL:', process.env.LIVEKIT_URL);
console.log('LIVEKIT_API_KEY set:', !!process.env.LIVEKIT_API_KEY);
console.log('LIVEKIT_API_SECRET set:', !!process.env.LIVEKIT_API_SECRET);

async function testConnection() {
    const url = process.env.LIVEKIT_URL;
    if (!url) {
        console.log('Error: LIVEKIT_URL is not set');
        return;
    }

    // Convert wss to https for testing catch
    const testUrl = url.replace('wss://', 'https://').replace('ws://', 'http://');
    console.log('Testing connection to:', testUrl);

    try {
        const res = await fetch(testUrl);
        console.log('Fetch response status:', res.status);
    } catch (err) {
        console.log('Fetch failed:', err.message);
    }
}

testConnection();
