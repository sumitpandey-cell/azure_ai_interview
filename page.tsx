"use client";

import { Room, RoomEvent, Track } from "livekit-client";
import { useEffect, useState, useRef } from "react";

export default function Page() {
  const [status, setStatus] = useState("Connecting...");
  const [error, setError] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<Array<{
    speaker: "user" | "ai";
    text: string;
    timestamp: number;
    isComplete: boolean;
  }>>([]);

  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let room: Room | null = null;

    const start = async () => {
      try {
        setStatus("Fetching token...");
        const r = await fetch("/api/livekit_token");

        if (!r.ok) {
          throw new Error(`Failed to fetch token: ${r.statusText}`);
        }

        const { url, token } = await r.json();

        setStatus("Connecting to LiveKit...");
        room = new Room();
        await room.connect(url, token);

        setStatus("Connected! Starting microphone...");

        // MIC → LiveKit
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        await room.localParticipant.publishTrack(stream.getAudioTracks()[0]);

        setStatus("Interview active - AI is listening");

        // PLAY AI AUDIO
        room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          if (track.kind === Track.Kind.Audio) {
            console.log("AI audio track received");
            const audioElement = track.attach();
            audioElement.autoplay = true;
            audioElement.play().catch(e => console.error("Error playing audio:", e));
            setStatus("AI is speaking...");
          }
        });

        // RECEIVE TRANSCRIPTS via Data Channel
        room.on(RoomEvent.DataReceived, (payload, participant) => {
          try {
            const decoder = new TextDecoder();
            const message = JSON.parse(decoder.decode(payload));

            if (message.type === "transcript") {
              const { speaker, transcript, isComplete, timestamp } = message;

              setTranscripts((prev) => {
                // If it's a partial AI transcript, update the last AI entry
                if (speaker === "ai" && !isComplete) {
                  const lastIndex = prev.length - 1;
                  if (lastIndex >= 0 && prev[lastIndex].speaker === "ai" && !prev[lastIndex].isComplete) {
                    // Update existing partial transcript
                    const updated = [...prev];
                    updated[lastIndex] = { speaker, text: transcript, timestamp, isComplete };
                    return updated;
                  }
                }

                // Otherwise, add new transcript entry
                return [...prev, { speaker, text: transcript, timestamp, isComplete }];
              });

              console.log(`📝 ${speaker === "user" ? "User" : "AI"} transcript:`, transcript);
            }
          } catch (err) {
            console.error("Error parsing data message:", err);
          }
        });

        room.on(RoomEvent.Disconnected, () => {
          setStatus("Disconnected");
        });

      } catch (err) {
        console.error("Error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setStatus("Error");
      }
    };

    start();

    // Cleanup on unmount
    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, []);

  // Auto-scroll to latest transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts]);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      <h1>AI Interview</h1>
      <p>
        <strong>Status:</strong> {status}
      </p>
      {error && (
        <p style={{ color: "red" }}>
          <strong>Error:</strong> {error}
        </p>
      )}
      {status === "Interview active - AI is listening" && (
        <p style={{ color: "green" }}>✓ Connected! Speak naturally with the AI interviewer.</p>
      )}

      {/* Transcript Display */}
      {transcripts.length > 0 && (
        <div style={{
          marginTop: "30px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "20px",
          backgroundColor: "#f9f9f9",
          maxHeight: "500px",
          overflowY: "auto"
        }}>
          <h2 style={{ marginTop: 0 }}>Interview Transcript</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {transcripts.map((t, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: t.speaker === "user" ? "flex-end" : "flex-start"
                }}
              >
                <div
                  style={{
                    maxWidth: "70%",
                    padding: "10px 15px",
                    borderRadius: "12px",
                    backgroundColor: t.speaker === "user" ? "#007bff" : "#e9ecef",
                    color: t.speaker === "user" ? "white" : "black",
                    opacity: t.isComplete ? 1 : 0.7,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
                  }}
                >
                  <div style={{ fontSize: "11px", marginBottom: "4px", opacity: 0.8 }}>
                    {t.speaker === "user" ? "👤 You" : "🤖 AI Interviewer"}
                  </div>
                  <div>{t.text}</div>
                  {!t.isComplete && (
                    <div style={{ fontSize: "10px", marginTop: "4px", fontStyle: "italic" }}>
                      typing...
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
