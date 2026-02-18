import { useRef, useEffect, useCallback } from "react";
import { useTrackTranscription, useLocalParticipant, TrackReferenceOrPlaceholder, useRoomContext } from "@livekit/components-react";
import { Track, LocalParticipant, Participant, TranscriptionSegment } from "livekit-client";
import { useTranscriptContext } from "@/contexts/TranscriptContext";
import { interviewService } from "@/services/interview.service";
import { useInterviewStore } from "@/stores/interviewStore";
import { supabase, publicSupabase } from "@/integrations/supabase/client";

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
    const { updateLastTranscript } = useInterviewStore();

    // Determine the correct client once
    const client = userId ? supabase : publicSupabase;

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
    // Track last saved text to prevent massive DB ghosting
    const lastSavedEntry = useRef<string>("");
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

        // Skip if this segment text hasn't changed (optimization)
        if (turn.segments[s.id] === s.text && s.final === (processedSegments.current.has(s.id))) {
            return;
        }

        turn.segments[s.id] = s.text;
        turn.lastUpdate = now;

        // 3. Construct the full display text for this specific turn
        const fullText = Object.values(turn.segments)
            .filter(t => t.trim().length > 0)
            .join(" ")
            .trim();

        if (fullText) {
            // Update UI/Context
            addOrUpdateTranscript(turn.id, {
                name,
                message: s.final ? fullText : `${fullText} ...`,
                isSelf,
                timestamp: s.firstReceivedTime || now,
            });

            // Update Global Store
            updateLastTranscript({
                speaker: isSelf ? 'user' : 'ai',
                text: fullText,
                timestamp: s.firstReceivedTime || now,
                isComplete: s.final
            });
        }

        // 4. Save to DB (only final and new content)
        if (s.final && !isEnding && !processedSegments.current.has(s.id)) {
            // Double check text content hasn't been saved recently to prevent echo loops
            const textKey = `${isSelf ? 'u' : 'a'}:${s.text.substring(0, 50)}`;
            if (lastSavedEntry.current === textKey) return;

            processedSegments.current.add(s.id);
            lastSavedEntry.current = textKey;

            console.log(`📝 [Tracker] Local segment finalized: "${s.text.substring(0, 30)}..."`);

            interviewService.addTranscriptEntry(sessionId, userId, {
                role: isSelf ? 'user' : 'assistant',
                speaker: isSelf ? 'user' : 'ai',
                text: s.text,
                timestamp: now,
            }, client).catch(err => console.error("Failed to save transcript:", err));
        }
    }, [addOrUpdateTranscript, updateLastTranscript, isEnding, sessionId, userId, client]);

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
                        // UNIQUE ID FIX: Use data.id or a content-based hash to prevent ghosting
                        const textHash = btoa(data.text.substring(0, 100)).substring(0, 16);
                        const targetId = data.id || `data-${data.role}-${textHash}`;

                        // Prevent processing the exact same data message twice
                        if (processedSegments.current.has(targetId)) return;

                        // Update Context
                        addOrUpdateTranscript(targetId, {
                            name: data.name || (isSelf ? "You" : "Agent"),
                            message: data.isFinal ? data.text : data.text + " ...",
                            isSelf: typeof data.isSelf === 'boolean' ? data.isSelf : isSelf,
                            timestamp: Date.now(),
                        });

                        // Update Global Store
                        updateLastTranscript({
                            speaker: isSelf ? 'user' : 'ai',
                            text: data.text,
                            timestamp: Date.now(),
                            isComplete: data.isFinal || false
                        });

                        // Real-time DB backup (only for finals)
                        if (data.isFinal && !isEnding) {
                            processedSegments.current.add(targetId);

                            // Check persistent save cache
                            const textKey = `${isSelf ? 'u' : 'a'}:${data.text.substring(0, 50)}`;
                            if (lastSavedEntry.current === textKey) return;
                            lastSavedEntry.current = textKey;

                            interviewService.addTranscriptEntry(sessionId, userId, {
                                role: isSelf ? 'user' : 'assistant',
                                speaker: isSelf ? 'user' : 'ai',
                                text: data.text,
                                timestamp: Date.now(),
                            }, client).catch(err => console.error("Failed to save stitched transcript:", err));
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
    }, [room, sessionId, userId, isEnding, addOrUpdateTranscript, updateLastTranscript, client]);

    return null; // Invisible component
}
