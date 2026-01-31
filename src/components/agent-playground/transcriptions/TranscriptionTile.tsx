import { ChatMessageType, ChatTile } from "../chat/ChatTile";
import {
    TrackReferenceOrPlaceholder,
    useChat,
    useLocalParticipant,
} from "@livekit/components-react";
import { useEffect, useState } from "react";
import { useTranscriptContext } from "@/contexts/TranscriptContext";

export function TranscriptionTile({
    agentAudioTrack,
    accentColor,
}: {
    agentAudioTrack?: TrackReferenceOrPlaceholder;
    accentColor: string;
}) {
    // Transcript tracking is now handled by TranscriptTracker component
    // This component only displays the transcripts from context + chat messages

    const { transcripts } = useTranscriptContext();
    const [messages, setMessages] = useState<ChatMessageType[]>([]);
    const { chatMessages, send: sendChat } = useChat();
    const { localParticipant } = useLocalParticipant();


    // Derive messages from transcripts and chat messages
    useEffect(() => {
        const allMessages = Array.from(transcripts.values());
        for (const msg of chatMessages) {
            const isAgent = agentAudioTrack
                ? msg.from?.identity === agentAudioTrack.participant?.identity
                : msg.from?.identity !== localParticipant.identity;
            const isSelf =
                msg.from?.identity === localParticipant.identity;
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
        chatMessages,
        localParticipant.identity,
        agentAudioTrack,
    ]);


    return (
        <ChatTile messages={messages} accentColor={accentColor} onSend={sendChat} />
    );
}

