"use client";

import { useEffect, useState } from "react";
import { Check, Palette, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export type ColorTheme = "purple" | "blue" | "green" | "orange" | "rose";

interface ThemeOption {
    id: ColorTheme;
    name: string;
    color: string;
    secondary: string;
    desc: string;
}

const themes: ThemeOption[] = [
    {
        id: "purple",
        name: "Neon Purple",
        color: "#A855F7",
        secondary: "rgba(168, 85, 247, 0.1)",
        desc: "The signature flagship theme"
    },
    {
        id: "blue",
        name: "Midnight Blue",
        color: "#3B82F6",
        secondary: "rgba(59, 130, 246, 0.1)",
        desc: "Deep focus and professional"
    },
    {
        id: "green",
        name: "Emerald",
        color: "#10B981",
        secondary: "rgba(16, 185, 129, 0.1)",
        desc: "Calm and modern growth"
    },
    {
        id: "orange",
        name: "Sunset",
        color: "#F97316",
        secondary: "rgba(249, 115, 22, 0.1)",
        desc: "High energy and vibrant"
    },
    {
        id: "rose",
        name: "Ruby Rose",
        color: "#F43F5E",
        secondary: "rgba(244, 63, 94, 0.1)",
        desc: "Aesthetic and high contrast"
    },
];

export function AppearanceSettings() {
    const [activeTheme, setActiveTheme] = useState<ColorTheme>("purple");

    useEffect(() => {
        const savedTheme = localStorage.getItem("color-theme") as ColorTheme;
        if (savedTheme) {
            setActiveTheme(savedTheme);
            document.documentElement.setAttribute("data-color-theme", savedTheme);
        }
    }, []);

    const handleThemeChange = (themeId: ColorTheme) => {
        setActiveTheme(themeId);
        localStorage.setItem("color-theme", themeId);

        if (themeId === "purple") {
            document.documentElement.removeAttribute("data-color-theme");
        } else {
            document.documentElement.setAttribute("data-color-theme", themeId);
        }

        toast.success(`Theme protocol updated to ${themes.find(t => t.id === themeId)?.name}`);
    };

    return (
        <Card className="border-2 border-border/50 shadow-2xl bg-card rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-10 overflow-hidden relative">
            <div className="absolute top-0 right-0 h-40 w-40 bg-primary/5 blur-3xl rounded-full -translate-y-20 translate-x-20" />

            <CardHeader className="p-0 mb-6 sm:mb-10 relative z-10">
                <div className="flex items-center gap-4 mb-3">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Palette className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <CardTitle className="text-2xl sm:text-3xl font-black tracking-tight">Visual Interface</CardTitle>
                </div>
                <CardDescription className="text-xs sm:text-sm font-medium">
                    Customize your workspace with an aesthetic color profile that suits your style.
                </CardDescription>
            </CardHeader>

            <CardContent className="p-0 space-y-6 sm:space-y-10 relative z-10">
                <div className="space-y-4 sm:space-y-6">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Universal Color Themes</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                        {themes.map((theme) => (
                            <button
                                key={theme.id}
                                onClick={() => handleThemeChange(theme.id)}
                                className={cn(
                                    "group relative flex flex-col items-start gap-3 sm:gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border-2 transition-all duration-500 text-left",
                                    activeTheme === theme.id
                                        ? "border-primary bg-primary/5 shadow-xl shadow-primary/10 scale-[1.02]"
                                        : "border-border/30 bg-muted/20 hover:border-border hover:bg-muted/40 hover:-translate-y-1"
                                )}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div
                                        className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl shadow-inner flex items-center justify-center transform group-hover:rotate-6 transition-all duration-500 border-2 border-white/10"
                                        style={{
                                            backgroundColor: theme.color,
                                            boxShadow: `0 10px 30px ${theme.secondary}`
                                        }}
                                    >
                                        {activeTheme === theme.id ? (
                                            <Check className="h-6 w-6 sm:h-7 sm:w-7 text-white drop-shadow-md animate-in zoom-in duration-300" />
                                        ) : (
                                            <div className="h-3 w-3 rounded-full bg-white/40" />
                                        )}
                                    </div>

                                    {activeTheme === theme.id && (
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                                            <Sparkles className="h-3 w-3" />
                                            Active
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <span className={cn(
                                        "text-base sm:text-lg font-black tracking-tight block",
                                        activeTheme === theme.id ? "text-primary" : "text-foreground"
                                    )}>
                                        {theme.name}
                                    </span>
                                    <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                                        {theme.desc}
                                    </span>
                                </div>

                                {activeTheme === theme.id && (
                                    <div className="absolute top-4 right-4 flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 sm:p-8 rounded-2xl sm:rounded-[2rem] bg-muted/20 border-2 border-dashed border-border/50">
                    <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-8">
                        <div className="space-y-2 text-center md:text-left flex-1">
                            <h4 className="text-lg sm:text-xl font-black tracking-tight">Live UI Preview</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium">This is how your primary buttons and accents will appear across the platform.</p>
                        </div>
                        <div className="flex gap-3 sm:gap-4">
                            <button className="h-10 sm:h-12 px-4 sm:px-6 rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-[9px] sm:text-[10px] shadow-lg shadow-primary/20">Primary Action</button>
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                <Palette className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

