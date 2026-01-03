import { useEffect, useRef } from "react";
import { useTrackTranscription, useLocalParticipant, TrackReferenceOrPlaceholder } from "@livekit/components-react";
import { Track, LocalParticipant, Participant, TranscriptionSegment } from "livekit-client";
import { useTranscriptContext } from "@/contexts/TranscriptContext";
import { interviewService } from "@/services/interview.service";

export function TranscriptTracker({
    sessionId,
    agentAudioTrack,
    sentimentData
}: {
    sessionId: string;
    agentAudioTrack?: TrackReferenceOrPlaceholder;
    sentimentData?: {
        sentiment: string;
        confidence: number;
        scores: { positive: number; neutral: number; negative: number };
    } | null;
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
            ...(isSelf && sentimentData ? {
                sentiment: sentimentData.sentiment,
                confidence: sentimentData.confidence
            } : {})
        });

        // Save to DB (only final and new)
        if (s.final && !processedSegments.current.has(s.id)) {
            processedSegments.current.add(s.id);

            // Log debug
            console.log(`📝 Saving transcript: [${name}] ${s.text}`);

            // Fire and forget save
            interviewService.addTranscriptEntry(sessionId, {
                speaker: isSelf ? 'user' : 'ai',
                text: s.text,
                timestamp: s.firstReceivedTime || Date.now(),
                ...(isSelf && sentimentData ? {
                    sentiment: sentimentData.sentiment,
                    confidence: sentimentData.confidence
                } : {})
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

    return null; // Invisible component
}
