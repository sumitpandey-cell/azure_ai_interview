import { TranscriptList } from "./TranscriptList";
import {
    TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import { useMemo } from "react";
import { useTranscriptContext } from "@/contexts/TranscriptContext";

export function TranscriptionTile({
    accentColor,
}: {
    agentAudioTrack?: TrackReferenceOrPlaceholder;
    accentColor: string;
}) {
    // Transcript tracking is now handled by TranscriptTracker component
    // This component only displays the transcripts from context + chat messages

    const { transcripts } = useTranscriptContext();


    // Derive messages from transcripts using useMemo
    const messages = useMemo(() => {
        const allMessages = Array.from(transcripts.values());
        return allMessages.sort((a, b) => a.timestamp - b.timestamp);
    }, [
        transcripts,
    ]);


    return (
        <TranscriptList messages={messages} accentColor={accentColor} />
    );
}

