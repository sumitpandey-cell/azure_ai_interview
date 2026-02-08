import { TranscriptMessage } from "./TranscriptMessage";
import { useEffect, useRef } from "react";

export type TranscriptMessageType = {
    name: string;
    message: string;
    isSelf: boolean;
    timestamp: number;
};

type TranscriptListProps = {
    messages: TranscriptMessageType[];
    accentColor: string;
};

export const TranscriptList = ({ messages, accentColor }: TranscriptListProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [containerRef, messages]);

    return (
        <div className="flex flex-col gap-4 w-full h-full">
            <div
                ref={containerRef}
                className="overflow-y-auto h-full"
            >
                <div className="flex flex-col gap-4 min-h-full justify-end">
                    {messages.map((message, index, allMsg) => {
                        const hideName =
                            index >= 1 && allMsg[index - 1].name === message.name;

                        return (
                            <TranscriptMessage
                                key={index}
                                hideName={hideName}
                                name={message.name}
                                message={message.message}
                                isSelf={message.isSelf}
                                accentColor={accentColor}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
