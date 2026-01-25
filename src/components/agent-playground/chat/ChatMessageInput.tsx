"use client";

import { useCallback, useRef, useState } from "react";

type ChatMessageInputProps = {
    placeholder: string;
    accentColor: string;
    height: number;
    onSend?: (message: string) => void;
};

export const ChatMessageInput = ({
    placeholder,
    accentColor,
    height,
    onSend,
}: ChatMessageInputProps) => {
    const [message, setMessage] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputHasFocus, setInputHasFocus] = useState(false);

    const handleSend = useCallback(() => {
        if (!onSend || message.trim() === "") {
            return;
        }

        onSend(message);
        setMessage("");
    }, [onSend, message]);

    return (
        <div
            className="flex flex-col gap-2 border-t border-border/40"
            style={{ height: height }}
        >
            <div className="flex flex-row pt-3 gap-2 items-center relative h-full">
                <div className={`relative flex-1 flex items-center rounded-xl transition-all duration-300 ${inputHasFocus ? "bg-primary/5 ring-1 ring-primary/20" : "bg-transparent"}`}>
                    <input
                        ref={inputRef}
                        className="w-full text-xs font-medium bg-transparent text-foreground px-4 py-2.5 rounded-xl border border-transparent focus:outline-none placeholder:text-muted-foreground/40 caret-primary"
                        placeholder={placeholder}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onFocus={() => setInputHasFocus(true)}
                        onBlur={() => setInputHasFocus(false)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleSend();
                            }
                        }}
                    />
                </div>

                <button
                    disabled={message.trim().length === 0 || !onSend}
                    onClick={handleSend}
                    className={`h-10 px-4 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-primary hover:text-foreground transition-all disabled:opacity-0 disabled:pointer-events-none ${message.trim().length > 0 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
                        }`}
                >
                    Send
                </button>
            </div>
        </div>
    );
};
