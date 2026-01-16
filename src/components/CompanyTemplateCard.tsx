import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
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
            case "Beginner": return "text-emerald-600 border-emerald-200 bg-emerald-50";
            case "Intermediate": return "text-amber-600 border-amber-200 bg-amber-50";
            case "Advanced": return "text-rose-600 border-rose-200 bg-rose-50";
            default: return "border-transparent bg-secondary text-secondary-foreground";
        }
    };

    return (
        <Card className="flex flex-col h-full hover:shadow-md transition-all">
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-4">
                        <div className="relative h-14 w-14 rounded-lg bg-muted border flex items-center justify-center shrink-0">
                            {template.logo_url ? (
                                <img
                                    src={template.logo_url}
                                    alt={`${template.name} logo`}
                                    className="w-8 h-8 object-contain"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                />
                            ) : null}
                            <Building2 className={`h-6 w-6 text-muted-foreground ${template.logo_url ? 'hidden' : ''}`} />
                            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center ring-2 ring-card">
                                <CheckCircle2 className="h-2.5 w-2.5" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h3 className="font-semibold text-lg leading-tight">
                                {template.name}
                            </h3>
                            {template.industry && (
                                <Badge variant="secondary" className="font-normal text-xs">
                                    {template.industry}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {template.difficulty && (
                        <Badge variant="outline" className={cn(
                            "font-medium border shrink-0",
                            getDifficultyColor(template.difficulty)
                        )}>
                            {template.difficulty}
                        </Badge>
                    )}
                </div>

                {template.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                        {template.description}
                    </p>
                )}
            </CardHeader>

            <CardContent className="flex-1 pb-2">
                {template.common_roles && template.common_roles.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Available Roles</p>
                        <div className="flex flex-wrap gap-1.5">
                            {template.common_roles.slice(0, 3).map((role, index) => (
                                <Badge
                                    key={index}
                                    variant="secondary"
                                    className="font-normal bg-muted text-foreground hover:bg-muted/80"
                                >
                                    {role}
                                </Badge>
                            ))}
                            {template.common_roles.length > 3 && (
                                <Badge variant="secondary" className="font-normal bg-muted text-muted-foreground">
                                    +{template.common_roles.length - 3}
                                </Badge>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-4 mt-auto">
                <Button
                    onClick={() => onSelect(template)}
                    disabled={isLoading}
                    className="w-full"
                    variant="default"
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <>
                            View Roles
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
