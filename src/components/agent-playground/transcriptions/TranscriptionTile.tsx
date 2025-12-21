import { ChatMessageType, ChatTile } from "../chat/ChatTile";
import {
    TrackReferenceOrPlaceholder,
    useChat,
    useLocalParticipant,
    useTrackTranscription,
} from "@livekit/components-react";
import {
    LocalParticipant,
    Participant,
    Track,
    TranscriptionSegment,
} from "livekit-client";
import { useEffect, useState } from "react";
import { useTranscriptContext } from "@/contexts/TranscriptContext";

export function TranscriptionTile({
    agentAudioTrack,
    accentColor,
}: {
    agentAudioTrack?: TrackReferenceOrPlaceholder;
    accentColor: string;
}) {
    const agentMessages = useTrackTranscription(agentAudioTrack || undefined);
    const localParticipant = useLocalParticipant();
    const localMessages = useTrackTranscription({
        publication: localParticipant.microphoneTrack,
        source: Track.Source.Microphone,
        participant: localParticipant.localParticipant,
    });

    // Use session-level transcript context instead of local state
    const { transcripts, addOrUpdateTranscript } = useTranscriptContext();
    const [messages, setMessages] = useState<ChatMessageType[]>([]);
    const { chatMessages, send: sendChat } = useChat();

    // store transcripts in session-level context
    useEffect(() => {
        if (agentAudioTrack) {
            agentMessages.segments.forEach((s) =>
                addOrUpdateTranscript(
                    s.id,
                    segmentToChatMessage(
                        s,
                        transcripts.get(s.id),
                        agentAudioTrack.participant,
                    ),
                ),
            );
        }

        localMessages.segments.forEach((s) =>
            addOrUpdateTranscript(
                s.id,
                segmentToChatMessage(
                    s,
                    transcripts.get(s.id),
                    localParticipant.localParticipant,
                ),
            ),
        );

        const allMessages = Array.from(transcripts.values());
        for (const msg of chatMessages) {
            const isAgent = agentAudioTrack
                ? msg.from?.identity === agentAudioTrack.participant?.identity
                : msg.from?.identity !== localParticipant.localParticipant.identity;
            const isSelf =
                msg.from?.identity === localParticipant.localParticipant.identity;
            let name = msg.from?.name;
            if (!name) {
                if (isAgent) {
                    name = "Agent";
                } else if (isSelf) {
                    name = "You";
                } else {
                    name = "Unknown";
                }
            }
            allMessages.push({
                name,
                message: msg.message,
                timestamp: msg.timestamp,
                isSelf: isSelf,
            });
        }
        allMessages.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(allMessages);
    }, [
        transcripts,
        addOrUpdateTranscript,
        chatMessages,
        localParticipant.localParticipant,
        agentAudioTrack?.participant,
        agentMessages.segments,
        localMessages.segments,
        agentAudioTrack,
    ]);


    return (
        <ChatTile messages={messages} accentColor={accentColor} onSend={sendChat} />
    );
}

function segmentToChatMessage(
    s: TranscriptionSegment,
    existingMessage: ChatMessageType | undefined,
    participant: Participant,
): ChatMessageType {
    const msg: ChatMessageType = {
        message: s.final ? s.text : `${s.text} ...`,
        name: participant instanceof LocalParticipant ? "You" : "Agent",
        isSelf: participant instanceof LocalParticipant,
        timestamp: existingMessage?.timestamp ?? Date.now(),
    };
    return msg;
}
