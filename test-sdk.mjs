
import { RoomServiceClient, AgentDispatchClient } from "livekit-server-sdk";
import dotenv from 'dotenv';
dotenv.config();

const lkUrl = process.env.LIVEKIT_URL?.trim();
const lkKey = process.env.LIVEKIT_API_KEY?.trim();
const lkSecret = process.env.LIVEKIT_API_SECRET?.trim();

console.log('URL:', lkUrl);

async function test() {
    const roomClient = new RoomServiceClient(lkUrl, lkKey, lkSecret);
    const dispatchClient = new AgentDispatchClient(lkUrl, lkKey, lkSecret);

    const roomName = "test-room-" + Math.random().toString(36).substring(7);

    console.log('Creating room...');
    try {
        await roomClient.createRoom({ name: roomName });
        console.log('✅ Room created');

        console.log('Dispatching agent...');
        await dispatchClient.createDispatch(roomName, 'Arjuna-Interview-AI');
        console.log('✅ Agent dispatched');
    } catch (err) {
        console.error('❌ Error:', err);
        if (err.cause) console.error('Cause:', err.cause);
    }
}

test();
