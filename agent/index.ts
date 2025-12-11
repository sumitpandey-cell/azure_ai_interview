import "dotenv/config";
import { defineAgent, cli, WorkerOptions } from "@livekit/agents";
import { AudioSource, AudioFrame, LocalAudioTrack, TrackKind, TrackSource, TrackPublishOptions, RoomEvent, AudioStream } from "@livekit/rtc-node";
import WebSocket from "ws";
import { fileURLToPath } from "url";
import { loadSystemPrompt } from "./prompt-loader.js";
import type { SessionContext } from "./prompt-loader.js";

// Error handling utility
class AgentError extends Error {
  constructor(message: string, public readonly code: string, public readonly recoverable: boolean = false) {
    super(message);
    this.name = "AgentError";
  }
}

export default defineAgent({
  entry: async (ctx) => {
    let ws: WebSocket | null = null;
    let audioStreamReader: ReadableStreamDefaultReader<AudioFrame> | null = null;
    let playbackInterval: NodeJS.Timeout | null = null;
    let isShuttingDown = false;

    // Cleanup function
    const cleanup = async () => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      
      try {
        if (playbackInterval) {
          clearInterval(playbackInterval);
          playbackInterval = null;
        }

        if (audioStreamReader) {
          await audioStreamReader.cancel();
          audioStreamReader = null;
        }

        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close();
          ws = null;
        }
      } catch (error) {
        console.error("⚠️ Error during cleanup:", error);
      }

      console.log("✓ Cleanup complete");
    };

    // Handle process termination
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);

    try {
      // Connect to LiveKit room
      try {
        await ctx.connect();
      } catch (error) {
        throw new AgentError(
          `Failed to connect to LiveKit: ${error instanceof Error ? error.message : String(error)}`,
          "LIVEKIT_CONNECTION_ERROR",
          false
        );
      }

      // Wait for participant
      let participant;
      let selectedVoice = 'alloy'; // Default voice
      let sessionContext: SessionContext | undefined;

      try {
        participant = await ctx.waitForParticipant();

        // Extract voice preference and session context from participant metadata
        try {
          const metadata = participant.metadata;
          if (metadata) {
            const parsedMetadata = JSON.parse(metadata);
            console.log(`Participant metadata: ${JSON.stringify(parsedMetadata)}`);

            if (parsedMetadata.selectedVoice) {
              console.log(`Selected voice: ${parsedMetadata.selectedVoice}`);
              selectedVoice = parsedMetadata.selectedVoice;
            }

            // Extract session context for dynamic prompt customization
            if (parsedMetadata.sessionContext) {
              sessionContext = parsedMetadata.sessionContext;
            } else if (parsedMetadata.position || parsedMetadata.interviewType) {
              // Fallback: construct session context from available metadata
              sessionContext = {
                position: parsedMetadata.position,
                interviewType: parsedMetadata.interviewType,
                companyName: parsedMetadata.companyName,
                skills: parsedMetadata.skills,
                difficulty: parsedMetadata.difficulty,
                experienceLevel: parsedMetadata.experienceLevel,
                duration: parsedMetadata.duration
              };
            }
          }
        } catch (metadataError) {
          console.warn("⚠️ Could not parse participant metadata, using defaults:", metadataError);
        }
      } catch (error) {
        throw new AgentError(
          `Failed to wait for participant: ${error instanceof Error ? error.message : String(error)}`,
          "PARTICIPANT_WAIT_ERROR",
          false
        );
      }

      // Create Audio Source for sending Azure audio → LiveKit
      let azureAudioSource: AudioSource;
      try {
        azureAudioSource = new AudioSource(24000, 1);
      } catch (error) {
        throw new AgentError(
          `Failed to create audio source: ${error instanceof Error ? error.message : String(error)}`,
          "AUDIO_SOURCE_ERROR",
          false
        );
      }

      // Ensure local participant is available
      if (!ctx.room.localParticipant) {
        throw new AgentError("Local participant not available", "LOCAL_PARTICIPANT_ERROR", false);
      }

      // Publish the AI audio to the room with SOURCE_UNKNOWN (not microphone)
      try {
        const aiTrack = await ctx.room.localParticipant.publishTrack(
          LocalAudioTrack.createAudioTrack("ai-audio", azureAudioSource),
          new TrackPublishOptions({ source: TrackSource.SOURCE_UNKNOWN })
        );
      } catch (error) {
        throw new AgentError(
          `Failed to publish audio track: ${error instanceof Error ? error.message : String(error)}`,
          "TRACK_PUBLISH_ERROR",
          false
        );
      }

      // Validate Azure environment variables
      if (!process.env.AZURE_ENDPOINT) {
        throw new AgentError("AZURE_ENDPOINT not configured", "CONFIG_ERROR", false);
      }
      if (!process.env.AZURE_OPENAI_DEPLOYMENT) {
        throw new AgentError("AZURE_OPENAI_DEPLOYMENT not configured", "CONFIG_ERROR", false);
      }
      if (!process.env.AZURE_API_KEY) {
        throw new AgentError("AZURE_API_KEY not configured", "CONFIG_ERROR", false);
      }

      // Connect to Azure Realtime API
      const azureUrl = `${process.env.AZURE_ENDPOINT}/openai/realtime?api-version=2024-10-01-preview&deployment=${process.env.AZURE_OPENAI_DEPLOYMENT}`;

      let wsConnectionTimeout: NodeJS.Timeout | null = null;
      let isAzureReady = false;

      try {
        ws = new WebSocket(azureUrl, {
          headers: {
            "api-key": process.env.AZURE_API_KEY,
          },
          handshakeTimeout: 10000, // 10 second timeout
        });

        // Connection timeout
        wsConnectionTimeout = setTimeout(() => {
          if (!isAzureReady && ws) {
            console.error("❌ Azure connection timeout");
            ws.close();
          }
        }, 15000);

      } catch (error) {
        throw new AgentError(
          `Failed to create WebSocket connection: ${error instanceof Error ? error.message : String(error)}`,
          "WEBSOCKET_CREATE_ERROR",
          true
        );
      }

      ws.on("open", () => {

        try {
          // Load system prompt with session context
          const systemPrompt = loadSystemPrompt(sessionContext);

          if (sessionContext) {
          }

          // Configure the session with optimized settings for audio clarity
          ws!.send(
            JSON.stringify({
              type: "session.update",
              session: {
                modalities: ["text", "audio"], // Explicitly request audio output
                turn_detection: {
                  type: "server_vad",
                  threshold: 0.8, // Increased threshold to reduce background noise sensitivity
                  prefix_padding_ms: 300, // Reduced padding to minimize potential echo capture
                  silence_duration_ms: 1500 // Increased to allow natural pauses without interruption
                },
                input_audio_format: "pcm16",
                output_audio_format: "pcm16",
                input_audio_transcription: {
                  model: "whisper-1"
                },
                instructions: systemPrompt,
                voice: selectedVoice, // Use the voice selected by the user
                temperature: 0.6, // Minimum allowed temperature for this model is 0.6
                max_response_output_tokens: 4096 // Ensure complete responses
              },
            })
          );
        } catch (error) {
          console.error("❌ Failed to send session configuration:", error);
        }
      });

      // USER → AZURE: Stream user's mic audio to Azure (ONLY from remote participants)
      ctx.room.on(RoomEvent.TrackSubscribed, async (track, publication, participant) => {
        try {
          if (track.kind === TrackKind.KIND_AUDIO) {
            // CRITICAL: Only process audio from remote participants (users) AND specifically from their microphone
            // This prevents the agent from listening to its own output or other system audio
            if (participant.identity !== ctx.room.localParticipant?.identity && publication.source === TrackSource.SOURCE_MICROPHONE) {

              try {
                // Create an AudioStream from the track
                const audioStream = new AudioStream(track, { sampleRate: 24000, numChannels: 1 });
                audioStreamReader = audioStream.getReader();

                // Read audio frames and send to Azure
                (async () => {
                  try {
                    while (true && !isShuttingDown) {
                      const { done, value } = await audioStreamReader!.read();
                      if (done) {
                        break;
                      }

                      // Only send if Azure WebSocket is ready and open
                      if (!isAzureReady || !ws || ws.readyState !== WebSocket.OPEN) {
                        continue;
                      }

                      try {
                        // Convert Int16Array to base64 for Azure
                        const buffer = Buffer.from(value.data.buffer);
                        const base64Audio = buffer.toString("base64");

                        ws.send(
                          JSON.stringify({
                            type: "input_audio_buffer.append",
                            audio: base64Audio,
                          })
                        );
                      } catch (sendError) {
                        console.error("❌ Error sending audio to Azure:", sendError);
                        // Don't break the loop, just skip this frame
                      }
                    }
                  } catch (error) {
                    if (!isShuttingDown) {
                      console.error("❌ Error reading audio stream:", error);
                    }
                  }
                })();
              } catch (error) {
                console.error("❌ Error creating audio stream:", error);
              }
            } else {
              console.log("⛔ Ignoring agent's own audio track (preventing loop)");
            }
          }
        } catch (error) {
          console.error("❌ Error in TrackSubscribed handler:", error);
        }
      });

      // Audio Streaming Configuration - Optimized for clarity and smooth playback
      const INTERVAL_MS = 50; // Increased to 50ms frames for smoother, less choppy playback
      const SAMPLE_RATE = 24000; // 24kHz sample rate
      const CHANNELS = 1; // Mono audio
      const BYTES_PER_SAMPLE = 2; // 16-bit PCM
      const SAMPLES_PER_FRAME = Math.floor((SAMPLE_RATE * INTERVAL_MS) / 1000);
      const BYTES_PER_FRAME = SAMPLES_PER_FRAME * BYTES_PER_SAMPLE * CHANNELS;

      // Increased pre-buffer for smoother playback without bursts
      const PRE_BUFFER_MS = 200; // Increased from 100ms to 200ms
      const PRE_BUFFER_SIZE = Math.floor((PRE_BUFFER_MS / INTERVAL_MS)) * BYTES_PER_FRAME;

      let audioBuffer: Buffer = Buffer.alloc(0);
      let isPlaying = false;
      let isResponseComplete = false;
      let underrunCount = 0; // Track buffer underruns
      let playbackInterval: NodeJS.Timeout | null = null;

      // Transcript accumulation
      let currentAiTranscript = "";
      let lastUserSpeechStart = Date.now();

      // Helper function to send transcripts to frontend via LiveKit Data Channel
      const sendTranscriptToRoom = (speaker: "user" | "ai", transcript: string, isComplete: boolean = true, timestamp?: number) => {
        try {
          const transcriptData = JSON.stringify({
            type: "transcript",
            speaker,
            transcript,
            isComplete,
            timestamp: timestamp || Date.now()
          });

          ctx.room.localParticipant?.publishData(
            new TextEncoder().encode(transcriptData),
            { reliable: true }
          );
        } catch (error) {
          console.error("❌ Error sending transcript to room:", error);
        }
      };

      const startPlaybackLoop = () => {
        if (playbackInterval || isShuttingDown) return;

        console.log("▶️ Starting playback loop (optimized for clarity)");
        underrunCount = 0;

        playbackInterval = setInterval(() => {
          try {
            if (isShuttingDown) {
              if (playbackInterval) clearInterval(playbackInterval);
              return;
            }

            // Only play if we have a complete frame
            if (audioBuffer.length >= BYTES_PER_FRAME) {
              const chunk = audioBuffer.subarray(0, BYTES_PER_FRAME);
              audioBuffer = audioBuffer.subarray(BYTES_PER_FRAME);
              sendFrame(chunk);
              underrunCount = 0; // Reset underrun counter
            }
            // If buffer is empty but AI is still generating
            else if (!isResponseComplete) {
              underrunCount++;

              // Only log occasional underruns to avoid spam
              if (underrunCount === 1 || underrunCount % 25 === 0) {
                console.log(`⚠️ Buffer underrun (waiting for more audio data) - count: ${underrunCount}`);
              }

              // Don't send silence - just skip this frame and wait for more data
              // This prevents the "unclear" audio quality issue
            }
            // If buffer is empty and AI is done, stop loop
            else {
              console.log("⏹️ Playback finished");
              if (playbackInterval) clearInterval(playbackInterval);
              playbackInterval = null;
              isPlaying = false;
              audioBuffer = Buffer.alloc(0);
              underrunCount = 0;
            }
          } catch (error) {
            console.error("❌ Error in playback loop:", error);
          }
        }, INTERVAL_MS);
      };

      const sendFrame = (chunk: Buffer) => {
        try {
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
        } catch (error) {
          console.error("❌ Error sending audio frame:", error);
        }
      };

      // AZURE → USER: Stream Azure audio deltas into LiveKit
      ws.on("message", (msg) => {
        try {
          const data = JSON.parse(msg.toString());

          // Log important Azure messages
          if (data.type !== "input_audio_buffer.speech_started" &&
            data.type !== "input_audio_buffer.committed" &&
            data.type !== "conversation.item.input_audio_transcription.completed" &&
            data.type !== "response.audio.delta") {
          }

          if (data.type === "session.updated") {
            isAzureReady = true;
            if (wsConnectionTimeout) {
              clearTimeout(wsConnectionTimeout);
              wsConnectionTimeout = null;
            }

            // Trigger AI to speak first
            setTimeout(() => {
              try {
                if (ws && ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ type: "response.create" }));
                }
              } catch (error) {
                console.error("❌ Error triggering AI response:", error);
              }
            }, 100);
          }

          if (data.type === "input_audio_buffer.speech_started") {
            lastUserSpeechStart = Date.now();
          }

          if (data.type === "input_audio_buffer.speech_stopped") {
          }

          if (data.type === "conversation.item.input_audio_transcription.completed") {
            const userTranscript = data.transcript;
            // Use the timestamp from when speech started to ensure correct ordering
            sendTranscriptToRoom("user", userTranscript, true, lastUserSpeechStart);
          }

          if (data.type === "response.audio_transcript.delta") {
            const aiTranscriptChunk = data.delta;
            currentAiTranscript += aiTranscriptChunk;
            sendTranscriptToRoom("ai", currentAiTranscript, false);
          }

          if (data.type === "response.audio_transcript.done") {
            sendTranscriptToRoom("ai", data.transcript, true);
            currentAiTranscript = "";
          }

          if (data.type === "response.created") {
            isResponseComplete = false;
            currentAiTranscript = "";
          }

          if (data.type === "response.audio.delta") {
            const pcm = Buffer.from(data.delta, "base64");
            audioBuffer = Buffer.concat([audioBuffer, pcm]);

            if (!isPlaying && audioBuffer.length >= PRE_BUFFER_SIZE) {
              isPlaying = true;
              startPlaybackLoop();
            }
          }

          if (data.type === "response.done") {
            isResponseComplete = true;
          }

          // Handle errors from Azure
          if (data.type === "error") {
            console.error("❌ Azure error:", data.error);
            sendTranscriptToRoom("ai", `Error: ${data.error.message || "Unknown error"}`, true);
          }

        } catch (error) {
          console.error("❌ Error processing Azure message:", error);
        }
      });

      ws.on("close", (code, reason) => {
        isAzureReady = false;
      });

      ws.on("error", (err) => {
        console.error("❌ Azure WebSocket error:", err.message);
        if (!isAzureReady) {
          console.error("   Failed to establish connection to Azure");
        }
      });

      // Handle room disconnection
      ctx.room.on(RoomEvent.Disconnected, () => {
        console.log("⚠️ Room disconnected");
        cleanup();
      });

    } catch (error) {
      if (error instanceof AgentError) {
        console.error(`❌ Agent Error [${error.code}]:`, error.message);
        if (!error.recoverable) {
          console.error("   This error is not recoverable. Agent will exit.");
        }
      } else {
        console.error("❌ Unexpected error:", error);
      }

      await cleanup();
      throw error;
    }
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
