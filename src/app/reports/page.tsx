"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
import { useAuth } from "@/contexts/AuthContext";
import {
  FileText,
  Calendar,
  Clock,
  TrendingUp,
  Eye,
  Trash2,
  Download,
  Filter,
  Search,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface InterviewSession {
  id: string;
  interview_type: string;
  position: string;
  score: number | null;
  status: string;
  created_at: string;
  duration_minutes: number | null;
  feedback?: any;
}

export default function Reports() {
  const router = useRouter();
  const { user } = useAuth();
  const { fetchSessions, deleteInterviewSession, isCached } = useOptimizedQueries();

  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await fetchSessions();
      setSessions(data || []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to load interview reports");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    try {
      await deleteInterviewSession(sessionId);
      toast.success("Report deleted successfully");
      // Remove from local state
      setSessions(sessions.filter((s) => s.id !== sessionId));
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete report");
    }
  };

  const handleViewReport = (sessionId: string) => {
    router.push(`/reports/${sessionId}`);
  };

  // Filter and sort sessions
  const filteredSessions = sessions
    .filter((session) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        session.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.interview_type.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus =
        filterStatus === "all" ||
        session.status === filterStatus;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === "score") {
        return (b.score || 0) - (a.score || 0);
      } else if (sortBy === "position") {
        return a.position.localeCompare(b.position);
      }
      return 0;
    });

  // Calculate statistics
  const stats = {
    total: sessions.length,
    completed: sessions.filter((s) => s.status === "completed").length,
    inProgress: sessions.filter((s) => s.status !== "completed").length,
    averageScore: sessions.length > 0
      ? Math.round(
        sessions
          .filter((s) => s.score !== null)
          .reduce((acc, s) => acc + (s.score || 0), 0) /
        sessions.filter((s) => s.score !== null).length || 1
      )
      : 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            <AlertCircle className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-gray-400";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading reports...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Interview Reports
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              View insights and analysis from your interviews
            </p>
          </div>
          {isCached.sessions && (
            <Badge variant="outline" className="w-fit">
              📦 Cached
            </Badge>
          )}
        </div>

        {/* Statistics Cards */}
        {sessions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Interviews
                    </p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      {stats.total}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Completed
                    </p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      {stats.completed}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      In Progress
                    </p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      {stats.inProgress}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Average Score
                    </p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      {stats.averageScore}%
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        {sessions.length > 0 && (
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by position or type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Status Filter */}
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort By */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date (Newest)</SelectItem>
                    <SelectItem value="score">Score (Highest)</SelectItem>
                    <SelectItem value="position">Position (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reports List */}
        {filteredSessions.length === 0 ? (
          <Card className="border-none shadow-md bg-card">
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                {sessions.length === 0
                  ? "No Interview Reports Yet"
                  : "No Matching Reports"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {sessions.length === 0
                  ? "Complete your first interview to see detailed reports and analytics here."
                  : "Try adjusting your search or filter criteria."}
              </p>
              {sessions.length === 0 && (
                <Button onClick={() => router.push("/dashboard")}>
                  Start New Interview
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredSessions.map((session) => (
              <Card
                key={session.id}
                className="border-none shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Left Section: Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground mb-1">
                            {session.position}
                          </h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {session.interview_type.replace("_", " ")}
                          </p>
                        </div>
                        {getStatusBadge(session.status)}
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(session.created_at).toLocaleDateString()}
                        </div>
                        {session.duration_minutes && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {session.duration_minutes} min
                          </div>
                        )}
                        {session.score !== null && (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            <span className={`font-semibold ${getScoreColor(session.score)}`}>
                              {session.score}% Match
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Section: Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleViewReport(session.id)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Report
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Report</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this interview report for{" "}
                              <strong>{session.position}</strong>? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(session.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
