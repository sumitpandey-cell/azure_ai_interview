import { Flame } from "lucide-react";

interface StreakIndicatorProps {
    streak: number;
}

export function StreakIndicator({ streak }: StreakIndicatorProps) {
    return (
        <div
            className="group relative flex cursor-pointer items-center gap-2 px-2.5 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-full transition-all duration-300"
            title={`${streak} Day Streak`}
        >
            <div className="absolute inset-0 bg-orange-500/5 blur-md opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
            <div className="relative flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500 fill-orange-500 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black text-orange-500 leading-none">{streak}</span>
            </div>
        </div>
    );
}
