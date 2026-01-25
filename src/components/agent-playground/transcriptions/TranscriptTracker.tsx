import { useRef, useEffect } from "react";
import { useTrackTranscription, useLocalParticipant, TrackReferenceOrPlaceholder, useRoomContext, useChat } from "@livekit/components-react";
import { Track, LocalParticipant, Participant, TranscriptionSegment } from "livekit-client";
import { useTranscriptContext } from "@/contexts/TranscriptContext";
import { interviewService } from "@/services/interview.service";

export function TranscriptTracker({
    sessionId,
    userId,
    agentAudioTrack,
    isEnding = false,
}: {
    sessionId: string;
    userId: string;
    agentAudioTrack?: TrackReferenceOrPlaceholder;
    isEnding?: boolean;
}) {
    const { addOrUpdateTranscript } = useTranscriptContext();
    // Keep track of processed FINAL segments to avoid double-saving to DB
    const processedSegments = useRef(new Set<string>());
    const lastChatLength = useRef(-1); // Initialize to -1 to detect first run

    // Chat Tracker (for typed messages)
    const { chatMessages } = useChat();

    // Agent Tracker
    const agentMessages = useTrackTranscription(agentAudioTrack || undefined);

    // Local Tracker
    const { localParticipant, microphoneTrack } = useLocalParticipant();
    const localMessages = useTrackTranscription({
        publication: microphoneTrack,
        source: Track.Source.Microphone,
        participant: localParticipant,
    });

    // Helper to process and save
    const processSegment = (s: TranscriptionSegment, participant: Participant | undefined) => {
        if (!participant) return;

        const isSelf = participant instanceof LocalParticipant;
        const name = isSelf ? "You" : "Agent";

        // Update UI Context (Always update context to show live transcription)
        addOrUpdateTranscript(s.id, {
            name,
            message: s.final ? s.text : `${s.text} ...`,
            isSelf,
            timestamp: s.firstReceivedTime || Date.now(),
        });

        // Save to DB (only final and new, and not if ending)
        if (s.final && !processedSegments.current.has(s.id) && !isEnding) {
            processedSegments.current.add(s.id);

            // Log debug
            console.log(`📝 Saving transcript: [${name}] ${s.text}`);

            // Fire and forget save
            interviewService.addTranscriptEntry(sessionId, userId, {
                role: isSelf ? 'user' : 'assistant',
                speaker: isSelf ? 'user' : 'ai', // Keep speaker for legacy if needed
                text: s.text,
                timestamp: s.firstReceivedTime || Date.now(),
            }).catch(err => console.error("Failed to save transcript:", err));
        }
    };

    // Agent Effect
    useEffect(() => {
        if (agentAudioTrack && agentAudioTrack.participant) {
            agentMessages.segments.forEach(s => processSegment(s, agentAudioTrack.participant));
        }
    }, [agentMessages.segments, agentAudioTrack]);

    // Local Effect
    useEffect(() => {
        localMessages.segments.forEach(s => processSegment(s, localParticipant));
    }, [localMessages.segments, localParticipant]);

    // Chat Persistance Effect
    useEffect(() => {
        if (isEnding) return;

        // Initialize length on first run to current length to only catch NEW messages
        if (lastChatLength.current === -1) {
            lastChatLength.current = chatMessages.length;
            return;
        }

        if (chatMessages.length > lastChatLength.current) {
            const newMessages = chatMessages.slice(lastChatLength.current);
            newMessages.forEach(msg => {
                const isSelf = msg.from?.identity === localParticipant.identity;

                // Determine if this is a message from the agent
                // Note: agent identity might not be localParticipant
                const role = isSelf ? 'user' : 'assistant';

                console.log(`📝 Saving chat message: [${role}] ${msg.message}`);

                interviewService.addTranscriptEntry(sessionId, userId, {
                    role,
                    speaker: isSelf ? 'user' : 'ai',
                    text: msg.message,
                    timestamp: msg.timestamp || Date.now(),
                }).catch(err => console.error("Failed to save chat transcript:", err));
            });
            lastChatLength.current = chatMessages.length;
        }
    }, [chatMessages, localParticipant, sessionId, userId]);

    // ------------------------------------------------------------------------
    // FALLBACK: Listen for explicit "transcription" data messages from Server
    // (In case standard SFU transcription events are not firing for local user)
    // ------------------------------------------------------------------------
    const room = useRoomContext();

    useEffect(() => {
        if (!room) return;

        const handleDataReceived = (payload: Uint8Array, participant: any, kind: any, topic?: string) => {
            // Check for transcription topic
            if (topic === "transcription" || topic === "user_transcription") {
                try {
                    const decoder = new TextDecoder();
                    const msg = decoder.decode(payload);
                    const data = JSON.parse(msg);

                    console.log("📨 [Tracker] Received transcript data:", data);

                    // Expecting format: { type: 'transcription', text: '...', isFinal: true, role: 'user' }
                    if ((data.type === 'transcription' || data.role === 'user') && data.text) {

                        // Create a synthetic segment to reuse processing logic
                        const isSelf = data.role === 'user' || participant === localParticipant;

                        // Uniquely identify this segment
                        const segmentId = data.id || `data-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                        // Only process final segments from data channel to avoid jitter
                        if (data.isFinal !== false) {
                            const syntheticSegment: TranscriptionSegment = {
                                id: segmentId,
                                text: data.text,
                                final: true,
                                firstReceivedTime: Date.now(),
                                lastReceivedTime: Date.now(),
                                startTime: Date.now(),
                                endTime: Date.now(),
                                language: "en",
                            };

                            // Determine participant for logic (if user role, use localParticipant)
                            const targetParticipant = isSelf ? localParticipant : participant;

                            console.log(`🎤 [Tracker] Processing DATA transcript for ${isSelf ? 'User' : 'Agent'}:`, data.text);
                            processSegment(syntheticSegment, targetParticipant);
                        }
                    }
                } catch (err) {
                    console.error("❌ [Tracker] Failed to parse transcription data:", err);
                }
            }
        };

        room.on('dataReceived', handleDataReceived);
        return () => {
            room.off('dataReceived', handleDataReceived);
        };
    }, [room, localParticipant]);

    return null; // Invisible component
}
