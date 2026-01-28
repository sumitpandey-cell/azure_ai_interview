"use client";

import { useEffect, useState } from "react";
import { Check, Palette } from "lucide-react";
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
        <Card className="border-2 border-border/50 shadow-lg bg-card rounded-xl sm:rounded-2xl p-4 sm:p-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 h-32 w-32 bg-primary/5 blur-3xl rounded-full -translate-y-16 translate-x-16" />

            <CardHeader className="p-0 mb-6 sm:mb-8 relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Palette className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl font-black tracking-tight">Visual Interface</CardTitle>
                </div>
                <CardDescription className="text-[10px] sm:text-xs font-medium">
                    Customize your workspace with an aesthetic color profile that suits your style.
                </CardDescription>
            </CardHeader>

            <CardContent className="p-0 space-y-6 sm:space-y-8 relative z-10">
                <div className="space-y-4">
                    <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Universal Color Themes</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                        {themes.map((theme) => (
                            <button
                                key={theme.id}
                                onClick={() => handleThemeChange(theme.id)}
                                className={cn(
                                    "group relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 text-left",
                                    activeTheme === theme.id
                                        ? "border-primary bg-primary/5 shadow-sm"
                                        : "border-border/40 bg-card hover:border-border hover:bg-accent/50"
                                )}
                            >
                                <div
                                    className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center border border-white/10 shadow-sm transition-transform group-hover:scale-105"
                                    style={{
                                        backgroundColor: theme.color,
                                    }}
                                >
                                    {activeTheme === theme.id && (
                                        <Check className="h-5 w-5 text-white" />
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-bold truncate text-foreground">
                                            {theme.name}
                                        </span>
                                        {activeTheme === theme.id && (
                                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                        )}
                                    </div>
                                    <p className="text-[10px] font-medium text-muted-foreground truncate">
                                        {theme.desc}
                                    </p>
                                </div>
                                {activeTheme === theme.id && (
                                    <div className="absolute top-3 right-3 flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 sm:p-6 rounded-xl sm:rounded-xl bg-muted/20 border-2 border-dashed border-border/50">
                    <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6">
                        <div className="space-y-1 text-center md:text-left flex-1">
                            <h4 className="text-base sm:text-lg font-black tracking-tight">Live UI Preview</h4>
                            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">This is how your primary buttons and accents will appear across the platform.</p>
                        </div>
                        <div className="flex gap-2.5 sm:gap-3">
                            <button className="h-9 sm:h-10 px-4 sm:px-5 rounded-lg bg-primary text-primary-foreground font-black uppercase tracking-widest text-[8px] sm:text-[9px] shadow-lg shadow-primary/20">Primary Action</button>
                            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                <Palette className="h-4 w-4" />
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card >
    );
}

