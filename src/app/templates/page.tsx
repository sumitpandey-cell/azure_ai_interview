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
  ArrowRight
} from "lucide-react";
import { TemplatesPageSkeleton, CompanyTemplatesPageSkeleton } from "@/components/TemplatesPageSkeleton";
import { Template } from "@/services/template.service";
import * as LucideIcons from "lucide-react";

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
      // Create a new interview session using optimized method
      const session = await createInterviewSession({
        position: template.title,
        interview_type: template.interview_type,
        config: {
          skills: template.skills,
          difficulty: template.difficulty,
        }
      });

      if (!session) {
        throw new Error('Failed to create interview session');
      }
      if (session.id) {
        console.log("Session created", session)
      }

      toast.success(`Starting ${template.title} interview...`);

      // Navigate to avatar selection page first
      router.push(`/interview/${session.id}/setup`);

    } catch (error: any) {
      console.error('Error starting interview:', error);
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
      // Create interview session directly with 30-minute duration
      const session = await createInterviewSession({
        position: role,
        interview_type: "Technical",
        config: {
          companyInterviewConfig: {
            companyTemplateId: company.id,
            companyName: company.name,
            role: role,
            experienceLevel: 'Mid'
          }
        }
      });

      if (!session) {
        throw new Error('Failed to create interview session');
      }

      toast.success(`Starting ${role} interview at ${company.name}...`);
      router.push(`/interview/${session.id}/setup`);

    } catch (error: any) {
      console.error('Error starting company interview:', error);
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
      <div className="space-y-8">
        {/* Header Section with Controls */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="mb-2 text-3xl font-bold text-foreground">Templates</h2>
            <p className="text-muted-foreground text-sm">
              Unlock Efficiency with Ready-Made Automation.
            </p>
          </div>

          {/* Header Controls */}

        </div>

        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="general">General Templates</TabsTrigger>
            <TabsTrigger value="company">Company Templates</TabsTrigger>
          </TabsList>

          {/* Category Tabs and Search Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            {/* Category Tabs */}
            <div className="flex gap-2 items-center overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-6 py-2 rounded-full font-medium text-sm transition-all whitespace-nowrap ${activeCategory === category
                    ? "bg-black dark:bg-primary text-white dark:text-primary-foreground shadow-md"
                    : "bg-white dark:bg-card text-gray-700 dark:text-foreground border border-gray-200 dark:border-border hover:border-gray-300 dark:hover:border-muted-foreground hover:bg-gray-50 dark:hover:bg-accent"
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title, skills, or description..."
                className="pl-10 w-full md:w-80 bg-background"
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

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {filteredTemplates.map((template) => {
                    const IconComponent = getIconComponent(template.icon_name);
                    return (
                      <Card key={template.id} className="group relative flex flex-col h-full overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                        {/* Decorative gradient background at top */}
                        <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-slate-50/80 to-transparent dark:from-slate-900/50 dark:to-transparent opacity-50 pointer-events-none`} />

                        <CardContent className="p-6 flex flex-col h-full relative z-10">
                          {/* Header */}
                          <div className="flex justify-between items-start mb-5">
                            <div className="flex gap-4">
                              {/* Icon */}
                              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 p-2.5 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                                <IconComponent className={`h-7 w-7 ${template.color} dark:opacity-90`} />
                              </div>

                              <div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 leading-tight mb-1 group-hover:text-primary transition-colors">
                                  {template.title}
                                </h3>
                                <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                                  {template.interview_type}
                                </Badge>
                              </div>
                            </div>

                            <Badge className={`text-[10px] px-2 py-0.5 border ${getDifficultyColor(template.difficulty)}`}>
                              {template.difficulty}
                            </Badge>
                          </div>

                          {/* Description */}
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-6 leading-relaxed">
                            {template.description}
                          </p>

                          {/* Skills */}
                          <div className="mt-auto">
                            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-wider">
                              Key Skills
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {template.skills.slice(0, 3).map((skill, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-transparent dark:border-slate-800 font-normal"
                                >
                                  {skill}
                                </Badge>
                              ))}
                              {template.skills.length > 3 && (
                                <span className="text-xs px-1.5 py-0.5 text-slate-400 dark:text-slate-500 font-medium">
                                  +{template.skills.length - 3}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Footer / Button */}
                          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="font-medium">Verified Template</span>
                            </div>

                            <Button
                              size="sm"
                              className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white/90 shadow-sm hover:shadow transition-all rounded-lg px-4"
                              onClick={() => startInterviewWithTemplate(template)}
                              disabled={loadingTemplate === template.id}
                            >
                              {loadingTemplate === template.id ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                                  Starting...
                                </>
                              ) : (
                                <>
                                  Use Template
                                  <ArrowRight className="h-3.5 w-3.5 ml-2 opacity-70" />
                                </>
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
                <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <button
                    onClick={() => setSelectedCompany(null)}
                    className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-6"
                  >
                    <div className="h-8 w-8 rounded-full bg-card border border-border flex items-center justify-center group-hover:border-primary/50 transition-colors">
                      <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                    </div>
                    Back to companies
                  </button>

                  <div className="relative overflow-hidden rounded-3xl bg-slate-900 dark:bg-slate-950 text-white p-8 shadow-2xl">
                    {/* Decorative background elements */}
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />

                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
                      <div className="h-24 w-24 rounded-2xl bg-white p-4 shadow-lg flex items-center justify-center shrink-0">
                        {selectedCompany.logo_url ? (
                          <img
                            src={selectedCompany.logo_url}
                            alt={`${selectedCompany.name} logo`}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Briefcase className="h-10 w-10 text-slate-900" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-white">{selectedCompany.name}</h3>
                          <Badge className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm">
                            {selectedCompany.industry}
                          </Badge>
                        </div>
                        <p className="text-slate-300 text-lg max-w-2xl leading-relaxed">
                          {selectedCompany.description || `Prepare for your interview at ${selectedCompany.name} with our curated role-specific templates.`}
                        </p>
                      </div>

                      <div className="hidden md:block text-right bg-white/5 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                        <div className="text-3xl font-bold mb-1 text-white">{selectedCompany.common_roles.length}</div>
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Available Roles</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {selectedCompany.common_roles.map((role, index) => (
                    <Card key={index} className="group relative overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-6">
                          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                            <Briefcase className="h-6 w-6" />
                          </div>
                          <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            Mid-Senior
                          </Badge>
                        </div>

                        <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-primary transition-colors">
                          {role}
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2">
                          Comprehensive interview assessment for {role} position at {selectedCompany.name}.
                        </p>

                        <div className="space-y-3 mb-8">
                          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                              <Code className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                            </div>
                            <span>Technical & Behavioral</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                              <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                            </div>
                            <span>~45 Minutes Duration</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                            </div>
                            <span>AI Performance Analysis</span>
                          </div>
                        </div>

                        <Button
                          className="w-full h-11 text-base font-medium shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={() => startCompanyRoleInterview(selectedCompany, role)}
                          disabled={loadingTemplate === `${selectedCompany.id}-${role}`}
                        >
                          {loadingTemplate === `${selectedCompany.id}-${role}` ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Starting...
                            </>
                          ) : (
                            <>
                              Start Interview
                              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </>
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
    </DashboardLayout >
  );
}