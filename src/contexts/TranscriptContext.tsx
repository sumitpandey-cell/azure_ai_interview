"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type ChatMessageType = {
    name: string;
    message: string;
    isSelf: boolean;
    timestamp: number;
};

interface TranscriptContextType {
    transcripts: Map<string, ChatMessageType>;
    addOrUpdateTranscript: (id: string, message: ChatMessageType) => void;
    clearTranscripts: () => void;
}

const TranscriptContext = createContext<TranscriptContextType | undefined>(undefined);

export type TranscriptEntry = {
    speaker: "user" | "ai";
    text: string;
    timestamp: number;
};

export function TranscriptProvider({
    children,
    initialTranscripts = []
}: {
    children: ReactNode;
    initialTranscripts?: TranscriptEntry[];
}) {
    const [transcripts, setTranscripts] = useState<Map<string, ChatMessageType>>(() => {
        const map = new Map<string, ChatMessageType>();
        initialTranscripts.forEach((t, i) => {
            const id = `initial-${i}`;
            map.set(id, {
                name: t.speaker === 'user' ? 'You' : 'Agent',
                message: t.text,
                isSelf: t.speaker === 'user',
                timestamp: t.timestamp
            });
        });
        return map;
    });

    const addOrUpdateTranscript = useCallback((id: string, message: ChatMessageType) => {
        setTranscripts((prev) => {
            const updated = new Map(prev);
            updated.set(id, message);
            return updated;
        });
    }, []);

    const clearTranscripts = useCallback(() => {
        setTranscripts(new Map());
    }, []);

    return (
        <TranscriptContext.Provider value={{ transcripts, addOrUpdateTranscript, clearTranscripts }}>
            {children}
        </TranscriptContext.Provider>
    );
}

export function useTranscriptContext() {
    const context = useContext(TranscriptContext);
    if (!context) {
        throw new Error("useTranscriptContext must be used within a TranscriptProvider");
    }
    return context;
}
