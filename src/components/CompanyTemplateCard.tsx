import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompanyTemplate } from "@/types/company-types";
import { Building2, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompanyTemplateCardProps {
    template: CompanyTemplate;
    onSelect: (template: CompanyTemplate) => void;
    isLoading?: boolean;
}

export function CompanyTemplateCard({ template, onSelect, isLoading }: CompanyTemplateCardProps) {
    const getDifficultyColor = (difficulty: string | null) => {
        switch (difficulty) {
            case "Beginner": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
            case "Intermediate": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
            case "Advanced": return "bg-rose-500/10 text-rose-600 border-rose-500/20";
            default: return "bg-slate-100 text-slate-600 border-slate-200";
        }
    };

    return (
        <Card className="group relative flex flex-col h-full overflow-hidden border-2 border-border/50 bg-card hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-2 rounded-3xl">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-colors" />

            <CardContent className="p-8 flex flex-col h-full relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-4">
                        {/* Logo Wrapper */}
                        <div className="relative">
                            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 p-3 shadow-sm border border-border flex items-center justify-center shrink-0 group-hover:rotate-3 transition-all duration-500">
                                {template.logo_url ? (
                                    <img
                                        src={template.logo_url}
                                        alt={`${template.name} logo`}
                                        className="w-10 h-10 object-contain"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                ) : null}
                                <Building2 className={`h-8 w-8 text-muted-foreground ${template.logo_url ? 'hidden' : ''}`} />
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-primary rounded-full border-2 border-card flex items-center justify-center">
                                <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                            </div>
                        </div>

                        <div>
                            <h3 className="font-black text-xl text-foreground leading-tight mb-1 group-hover:text-primary transition-colors">
                                {template.name}
                            </h3>
                            {template.industry && (
                                <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                                    {template.industry}
                                </span>
                            )}
                        </div>
                    </div>

                    {template.difficulty && (
                        <div className={cn(
                            "text-[10px] font-black uppercase tracking-tighter px-2.5 py-1 rounded-full border-2",
                            getDifficultyColor(template.difficulty)
                        )}>
                            {template.difficulty}
                        </div>
                    )}
                </div>

                {/* Description */}
                {template.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-8 font-medium leading-relaxed">
                        {template.description}
                    </p>
                )}

                {/* Roles Section */}
                <div className="mt-auto space-y-4">
                    {template.common_roles && template.common_roles.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="h-px flex-1 bg-border/50" />
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                    Top Tracks
                                </p>
                                <div className="h-px flex-1 bg-border/50" />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {template.common_roles.slice(0, 3).map((role, index) => (
                                    <div
                                        key={index}
                                        className="bg-muted px-3 py-1.5 rounded-xl text-[11px] font-bold text-foreground border border-transparent hover:border-primary/30 hover:bg-primary/5 transition-all cursor-default"
                                    >
                                        {role}
                                    </div>
                                ))}
                                {template.common_roles.length > 3 && (
                                    <div className="text-[10px] px-2 py-1.5 text-muted-foreground font-black bg-muted/30 rounded-lg">
                                        +{template.common_roles.length - 3} MORE
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Performance CTA */}
                <div className="mt-8 pt-6 border-t border-border/50">
                    <Button
                        onClick={() => onSelect(template)}
                        disabled={isLoading}
                        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-wider text-xs rounded-2xl shadow-lg shadow-primary/10 group-hover:shadow-primary/20 transition-all"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <div className="flex items-center gap-2">
                                Explore Roles
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
