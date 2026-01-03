type ChatMessageProps = {
    message: string;
    accentColor: string;
    name: string;
    isSelf: boolean;
    hideName?: boolean;
    sentiment?: string;
    confidence?: number;
};

export const ChatMessage = ({
    name,
    message,
    accentColor,
    isSelf,
    hideName,
    sentiment,
    confidence,
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
                    } whitespace-pre-line flex items-center gap-3`}
            >
                <span>{message}</span>
                {isSelf && sentiment && (
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${sentiment.toLowerCase() === 'positive' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                            sentiment.toLowerCase() === 'negative' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                        {sentiment} {confidence !== undefined ? `(${confidence.toFixed(0)}%)` : ''}
                    </span>
                )}
            </div>
        </div>
    );
};
