import { useRef, useEffect, useCallback } from "react";
import { useTrackTranscription, useLocalParticipant, TrackReferenceOrPlaceholder, useRoomContext } from "@livekit/components-react";
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
    userId: string | null;
    agentAudioTrack?: TrackReferenceOrPlaceholder;
    isEnding?: boolean;
}) {
    const { addOrUpdateTranscript } = useTranscriptContext();
    // Keep track of processed FINAL segments to avoid double-saving to DB
    const processedSegments = useRef(new Set<string>());
    // Agent Tracker
    const agentMessages = useTrackTranscription(agentAudioTrack || undefined);

    // Local Tracker
    const { localParticipant, microphoneTrack } = useLocalParticipant();
    const localMessages = useTrackTranscription({
        publication: microphoneTrack,
        source: Track.Source.Microphone,
        participant: localParticipant,
    });

    // --- Stitching Logic State ---
    const turnsRef = useRef<Record<string, {
        id: string,
        lastUpdate: number,
        segments: Record<string, string>
    }>>({});

    // Map to track which turn a segment belongs to
    const segmentToTurnId = useRef<Map<string, string>>(new Map());
    // Tracks the current active turn ID for each participant
    const currentTurnForParticipant = useRef<Record<string, string>>({});
    const lastSpeakerRef = useRef<string | null>(null);
    // --- End Stitching Logic State ---

    // Helper to process and save
    const processSegment = useCallback((s: TranscriptionSegment, participant: Participant | undefined) => {
        if (!participant) return;

        const isSelf = participant instanceof LocalParticipant;
        const name = isSelf ? "You" : "Agent";
        const participantId = participant.identity;

        const now = Date.now();

        // 1. Determine which turn this segment belongs to
        let turnId = segmentToTurnId.current.get(s.id);
        const speakerChanged = lastSpeakerRef.current !== participantId;

        if (!turnId) {
            // New segment! Decide which turn it joins.
            const activeTurnId = currentTurnForParticipant.current[participantId];
            const activeTurn = activeTurnId ? turnsRef.current[activeTurnId] : null;

            // If speaker changed or timeout, start a new turn
            if (!activeTurn || speakerChanged || (now - activeTurn.lastUpdate > 3000)) {
                turnId = `turn-${participantId}-${now}`;
                turnsRef.current[turnId] = {
                    id: turnId,
                    lastUpdate: now,
                    segments: {}
                };
                currentTurnForParticipant.current[participantId] = turnId;
                lastSpeakerRef.current = participantId;
            } else {
                turnId = activeTurnId;
            }
            // Lock this segment to this turn forever
            segmentToTurnId.current.set(s.id, turnId);
        }

        // 2. Update the turn data
        const turn = turnsRef.current[turnId];
        if (!turn) return;

        turn.segments[s.id] = s.text;
        turn.lastUpdate = now;

        // 3. Construct the full display text for this specific turn
        const fullText = Object.values(turn.segments)
            .filter(t => t.trim().length > 0)
            .join(" ")
            .trim();

        if (fullText) {
            addOrUpdateTranscript(turn.id, {
                name,
                message: s.final ? fullText : `${fullText} ...`,
                isSelf,
                timestamp: s.firstReceivedTime || now,
            });
        }

        // 4. Save to DB (only final and new, and not if ending)
        if (s.final && !isEnding && !processedSegments.current.has(s.id)) {
            processedSegments.current.add(s.id);

            console.log(`📝 [Tracker] Local segment finalized: "${s.text.substring(0, 30)}..."`);

            interviewService.addTranscriptEntry(sessionId, userId, {
                role: isSelf ? 'user' : 'assistant',
                speaker: isSelf ? 'user' : 'ai',
                text: s.text,
                timestamp: now,
            }).catch(err => console.error("Failed to save transcript:", err));
        }
    }, [addOrUpdateTranscript, isEnding, sessionId, userId]);

    // Agent Effect
    useEffect(() => {
        if (agentAudioTrack && agentAudioTrack.participant) {
            agentMessages.segments.forEach(s => processSegment(s, agentAudioTrack.participant));
        }
    }, [agentMessages.segments, agentAudioTrack, processSegment]);

    // Local Effect
    useEffect(() => {
        localMessages.segments.forEach(s => processSegment(s, localParticipant));
    }, [localMessages.segments, localParticipant, processSegment]);

    // ------------------------------------------------------------------------
    // FALLBACK: Listen for explicit "transcription" data messages from Server
    // This is the "Gold Standard" as the server now stitches fragmented speech.
    // ------------------------------------------------------------------------
    const room = useRoomContext();

    useEffect(() => {
        if (!room) return;

        const handleDataReceived = (payload: Uint8Array, participant: Participant | undefined, _kind: unknown, topic?: string) => {
            if (topic === "transcription" || topic === "user_transcription") {
                try {
                    const decoder = new TextDecoder();
                    const msg = decoder.decode(payload);
                    const data = JSON.parse(msg);

                    if (data.text) {
                        const isSelf = data.role === 'user';

                        // Use the ID provided by the server
                        const targetId = data.id || `data-${Date.now()}`;

                        // Prevent the server from overwriting a more complete local buffer
                        // unless it's a FINAL message (which we always trust)
                        if (data.isFinal) {
                            addOrUpdateTranscript(targetId, {
                                name: data.name || (isSelf ? "You" : "Agent"),
                                message: data.text,
                                isSelf: typeof data.isSelf === 'boolean' ? data.isSelf : isSelf,
                                timestamp: Date.now(),
                            });
                        } else {
                            // For interims, only update if the text is longer (to avoid flickering back to old versions)
                            // or if we don't have this ID yet.
                            addOrUpdateTranscript(targetId, {
                                name: data.name || (isSelf ? "You" : "Agent"),
                                message: data.text + " ...",
                                isSelf: typeof data.isSelf === 'boolean' ? data.isSelf : isSelf,
                                timestamp: Date.now(),
                            });
                            // If it's final, we also want to mark it as processed if it's new
                            if (data.isFinal && !isEnding && !processedSegments.current.has(targetId)) {
                                processedSegments.current.add(targetId);

                                // Save to DB
                                interviewService.addTranscriptEntry(sessionId, userId, {
                                    role: isSelf ? 'user' : 'assistant',
                                    speaker: isSelf ? 'user' : 'ai',
                                    text: data.text,
                                    timestamp: Date.now(),
                                }).catch(err => console.error("Failed to save stitched transcript:", err));
                            }
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
    }, [room, sessionId, userId, isEnding, addOrUpdateTranscript]);

    return null; // Invisible component
}
