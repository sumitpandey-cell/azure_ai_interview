import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompanyTemplate } from "@/types/company-types";
import { Building2, Loader2, CheckCircle2, ArrowRight } from "lucide-react";

interface CompanyTemplateCardProps {
    template: CompanyTemplate;
    onSelect: (template: CompanyTemplate) => void;
    isLoading?: boolean;
}

export function CompanyTemplateCard({ template, onSelect, isLoading }: CompanyTemplateCardProps) {
    const getDifficultyColor = (difficulty: string | null) => {
        switch (difficulty) {
            case "Beginner": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900";
            case "Intermediate": return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900";
            case "Advanced": return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900";
            default: return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700";
        }
    };

    return (
        <Card className="group relative flex flex-col h-full overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            {/* Decorative gradient background at top */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-slate-50/80 to-transparent dark:from-slate-900/50 dark:to-transparent opacity-50 pointer-events-none" />

            <CardContent className="p-6 flex flex-col h-full relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-5">
                    <div className="flex gap-4">
                        {/* Logo */}
                        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 p-2 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
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
                            <Building2 className={`h-7 w-7 text-slate-400 dark:text-slate-500 ${template.logo_url ? 'hidden' : ''}`} />
                        </div>

                        <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 leading-tight mb-1 group-hover:text-primary transition-colors">
                                {template.name}
                            </h3>
                            {template.industry && (
                                <span className="inline-flex items-center text-xs font-medium text-slate-500 dark:text-slate-400">
                                    {template.industry}
                                </span>
                            )}
                        </div>
                    </div>

                    {template.difficulty && (
                        <Badge variant="outline" className={`text-[10px] px-2 py-0.5 border ${getDifficultyColor(template.difficulty)}`}>
                            {template.difficulty}
                        </Badge>
                    )}
                </div>

                {/* Description */}
                {template.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-6 leading-relaxed">
                        {template.description}
                    </p>
                )}

                {/* Roles */}
                <div className="mt-auto">
                    {template.common_roles && template.common_roles.length > 0 && (
                        <>
                            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-wider">
                                Popular Roles
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {template.common_roles.slice(0, 3).map((role, index) => (
                                    <Badge
                                        key={index}
                                        variant="secondary"
                                        className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-transparent dark:border-slate-800 font-normal"
                                    >
                                        {role}
                                    </Badge>
                                ))}
                                {template.common_roles.length > 3 && (
                                    <span className="text-xs px-1.5 py-0.5 text-slate-400 dark:text-slate-500 font-medium">
                                        +{template.common_roles.length - 3}
                                    </span>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer / Button */}
                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="font-medium">Verified Questions</span>
                    </div>

                    <Button
                        size="sm"
                        className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white/90 shadow-sm hover:shadow transition-all rounded-lg px-4"
                        onClick={() => onSelect(template)}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                                Loading...
                            </>
                        ) : (
                            <>
                                Select
                                <ArrowRight className="h-3.5 w-3.5 ml-2 opacity-70" />
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
