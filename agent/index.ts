import "dotenv/config";
import { defineAgent, cli, WorkerOptions } from "@livekit/agents";
import { AudioSource, AudioFrame, LocalAudioTrack, TrackKind, TrackSource, TrackPublishOptions, RoomEvent, AudioStream } from "@livekit/rtc-node";
import WebSocket from "ws";
import { fileURLToPath } from "url";

export default defineAgent({
  entry: async (ctx) => {
    console.log("🤖 Agent starting…");

    await ctx.connect();
    console.log("✓ Connected to LiveKit room");

    const participant = await ctx.waitForParticipant();
    console.log("✓ Participant joined:", participant.identity);

    // Create Audio Source for sending Azure audio → LiveKit
    const azureAudioSource = new AudioSource(24000, 1);
    console.log("✓ Audio source created");

    // Ensure local participant is available
    if (!ctx.room.localParticipant) {
      throw new Error("Local participant not available");
    }

    // Publish the AI audio to the room with SOURCE_UNKNOWN (not microphone)
    const aiTrack = await ctx.room.localParticipant.publishTrack(
      LocalAudioTrack.createAudioTrack("ai-audio", azureAudioSource),
      new TrackPublishOptions({ source: TrackSource.SOURCE_UNKNOWN })
    );
    console.log("✓ AI audio track published to room");

    // Connect to Azure Realtime API
    const azureUrl = `${process.env.AZURE_ENDPOINT}/openai/realtime?api-version=2024-10-01-preview&deployment=${process.env.AZURE_OPENAI_DEPLOYMENT}`;
    console.log("🔌 Connecting to Azure:", azureUrl);

    const ws = new WebSocket(azureUrl, {
      headers: {
        "api-key": process.env.AZURE_API_KEY!,
      },
    });

    let isAzureReady = false;

    ws.on("open", () => {
      console.log("✓ Connected to Azure Realtime API");

      // Configure the session
      ws.send(
        JSON.stringify({
          type: "session.update",
          session: {
            turn_detection: {
              type: "server_vad",
              threshold: 0.7,  // Higher threshold = less sensitive (0.0 to 1.0)
              prefix_padding_ms: 300,
              silence_duration_ms: 1200  // Longer silence required before considering speech ended
            },
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
            input_audio_transcription: {
              model: "whisper-1"  // Enable user audio transcription
            },
            instructions: "You are an AI interviewer. Start by greeting the candidate and asking their first interview question. Keep responses concise and professional.",
            voice: "alloy",
            temperature: 0.8
          },
        })
      );
      console.log("✓ Session configuration sent to Azure (stricter VAD settings)");
    });

    // USER → AZURE: Stream user's mic audio to Azure (ONLY from remote participants)
    ctx.room.on(RoomEvent.TrackSubscribed, async (track, publication, participant) => {
      if (track.kind === TrackKind.KIND_AUDIO) {
        // CRITICAL: Only process audio from remote participants (users), NOT from the agent itself
        // TrackSubscribed only fires for remote participants, so we just need to verify identity
        if (participant.identity !== ctx.room.localParticipant?.identity) {
          console.log("🎤 Got user audio track from:", participant.identity, "— forwarding to Azure");

          // Create an AudioStream from the track
          const audioStream = new AudioStream(track, { sampleRate: 24000, numChannels: 1 });
          const reader = audioStream.getReader();

          // Read audio frames and send to Azure
          (async () => {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // Only send if Azure WebSocket is ready
                if (!isAzureReady) {
                  continue; // Skip this frame if not ready yet
                }

                // Convert Int16Array to base64 for Azure
                const buffer = Buffer.from(value.data.buffer);
                const base64Audio = buffer.toString("base64");

                ws.send(
                  JSON.stringify({
                    type: "input_audio_buffer.append",
                    audio: base64Audio,
                  })
                );
              }
            } catch (error) {
              console.error("❌ Error reading audio stream:", error);
            }
          })();
        } else {
          console.log("⛔ Ignoring agent's own audio track (preventing loop)");
        }
      }
    });

    // Audio Streaming Configuration
    const INTERVAL_MS = 20;
    const SAMPLE_RATE = 24000;
    const CHANNELS = 1;
    const BYTES_PER_SAMPLE = 2;
    const BYTES_PER_FRAME = SAMPLE_RATE * (INTERVAL_MS / 1000) * BYTES_PER_SAMPLE * CHANNELS; // 960 bytes
    const PRE_BUFFER_MS = 150; // Wait for 150ms of audio before playing (Solid buffer)
    const PRE_BUFFER_SIZE = (PRE_BUFFER_MS / INTERVAL_MS) * BYTES_PER_FRAME;

    let audioBuffer: Buffer = Buffer.alloc(0);
    let isPlaying = false;
    let isResponseComplete = false;
    let playbackInterval: NodeJS.Timeout | null = null;

    // Transcript accumulation
    let currentAiTranscript = "";

    // Manual turn detection state
    let isSpeaking = false;
    let speechEndTimeout: NodeJS.Timeout | null = null;
    const SPEECH_END_DELAY_MS = 1000; // Wait 1 second after speech stops before triggering AI response


    // Helper function to send transcripts to frontend via LiveKit Data Channel
    const sendTranscriptToRoom = (speaker: "user" | "ai", transcript: string, isComplete: boolean = true) => {
      const transcriptData = JSON.stringify({
        type: "transcript",
        speaker,
        transcript,
        isComplete,
        timestamp: Date.now()
      });

      // Send to all participants in the room
      ctx.room.localParticipant?.publishData(
        new TextEncoder().encode(transcriptData),
        { reliable: true }
      );
    };

    const startPlaybackLoop = () => {
      if (playbackInterval) return;

      console.log("▶️ Starting playback loop");
      playbackInterval = setInterval(() => {
        // 1. If buffer has enough data, play it
        if (audioBuffer.length >= BYTES_PER_FRAME) {
          const chunk = audioBuffer.subarray(0, BYTES_PER_FRAME);
          audioBuffer = audioBuffer.subarray(BYTES_PER_FRAME);
          sendFrame(chunk);
        }
        // 2. If buffer is empty but AI is still generating, send SILENCE (Critical for smoothness)
        else if (!isResponseComplete) {
          // console.log("⚠️ Buffer underrun - inserting silence");
          const silence = Buffer.alloc(BYTES_PER_FRAME).fill(0);
          sendFrame(silence);
        }
        // 3. If buffer is empty and AI is done, stop loop
        else {
          console.log("⏹️ Playback finished");
          if (playbackInterval) clearInterval(playbackInterval);
          playbackInterval = null;
          isPlaying = false;
          // Reset buffer just in case
          audioBuffer = Buffer.alloc(0);
        }
      }, INTERVAL_MS);
    };

    const sendFrame = (chunk: Buffer) => {
      const int16Array = new Int16Array(chunk.length / 2);
      for (let i = 0; i < int16Array.length; i++) {
        int16Array[i] = chunk.readInt16LE(i * 2);
      }

      const frame = new AudioFrame(
        int16Array,
        SAMPLE_RATE,
        CHANNELS,
        int16Array.length / CHANNELS
      );
      azureAudioSource.captureFrame(frame);
    };

    // AZURE → USER: Stream Azure audio deltas into LiveKit
    ws.on("message", (msg) => {
      const data = JSON.parse(msg.toString());

      // Log all Azure messages for debugging
      if (data.type !== "input_audio_buffer.speech_started" &&
        data.type !== "input_audio_buffer.committed" &&
        data.type !== "conversation.item.input_audio_transcription.completed") {
        console.log("📨 Azure message:", data.type);
      }

      if (data.type === "session.updated") {
        console.log("✓ Session updated successfully");
        isAzureReady = true;
        console.log("✓ Azure ready to receive audio");

        // Trigger AI to speak first (with small delay to ensure connection is stable)
        setTimeout(() => {
          ws.send(JSON.stringify({ type: "response.create" }));
          console.log("🎙️ Triggered AI to start speaking");
        }, 500);
      }

      // === SPEECH DETECTION LOGGING ===
      // Log when user starts speaking (for debugging)
      if (data.type === "input_audio_buffer.speech_started") {
        console.log("🎤 User started speaking");
        isSpeaking = true;
      }

      // Log when user stops speaking (Azure VAD will auto-trigger response)
      if (data.type === "input_audio_buffer.speech_stopped") {
        console.log("🤫 User stopped speaking");
        isSpeaking = false;
      }

      // === TRANSCRIPT CAPTURE: User (Candidate) ===
      if (data.type === "conversation.item.input_audio_transcription.completed") {
        const userTranscript = data.transcript;
        console.log("👤 User transcript:", userTranscript);

        // Send to frontend via LiveKit Data Channel
        sendTranscriptToRoom("user", userTranscript, true);
      }

      // === TRANSCRIPT CAPTURE: AI (Streaming) ===
      if (data.type === "response.audio_transcript.delta") {
        const aiTranscriptChunk = data.delta;
        currentAiTranscript += aiTranscriptChunk;
        console.log("🤖 AI transcript chunk:", aiTranscriptChunk);

        // Send streaming transcript to frontend (partial)
        sendTranscriptToRoom("ai", currentAiTranscript, false);
      }

      // === TRANSCRIPT CAPTURE: AI (Complete) ===
      if (data.type === "response.audio_transcript.done") {
        console.log("🤖 AI complete transcript:", data.transcript);

        // Send complete transcript to frontend
        sendTranscriptToRoom("ai", data.transcript, true);

        // Reset for next response
        currentAiTranscript = "";
      }

      if (data.type === "response.created") {
        isResponseComplete = false;
        currentAiTranscript = ""; // Reset transcript for new response
      }

      if (data.type === "response.audio.delta") {
        const pcm = Buffer.from(data.delta, "base64");
        audioBuffer = Buffer.concat([audioBuffer, pcm]);

        // Only start playing if we have enough data (Pre-buffering)
        if (!isPlaying && audioBuffer.length >= PRE_BUFFER_SIZE) {
          isPlaying = true;
          startPlaybackLoop();
        }
      }

      if (data.type === "response.done") {
        console.log("✓ AI response complete");
        isResponseComplete = true;
      }
    });

    ws.on("close", () => console.log("⚠️  Azure WebSocket closed"));
    ws.on("error", (err) => console.error("❌ Azure WebSocket error:", err));
  },
});

// Run the agent
if (!process.env.LIVEKIT_URL) throw new Error("Missing LIVEKIT_URL");
if (!process.env.LIVEKIT_API_KEY) throw new Error("Missing LIVEKIT_API_KEY");
if (!process.env.LIVEKIT_API_SECRET) throw new Error("Missing LIVEKIT_API_SECRET");

cli.runApp(
  new WorkerOptions({
    agent: fileURLToPath(import.meta.url),
    wsURL: process.env.LIVEKIT_URL,
    apiKey: process.env.LIVEKIT_API_KEY,
    apiSecret: process.env.LIVEKIT_API_SECRET,
  })
);
