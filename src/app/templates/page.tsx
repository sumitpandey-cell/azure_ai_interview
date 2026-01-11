'use client'
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyTemplateCard } from "@/components/CompanyTemplateCard";
import { useAuth } from "@/contexts/AuthContext";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
import { CompanyTemplate } from "@/types/company-types";
import { toast } from "sonner";
import { interviewService, subscriptionService } from "@/services";
import { InterviewConflictDialog } from "@/components/InterviewConflictDialog";
import {
  Search,
  Code2,
  Loader2,
  Settings as SettingsIcon,
  ChevronLeft,
  Code,
  Clock,
  Briefcase,
  CheckCircle2,
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
  const { user, signOut } = useAuth();
  const { createInterviewSession, profile, fetchCompanyTemplates, fetchTemplates } = useOptimizedQueries();
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [conflictSession, setConflictSession] = useState<any>(null);
  const [pendingAction, setPendingAction] = useState<{ type: 'general' | 'company', data: any } | null>(null);

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
    const IconComponent = (LucideIcons as any)[iconName];
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
      // Check balance before creating session
      const { remainingMinutes } = await subscriptionService.checkUsageLimit(user.id);
      if (remainingMinutes < 120) {
        toast.error("Insufficient balance", {
          description: "You need at least 2 minutes of interview time to start a new session. Please upgrade your plan.",
          action: {
            label: "Upgrade",
            onClick: () => router.push("/pricing")
          }
        });
        return;
      }

      // Check for existing sessions
      const existingSessions = await interviewService.getInProgressSessions(user.id);
      const sameDomainSession = existingSessions?.find(s =>
        s.position.toLowerCase() === template.title.toLowerCase() &&
        s.interview_type.toLowerCase() === template.interview_type.toLowerCase()
      );

      if (sameDomainSession) {
        setConflictSession(sameDomainSession);
        setPendingAction({ type: 'general', data: template });
        setConflictDialogOpen(true);
        setLoadingTemplate(null);
        return;
      }

      await executeStartGeneralInterview(template);
    } catch (error: any) {
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
    } catch (error: any) {
      console.error('Error in executeStartGeneralInterview:', error);
      toast.error(error.message || "Failed to start interview");
    } finally {
      setLoadingTemplate(null);
    }
  };

  // Get difficulty badge color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "bg-green-100 text-green-800";
      case "Intermediate": return "bg-yellow-100 text-yellow-800";
      case "Advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
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
      // Check balance before creating session
      const { remainingMinutes } = await subscriptionService.checkUsageLimit(user.id);
      if (remainingMinutes < 120) {
        toast.error("Insufficient balance", {
          description: "You need at least 2 minutes of interview time to start a new session. Please upgrade your plan.",
          action: {
            label: "Upgrade",
            onClick: () => router.push("/pricing")
          }
        });
        return;
      }

      // Check for existing sessions
      const existingSessions = await interviewService.getInProgressSessions(user.id);
      const sameDomainSession = existingSessions?.find(s =>
        s.position.toLowerCase() === role.toLowerCase() &&
        s.interview_type.toLowerCase() === "technical"
      );

      if (sameDomainSession) {
        setConflictSession(sameDomainSession);
        setPendingAction({ type: 'company', data: { company, role } });
        setConflictDialogOpen(true);
        setLoadingTemplate(null);
        return;
      }

      await executeStartCompanyInterview(company, role);
    } catch (error: any) {
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
    } catch (error: any) {
      console.error('Error in executeStartCompanyInterview:', error);
      toast.error(error.message || "Failed to start interview");
    } finally {
      setLoadingTemplate(null);
    }
  };

  const handleContinuePrevious = () => {
    if (!conflictSession) return;
    toast.info("Redirecting to previous interview...");
    const stage = (conflictSession.config as any)?.currentStage || 'setup';
    router.push(`/interview/${conflictSession.id}/${stage}`);
    setConflictDialogOpen(false);
  };

  const handleStartNewAfterAbandon = async () => {
    if (!conflictSession || !pendingAction) return;

    setConflictDialogOpen(false);

    try {
      // Abandon previous session using service
      const abandoned = await interviewService.abandonSession(conflictSession.id);

      if (abandoned) {
        toast.success("Previous interview abandoned. Starting new session...");
        if (pendingAction.type === 'general') {
          await executeStartGeneralInterview(pendingAction.data);
        } else {
          await executeStartCompanyInterview(pendingAction.data.company, pendingAction.data.role);
        }
      } else {
        toast.error("Failed to abandon previous session. Please try again.");
      }
    } catch (error) {
      console.error("Error abandoning session:", error);
      toast.error("An error occurred. Please try again.");
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
      <div className="space-y-8 pb-12 pt-10 sm:pt-0">
        {/* Header Section with Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-8 sm:mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="text-left space-y-1 sm:space-y-2">
            <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-primary border border-primary/20 mb-1 sm:mb-2">
              <Sparkles className="mr-2 h-3 w-3" />
              Ready-to-use Scenarios
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight">
              Interview <span className="text-primary italic">Vault</span>
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm md:text-base font-medium max-w-lg leading-relaxed">
              Unlock precision-engineered automation templates for high-impact practice.
            </p>
          </div>
        </div>

        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="inline-flex p-1 bg-muted/50 rounded-xl sm:rounded-2xl border border-border/50 mb-6 sm:mb-10 w-full sm:w-auto h-11 sm:h-14">
            <TabsTrigger
              value="general"
              className="flex-1 sm:flex-none px-4 sm:px-8 py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-lg h-full"
            >
              General Tracks
            </TabsTrigger>
            <TabsTrigger
              value="company"
              className="flex-1 sm:flex-none px-4 sm:px-8 py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-lg h-full"
            >
              Industry Giants
            </TabsTrigger>
          </TabsList>

          {/* Category Tabs and Search Bar */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-12">
            {/* Category Tabs */}
            <div className="flex gap-2 items-center overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 no-scrollbar px-1">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-[9px] sm:text-[11px] uppercase tracking-widest transition-all whitespace-nowrap border-2",
                    activeCategory === category
                      ? "bg-primary border-primary text-primary-foreground shadow-xl shadow-primary/20 scale-105"
                      : "bg-card border-border/50 text-muted-foreground hover:border-primary/30 hover:text-primary"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative w-full lg:w-96 group">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search tracks, skills..."
                className="pl-11 h-12 w-full bg-card/50 border-2 border-border/50 rounded-2xl focus:ring-primary focus:border-primary transition-all"
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
                    Found {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} matching "{searchTerm}"
                  </p>
                )}

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredTemplates.map((template) => {
                    const IconComponent = getIconComponent(template.icon_name);
                    return (
                      <Card key={template.id} className="group relative flex flex-col h-full overflow-hidden border-2 border-border/50 bg-card hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-2 rounded-2xl sm:rounded-3xl">
                        {/* Status Glow */}
                        <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500" />

                        <CardContent className="p-5 sm:p-8 flex flex-col h-full relative z-10">
                          {/* Top Section */}
                          <div className="flex justify-between items-start mb-4 sm:mb-6">
                            <div className="flex gap-3 sm:gap-4">
                              {/* Icon Wrapper */}
                              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-muted p-2 sm:p-3.5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:rotate-6 transition-all duration-500">
                                <IconComponent className={cn("h-5 w-5 sm:h-7 sm:w-7 transition-colors", template.color)} />
                              </div>

                              <div className="space-y-0.5 sm:space-y-1 min-w-0">
                                <h3 className="font-black text-base sm:text-xl text-foreground leading-tight group-hover:text-primary transition-colors truncate">
                                  {template.title}
                                </h3>
                                <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2 py-0.5 rounded-md bg-muted/50 inline-block">
                                  {template.interview_type}
                                </div>
                              </div>
                            </div>

                            <div className={cn(
                              "text-[8px] sm:text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border-2 whitespace-nowrap",
                              template.difficulty === "Beginner" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                template.difficulty === "Intermediate" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                                  "bg-rose-500/10 text-rose-600 border-rose-500/20"
                            )}>
                              {template.difficulty}
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-6 sm:mb-8 font-medium leading-relaxed">
                            {template.description}
                          </p>

                          {/* Key Specs */}
                          <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                            <div className="space-y-1.5 sm:space-y-2">
                              <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                Technical Stack
                              </p>
                              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                {template.skills.slice(0, 3).map((skill, index) => (
                                  <div
                                    key={index}
                                    className="bg-muted px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-bold text-foreground border border-transparent group-hover:border-primary/30 group-hover:bg-primary/5 transition-all"
                                  >
                                    {skill}
                                  </div>
                                ))}
                                {template.skills.length > 3 && (
                                  <div className="text-[9px] sm:text-[10px] px-2 py-1 sm:py-1.5 text-muted-foreground font-black bg-muted/30 rounded-lg">
                                    +{template.skills.length - 3}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Bottom Action */}
                          <div className="mt-auto pt-4 sm:pt-6 border-t border-border/50 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" />
                              </div>
                              <span className="text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest">PRO Ready</span>
                            </div>

                            <Button
                              onClick={() => startInterviewWithTemplate(template)}
                              disabled={loadingTemplate === template.id}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-wider text-[9px] sm:text-[10px] h-9 sm:h-10 px-4 sm:px-6 rounded-lg sm:rounded-xl shadow-lg shadow-primary/10 group-hover:shadow-primary/20 transition-all"
                            >
                              {loadingTemplate === template.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <div className="flex items-center gap-2">
                                  Launch
                                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                              )}
                            </Button>
                          </div>
                        </CardContent>
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
                  <h3 className="text-xl font-semibold text-foreground mb-2">Select a Company</h3>
                  <p className="text-muted-foreground text-sm">Choose a company to see role-specific interview templates</p>
                </div>

                {searchTerm && (
                  <p className="text-sm text-muted-foreground mb-4">
                    Found {filteredCompanyTemplates.length} company{filteredCompanyTemplates.length !== 1 ? 's' : ''} matching "{searchTerm}"
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
                  <button
                    onClick={() => setSelectedCompany(null)}
                    className="group flex items-center gap-3 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all mb-8"
                  >
                    <div className="h-10 w-10 rounded-xl bg-card border-2 border-border/50 flex items-center justify-center group-hover:border-primary/50 group-hover:shadow-lg group-hover:shadow-primary/10 transition-all">
                      <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    </div>
                    Back to Ecosystem
                  </button>

                  <div className="relative overflow-hidden rounded-[1.5rem] sm:rounded-2xl bg-slate-900 dark:bg-card border-2 border-border/50 p-6 sm:p-10 md:p-14 shadow-2xl">
                    {/* Glowing Mesh Background */}
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-primary/20 blur-[100px] animate-pulse" />
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-96 w-96 rounded-full bg-blue-500/10 blur-[100px]" />

                    <div className="relative z-10 flex flex-col md:flex-row gap-6 sm:gap-10 items-center md:items-center text-center md:text-left">
                      <div className="h-20 w-20 sm:h-28 sm:w-28 rounded-2xl sm:rounded-2xl bg-white p-3 sm:p-5 shadow-2xl flex items-center justify-center shrink-0 border-4 border-white/10 group-hover:scale-105 transition-transform">
                        {selectedCompany.logo_url ? (
                          <img
                            src={selectedCompany.logo_url}
                            alt={`${selectedCompany.name} logo`}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Briefcase className="h-8 w-8 sm:h-12 sm:w-12 text-slate-900" />
                        )}
                      </div>

                      <div className="flex-1 space-y-2 sm:space-y-4">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-4">
                          <h3 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter text-white">{selectedCompany.name}</h3>
                          <div className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-primary/20 text-primary border border-primary/20 text-[8px] sm:text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                            {selectedCompany.industry}
                          </div>
                        </div>
                        <p className="text-slate-300 text-xs sm:text-base md:text-lg max-w-3xl leading-relaxed font-medium">
                          {selectedCompany.description || `Prepare for your high-stakes interview at ${selectedCompany.name} with our curated, role-specific automation tracks.`}
                        </p>
                      </div>

                      <div className="hidden xl:flex flex-col items-end gap-2 bg-white/5 rounded-3xl p-6 backdrop-blur-md border border-white/10">
                        <div className="text-5xl font-black text-white tracking-tighter">{selectedCompany.common_roles.length}</div>
                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Live Tracks</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {selectedCompany.common_roles.map((role, index) => (
                    <Card key={index} className="group relative overflow-hidden border-2 border-border/50 bg-card hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-2 rounded-3xl">
                      <CardContent className="p-8">
                        <div className="flex justify-between items-start mb-8">
                          <div className="h-16 w-16 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                            <Briefcase className="h-8 w-8" />
                          </div>
                          <div className="px-3 py-1.5 rounded-xl bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-widest border border-border/50">
                            Professional
                          </div>
                        </div>

                        <h4 className="text-2xl font-black text-foreground mb-3 group-hover:text-primary transition-colors tracking-tight">
                          {role}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-8 font-medium leading-relaxed">
                          Tailored performance assessment designed specifically for the {role} track at {selectedCompany.name}.
                        </p>

                        <div className="space-y-4 mb-10">
                          <div className="flex items-center gap-4 group/item">
                            <div className="h-10 w-10 rounded-xl bg-muted group-hover/item:bg-primary/10 flex items-center justify-center transition-all">
                              <Code className="h-5 w-5 text-muted-foreground group-hover/item:text-primary transition-colors" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Focus</p>
                              <p className="text-sm font-bold text-foreground">Tech & Behavioral</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 group/item">
                            <div className="h-10 w-10 rounded-xl bg-muted group-hover/item:bg-primary/10 flex items-center justify-center transition-all">
                              <Clock className="h-5 w-5 text-muted-foreground group-hover/item:text-primary transition-colors" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Duration</p>
                              <p className="text-sm font-bold text-foreground">~45 Minutes</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 group/item">
                            <div className="h-10 w-10 rounded-xl bg-muted group-hover/item:bg-primary/10 flex items-center justify-center transition-all">
                              <CheckCircle2 className="h-5 w-5 text-muted-foreground group-hover/item:text-primary transition-colors" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Analysis</p>
                              <p className="text-sm font-bold text-foreground">Deep AI Metrics</p>
                            </div>
                          </div>
                        </div>

                        <Button
                          className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-primary/10 group-hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95"
                          onClick={() => startCompanyRoleInterview(selectedCompany, role)}
                          disabled={loadingTemplate === `${selectedCompany.id}-${role}`}
                        >
                          {loadingTemplate === `${selectedCompany.id}-${role}` ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <div className="flex items-center gap-2">
                              Start Track
                              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div >
      <InterviewConflictDialog
        isOpen={conflictDialogOpen}
        onClose={() => setConflictDialogOpen(false)}
        onContinue={handleContinuePrevious}
        onStartNew={handleStartNewAfterAbandon}
        sessionDetails={conflictSession ? {
          position: conflictSession.position,
          type: conflictSession.interview_type,
          startedAt: new Date(conflictSession.created_at).toLocaleString()
        } : null}
      />
    </DashboardLayout >
  );
}