'use client'
import Image from "next/image"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyTemplateCard } from "@/components/CompanyTemplateCard";
import { useAuth } from "@/contexts/AuthContext";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
import { CompanyTemplate } from "@/types/company-types";
import { toast } from "sonner";
import { subscriptionService } from "@/services";
import {
  Search,
  Code2,
  Loader2,
  ChevronLeft,
  Code,
  Clock,
  Briefcase,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { TemplatesPageSkeleton, CompanyTemplatesPageSkeleton } from "@/components/TemplatesPageSkeleton";
import { Template } from "@/services/template.service";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

export default function Templates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingTemplate, setLoadingTemplate] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeTab, setActiveTab] = useState("general");
  const [companyTemplates, setCompanyTemplates] = useState<CompanyTemplate[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyTemplate | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const router = useRouter();
  const { user } = useAuth();
  const { createInterviewSession, fetchCompanyTemplates, fetchTemplates } = useOptimizedQueries();

  // Fetch general templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const data = await fetchTemplates();
        setTemplates(data);
      } catch (error) {
        console.error('Error loading templates:', error);
        toast.error('Failed to load templates');
      } finally {
        setLoadingTemplates(false);
      }
    };

    loadTemplates();
  }, [fetchTemplates]);

  // Fetch company templates on mount
  useEffect(() => {
    const loadCompanyTemplates = async () => {
      setLoadingCompanies(true);
      try {
        const templates = await fetchCompanyTemplates();
        setCompanyTemplates(templates);
      } catch (error) {
        console.error('Error loading company templates:', error);
      } finally {
        setLoadingCompanies(false);
      }
    };

    loadCompanyTemplates();
  }, [fetchCompanyTemplates]);

  // Reset selected company when switching tabs
  useEffect(() => {
    if (activeTab === 'general') {
      setSelectedCompany(null);
    }
  }, [activeTab]);

  // Categories for filtering
  const categories = ["All", "Popular", "Engineer", "Marketing"];

  // Get icon component from icon name string
  const getIconComponent = (iconName: string) => {
    const IconComponent = (LucideIcons as unknown as Record<string, React.ElementType>)[iconName];
    return IconComponent || Code2; // Fallback to Code2 if icon not found
  };

  // Filter templates based on category
  const getCategoryTemplates = () => {
    switch (activeCategory) {
      case "Popular":
        return templates.filter(t => t.is_popular);
      case "Engineer":
        return templates.filter(t =>
          t.title.toLowerCase().includes("developer") ||
          t.title.toLowerCase().includes("engineer") ||
          t.title.toLowerCase().includes("devops")
        );
      case "Marketing":
        return templates.filter(t =>
          t.title.toLowerCase().includes("marketing") ||
          t.title.toLowerCase().includes("content")
        );
      default:
        return templates;
    }
  };

  // Filter templates based on search term and category
  const filteredTemplates = getCategoryTemplates().filter(template =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Function to start interview with selected template
  const startInterviewWithTemplate = async (template: Template) => {
    if (!user) {
      toast.error("Please log in to start an interview");
      return;
    }

    setLoadingTemplate(template.id);

    try {
      // Check balance before creating session (min 2 minutes / 120 seconds)
      const { remainingSeconds } = await subscriptionService.checkUsageLimit(user.id);
      if (remainingSeconds < 120) {
        toast.error("Insufficient balance", {
          description: "You need at least 2 minutes of interview time to start a new session. Please upgrade your plan.",
          action: {
            label: "Upgrade",
            onClick: () => router.push("/pricing")
          }
        });
        return;
      }

      await executeStartGeneralInterview(template);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Error starting interview:', error);
      toast.error(error.message || "Failed to start interview");
      setLoadingTemplate(null);
    }
  };

  const executeStartGeneralInterview = async (template: Template) => {
    try {
      setLoadingTemplate(template.id);
      // Create a new interview session using optimized method
      const session = await createInterviewSession({
        position: template.title,
        interview_type: template.interview_type,
        difficulty: template.difficulty,
        config: {
          skills: template.skills,
          difficulty: template.difficulty,
          currentStage: 'setup'
        }
      });

      if (!session) {
        throw new Error('Failed to create interview session');
      }

      toast.success(`Starting ${template.title} interview...`);
      router.push(`/interview/${session.id}/setup`);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Error in executeStartGeneralInterview:', error);
      toast.error(error.message || "Failed to start interview");
    } finally {
      setLoadingTemplate(null);
    }
  };


  // Function to start interview with company and role
  const startCompanyRoleInterview = async (company: CompanyTemplate, role: string) => {
    if (!user) {
      toast.error("Please log in to start an interview");
      return;
    }

    const templateKey = `${company.id}-${role}`;
    setLoadingTemplate(templateKey);

    try {
      // Check balance before creating session (min 2 minutes / 120 seconds)
      const { remainingSeconds } = await subscriptionService.checkUsageLimit(user.id);
      if (remainingSeconds < 120) {
        toast.error("Insufficient balance", {
          description: "You need at least 2 minutes of interview time to start a new session. Please upgrade your plan.",
          action: {
            label: "Upgrade",
            onClick: () => router.push("/pricing")
          }
        });
        return;
      }

      await executeStartCompanyInterview(company, role);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Error starting company interview:', error);
      toast.error(error.message || "Failed to start interview");
      setLoadingTemplate(null);
    }
  };

  const executeStartCompanyInterview = async (company: CompanyTemplate, role: string) => {
    try {
      const templateKey = `${company.id}-${role}`;
      setLoadingTemplate(templateKey);

      // Create interview session directly with 30-minute duration
      const session = await createInterviewSession({
        position: role,
        interview_type: "Technical",
        difficulty: company.difficulty || 'Intermediate',
        config: {
          companyInterviewConfig: {
            companyTemplateId: company.id,
            companyName: company.name,
            role: role,
            experienceLevel: 'Mid'
          },
          currentStage: 'setup'
        }
      });

      if (!session) {
        throw new Error('Failed to create interview session');
      }

      toast.success(`Starting ${role} interview at ${company.name}...`);
      router.push(`/interview/${session.id}/setup`);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Error in executeStartCompanyInterview:', error);
      toast.error(error.message || "Failed to start interview");
    } finally {
      setLoadingTemplate(null);
    }
  };


  // Filter company templates based on search
  const filteredCompanyTemplates = companyTemplates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.common_roles.some(role => role.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8 pb-12 sm:pt-0">
        {/* Header Section with Controls */}
        <div className="space-y-2 mb-6 sm:mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Interview Templates
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
            Choose from a variety of interview scenarios to practice and improve your skills.
          </p>
        </div>

        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="inline-flex p-1 bg-muted/50 rounded-xl border border-border/50 mb-6 w-full sm:w-auto">
            <TabsTrigger
              value="general"
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              General
            </TabsTrigger>
            <TabsTrigger
              value="company"
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              Companies
            </TabsTrigger>
          </TabsList>

          {/* Category Tabs and Search Bar */}
          <div className="flex flex-col gap-4 mb-8">
            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-colors border whitespace-nowrap shrink-0",
                    activeCategory === category
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:bg-muted"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" />
              <Input
                placeholder="Search templates..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <TabsContent value="general" className="mt-0 space-y-6">
            {loadingTemplates ? (
              <TemplatesPageSkeleton />
            ) : (
              <>
                {searchTerm && (
                  <p className="text-sm text-muted-foreground mb-4">
                    Found {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} matching &quot;{searchTerm}&quot;
                  </p>
                )}

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredTemplates.map((template) => {
                    const IconComponent = getIconComponent(template.icon_name);
                    return (
                      <Card key={template.id} className="flex flex-col h-full hover:shadow-md transition-all">
                        <CardHeader className="space-y-4">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex gap-4">
                              <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center bg-muted shrink-0", template.color.replace('text-', 'bg-').replace('600', '100').replace('500', '100'))}>
                                <IconComponent className={cn("h-5 w-5", template.color)} />
                              </div>
                              <div className="space-y-1">
                                <CardTitle className="text-base font-semibold leading-tight">
                                  {template.title}
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="font-normal text-xs bg-muted text-muted-foreground hover:bg-muted">
                                    {template.interview_type}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline" className={cn(
                              "font-medium border shrink-0",
                              template.difficulty === "Beginner" && "text-emerald-600 border-emerald-200 bg-emerald-50",
                              template.difficulty === "Intermediate" && "text-amber-600 border-amber-200 bg-amber-50",
                              template.difficulty === "Advanced" && "text-rose-600 border-rose-200 bg-rose-50"
                            )}>
                              {template.difficulty}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {template.description}
                          </p>
                        </CardHeader>

                        <CardContent className="flex-1 pb-2">
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Technical Stack</p>
                            <div className="flex flex-wrap gap-1.5">
                              {template.skills.slice(0, 3).map((skill, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="font-normal bg-muted text-foreground hover:bg-muted/80"
                                >
                                  {skill}
                                </Badge>
                              ))}
                              {template.skills.length > 3 && (
                                <Badge variant="secondary" className="font-normal bg-muted text-muted-foreground hover:bg-muted/80">
                                  +{template.skills.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>

                        <CardFooter className="pt-4">
                          <Button
                            onClick={() => startInterviewWithTemplate(template)}
                            disabled={loadingTemplate === template.id}
                            className="w-full"
                          >
                            {loadingTemplate === template.id && (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            )}
                            Start Session
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>

                {filteredTemplates.length === 0 && (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No templates found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search term or{" "}
                      <button
                        onClick={() => setSearchTerm("")}
                        className="text-primary hover:underline"
                      >
                        clear the search
                      </button>{" "}
                      to see all templates.
                    </p>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Company Templates Tab */}
          <TabsContent value="company" className="mt-0">
            {!selectedCompany ? (
              <>
                {/* Step 1: Select Company */}
                <div className="mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1 sm:mb-2">Select a Company</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">Choose a company to see role-specific interview templates</p>
                </div>

                {searchTerm && (
                  <p className="text-sm text-muted-foreground mb-4">
                    Found {filteredCompanyTemplates.length} company{filteredCompanyTemplates.length !== 1 ? 's' : ''} matching &quot;{searchTerm}&quot;
                  </p>
                )}


                {loadingCompanies ? (
                  <CompanyTemplatesPageSkeleton />
                ) : (
                  <>
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                      {filteredCompanyTemplates.map((template) => (
                        <CompanyTemplateCard
                          key={template.id}
                          template={template}
                          onSelect={(company) => setSelectedCompany(company)}
                          isLoading={false}
                        />
                      ))}
                    </div>

                    {filteredCompanyTemplates.length === 0 && !loadingCompanies && (
                      <div className="text-center py-12">
                        <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No companies found</h3>
                        <p className="text-muted-foreground">
                          {searchTerm ? (
                            <>
                              Try adjusting your search term or{" "}
                              <button
                                onClick={() => setSearchTerm("")}
                                className="text-primary hover:underline"
                              >
                                clear the search
                              </button>{" "}
                              to see all companies.
                            </>
                          ) : (
                            "No companies available at this time."
                          )}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                {/* Step 2: Select Role for Selected Company - Redesigned */}
                <div className="mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedCompany(null)}
                    className="mb-6 pl-0 hover:pl-2 transition-all gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Companies
                  </Button>

                  <div className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
                      <div className="h-20 w-20 rounded-lg border bg-muted p-2 flex items-center justify-center shrink-0">
                        {selectedCompany.logo_url ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={selectedCompany.logo_url}
                              alt={`${selectedCompany.name} logo`}
                              fill
                              className="object-contain"
                            />
                          </div>
                        ) : (
                          <Briefcase className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                          <h3 className="text-2xl font-bold tracking-tight text-foreground">{selectedCompany.name}</h3>
                          <Badge variant="secondary" className="font-medium">
                            {selectedCompany.industry}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground max-w-3xl leading-relaxed">
                          {selectedCompany.description || `Prepare for your high-stakes interview at ${selectedCompany.name} with our curated, role-specific automation tracks.`}
                        </p>
                      </div>

                      <div className="hidden xl:flex flex-col items-end gap-1">
                        <div className="text-3xl font-bold text-primary">{selectedCompany.common_roles.length}</div>
                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Available Roles</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {selectedCompany.common_roles.map((role, index) => (
                    <Card key={index} className="flex flex-col h-full hover:shadow-md transition-all">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Briefcase className="h-5 w-5" />
                          </div>
                        </div>
                        <CardTitle className="text-lg font-semibold">{role}</CardTitle>
                        <CardDescription>
                          Tailored performance assessment for the {role} track at {selectedCompany.name}.
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="flex-1 space-y-4">
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center gap-3 text-sm">
                            <Code className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Focus:</span>
                            <span className="font-medium">Tech & Behavioral</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Duration:</span>
                            <span className="font-medium">~45 Minutes</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <Sparkles className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Analysis:</span>
                            <span className="font-medium">AI Insights</span>
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter className="pt-2">
                        <Button
                          className="w-full"
                          onClick={() => startCompanyRoleInterview(selectedCompany, role)}
                          disabled={loadingTemplate === `${selectedCompany.id}-${role}`}
                        >
                          {loadingTemplate === `${selectedCompany.id}-${role}` ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <div className="flex items-center gap-2">
                              Start Interview
                              <ArrowRight className="h-4 w-4" />
                            </div>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div >
    </DashboardLayout >
  );
}