import { useWindowResize } from "../hooks/useWindowResize";
import { useCallback, useEffect, useRef, useState } from "react";

type ChatMessageInput = {
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
}: ChatMessageInput) => {
    const [message, setMessage] = useState("");
    const [inputTextWidth, setInputTextWidth] = useState(0);
    const [inputWidth, setInputWidth] = useState(0);
    const hiddenInputRef = useRef<HTMLSpanElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const windowSize = useWindowResize();
    const [isTyping, setIsTyping] = useState(false);
    const [inputHasFocus, setInputHasFocus] = useState(false);

    const handleSend = useCallback(() => {
        if (!onSend) {
            return;
        }
        if (message === "") {
            return;
        }

        onSend(message);
        setMessage("");
    }, [onSend, message]);

    useEffect(() => {
        setIsTyping(true);
        const timeout = setTimeout(() => {
            setIsTyping(false);
        }, 500);

        return () => clearTimeout(timeout);
    }, [message]);

    useEffect(() => {
        if (hiddenInputRef.current) {
            setInputTextWidth(hiddenInputRef.current.clientWidth);
        }
    }, [hiddenInputRef, message]);

    useEffect(() => {
        if (inputRef.current) {
            setInputWidth(inputRef.current.clientWidth);
        }
    }, [hiddenInputRef, message, windowSize.width]);

    return (
        <div
            className="flex flex-col gap-2 border-t border-white/5"
            style={{ height: height }}
        >
            <div className="flex flex-row pt-3 gap-2 items-center relative">
                <div
                    className={`w-1.5 h-4 bg-primary transition-all duration-300 absolute left-2 ${inputHasFocus ? "opacity-100 shadow-[0_0_8px_rgba(168,85,247,0.5)]" : "opacity-20"
                        } ${!isTyping && inputHasFocus ? "cursor-animation" : ""
                        }`}
                    style={{
                        transform:
                            "translateX(" +
                            (message.length > 0
                                ? Math.min(inputTextWidth, inputWidth - 20) - 4
                                : 0) +
                            "px)",
                    }}
                ></div>
                <input
                    ref={inputRef}
                    className={`w-full text-xs font-medium caret-transparent bg-transparent text-white p-2 pr-10 rounded-lg border border-transparent focus:outline-none transition-all placeholder:text-white/20`}
                    style={{
                        paddingLeft: message.length > 0 ? "12px" : "24px",
                    }}
                    placeholder={placeholder}
                    value={message}
                    onChange={(e) => {
                        setMessage(e.target.value);
                    }}
                    onFocus={() => {
                        setInputHasFocus(true);
                    }}
                    onBlur={() => {
                        setInputHasFocus(false);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleSend();
                        }
                    }}
                ></input>
                <span
                    ref={hiddenInputRef}
                    className="absolute top-0 left-0 text-xs pl-3 text-primary pointer-events-none opacity-0"
                >
                    {message.replaceAll(" ", "\u00a0")}
                </span>
                <button
                    disabled={message.length === 0 || !onSend}
                    onClick={handleSend}
                    className={`text-[10px] font-bold uppercase tracking-widest text-primary hover:text-white transition-all pr-2 ${message.length > 0 ? "opacity-100 blur-0" : "opacity-0 blur-sm"
                        }`}
                >
                    Send
                </button>
            </div>
        </div>
    );
};
