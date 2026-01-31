import { User, Cpu } from "lucide-react";

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
    isSelf,
    hideName,
}: ChatMessageProps) => {
    return (
        <div className={`flex flex-col gap-2 ${hideName ? "pt-1.5" : "pt-8"} group transition-all`}>
            {!hideName && (
                <div className={`flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] font-black ${isSelf ? "text-muted-foreground" : "text-primary"}`}>
                    <div className={`p-1 rounded-sm ${isSelf ? "bg-muted" : "bg-primary/10 border border-primary/20"}`}>
                        {isSelf ? <User className="h-2.5 w-2.5" /> : <Cpu className="h-2.5 w-2.5" />}
                    </div>
                    {name}
                </div>
            )}
            <div
                className={`
                    relative px-4 py-3 text-[13px] font-medium leading-relaxed rounded-2xl border transition-all duration-300
                    ${isSelf
                        ? "bg-zinc-100/50 dark:bg-zinc-800/20 border-border dark:border-white/5 text-zinc-600 dark:text-zinc-400"
                        : "bg-primary/5 border-primary/10 text-foreground dark:text-white shadow-[0_4px_20px_rgba(168,85,247,0.05)]"}
                `}
            >
                <div className="whitespace-pre-line leading-relaxed">{message}</div>

                {/* Micro tech decorative elements for AI messages */}
                {!isSelf && (
                    <div className="absolute -left-[1px] top-4 w-[2px] h-4 bg-primary rounded-full shadow-[0_0_8px_rgba(168_85,247,0.5)]" />
                )}
            </div>
        </div>
    );
};
