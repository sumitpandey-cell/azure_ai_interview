type ChatMessageProps = {
    message: string;
    accentColor: string;
    name: string;
    isSelf: boolean;
    hideName?: boolean;
};

export const ChatMessage = ({
    name,
    message,
    accentColor,
    isSelf,
    hideName,
}: ChatMessageProps) => {
    return (
        <div className={`flex flex-col gap-1.5 ${hideName ? "pt-1" : "pt-6"}`}>
            {!hideName && (
                <div
                    className={`text-[9px] uppercase tracking-[0.2em] font-bold ${isSelf ? "text-muted-foreground/40" : "text-primary/70"
                        }`}
                >
                    {name}
                </div>
            )}
            <div
                className={`pr-4 text-sm font-medium leading-relaxed ${isSelf ? "text-muted-foreground/80" : "text-white/90"
                    } whitespace-pre-line`}
            >
                {message}
            </div>
        </div>
    );
};
