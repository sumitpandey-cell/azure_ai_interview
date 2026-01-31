'use client'

import { useEffect, useState, useMemo } from "react"
import Image from "next/image"
import { useParams } from "next/navigation"
import { profileService } from "@/services/profile.service"
import { interviewService } from "@/services/interview.service"
import { leaderboardService } from "@/services/leaderboard.service"
import { analyticsService } from "@/services/analytics.service"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getAvatarUrl, getInitials } from "@/lib/avatar-utils"
import {
    Check, Trophy, Target, ArrowRight, ShieldCheck,
    Globe, Sparkles, TrendingUp, Award,
    Flame, History, ChevronDown, Calendar,
    Lock,
    Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from "recharts"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SkillData {
    name: string;
    averageScore: number;
    count: number;
}

interface ProfileData {
    id: string;
    full_name: string;
    avatar_url?: string;
    profile_slug?: string;
    created_at: string;
    streak_count?: number;
}

interface InterviewSession {
    id: string;
    position: string;
    score: number | null;
    completed_at: string;
    interview_type?: string;
    difficulty?: string;
}

interface ProfileStats {
    averageScore?: number;
    completedCount?: number;
}

interface PublicProfileClientProps {
    initialProfile: ProfileData | null;
}

export default function PublicProfileClient({ initialProfile }: PublicProfileClientProps) {
    const { id } = useParams()
    const [loading, setLoading] = useState(!initialProfile)
    const [profile, setProfile] = useState<ProfileData | null>(initialProfile)
    const [stats, setStats] = useState<ProfileStats | null>(null)
    const [recentInterviews, setRecentInterviews] = useState<InterviewSession[]>([])
    const [rank, setRank] = useState<number | null>(null)
    const [skills, setSkills] = useState<SkillData[]>([])
    const [performanceView, setPerformanceView] = useState<'Recent' | 'Top'>('Recent')

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return

            try {
                if (!profile) {
                    setLoading(true)
                    const profileData = await profileService.getPublicProfile(id as string)
                    setProfile(profileData as ProfileData)

                    if (profileData) {
                        fetchExtraData(profileData.id)
                    }
                } else {
                    fetchExtraData(profile.id)
                }
            } catch (error) {
                console.error("Error loading public profile:", error)
            } finally {
                setLoading(false)
            }
        }

        const fetchExtraData = async (userId: string) => {
            const [statsData, interviews, userRank, skillsData] = await Promise.all([
                interviewService.getPublicSessionStats(userId),
                interviewService.getPublicRecentInterviews(userId, 10),
                leaderboardService.getUserRank(userId),
                analyticsService.getSkillProgress(userId)
            ])

            setStats(statsData)
            setRecentInterviews(interviews as InterviewSession[])
            setRank(userRank)
            setSkills(skillsData.slice(0, 4)) // Top 4 skills
        }

        fetchData()
    }, [id, profile])

    const sortedInterviews = useMemo(() => {
        const interviews = [...recentInterviews]
        if (performanceView === 'Top') {
            return interviews.sort((a, b) => (b.score || 0) - (a.score || 0))
        }
        return interviews.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
    }, [recentInterviews, performanceView])

    const chartData = useMemo(() => {
        if (!recentInterviews.length) {
            return []
        }

        // Get interviews with valid completed_at dates, sorted by date
        const validInterviews = [...recentInterviews]
            .filter(session => session.completed_at && session.score !== null && session.score !== undefined)
            .sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime())
            .map(session => ({
                time: new Date(session.completed_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
                score: session.score
            }))

        return validInterviews
    }, [recentInterviews])

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-[1400px] space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <Skeleton className="lg:col-span-3 h-[800px] rounded-2xl" />
                        <Skeleton className="lg:col-span-6 h-[800px] rounded-2xl" />
                        <Skeleton className="lg:col-span-3 h-[800px] rounded-2xl" />
                    </div>
                </div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <div
                    className="bg-card p-12 rounded-2xl border shadow-xl backdrop-blur-2xl max-w-lg opacity-0 animate-in fade-in zoom-in-95 duration-500 fill-mode-forwards"
                >
                    <Lock className="h-20 w-20 text-muted-foreground mx-auto mb-6 opacity-20" />
                    <h1 className="text-3xl font-bold text-foreground mb-3">Profile Protected</h1>
                    <p className="text-muted-foreground mb-8">This interview profile is either private or does not exist on our platform.</p>
                    <Link href="/">
                        <Button className="bg-primary hover:bg-primary/90 px-8 h-12 rounded-xl font-bold text-primary-foreground">
                            Go Home
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 p-3 sm:p-5 md:p-6 lg:p-8 overflow-x-hidden">
            <div className="max-w-[1400px] mx-auto mb-6 sm:mb-8 flex items-center justify-between gap-3">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary rounded-lg blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                        <Image src="/arjuna_logo.png" alt="Arjuna AI" width={40} height={40} className="relative h-8 w-8 sm:h-10 sm:w-10 object-contain dark:invert-0 light:invert-[0.1]" />
                    </div>
                    <div>
                        <div className="text-lg sm:text-xl font-black tracking-tighter text-foreground">ARJUNA AI</div>
                        <div className="text-[9px] sm:text-[10px] font-bold text-primary tracking-[0.2em] uppercase">The Global Interview Standard</div>
                    </div>
                </Link>

                <div className="hidden sm:block">
                    <p className="text-sm font-bold text-muted-foreground tracking-tight">
                        Standardize your talent with <span className="text-foreground font-black uppercase tracking-[0.05em]">verified AI credentials.</span>
                    </p>
                </div>

                <Link href="/auth">
                    <Button variant="outline" className="border-border bg-card hover:bg-muted rounded-xl h-9 sm:h-10 px-3 sm:px-4 font-black text-[10px] sm:text-xs gap-2 uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-sm">
                        Claim My Rank <ArrowRight className="h-3 w-3" />
                    </Button>
                </Link>
            </div>

            {/* Background Texture */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/3 rounded-full blur-[150px]" />
            </div>

            <main className="relative z-10 max-w-[1400px] mx-auto">
                {/* Responsive Grid System */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">

                    {/* LEFT COLUMN - Profile Summary */}
                    <div className="md:col-span-2 lg:col-span-3">
                        {/* Profile Info Card */}
                        <div className="opacity-0 animate-in fade-in slide-in-from-bottom-5 duration-500 fill-mode-forwards">
                            <Card className="h-full bg-card border border-border rounded-2xl overflow-hidden p-5 sm:p-6 md:p-8 flex flex-col items-center text-center shadow-xl relative">
                                <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-full border border-border">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Network Active</span>
                                    </div>
                                </div>

                                <div className="mt-4 sm:mt-6 relative mb-6 sm:mb-8 group">
                                    <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary/20 rounded-full blur-2xl opacity-10 group-hover:opacity-30 transition-opacity" />
                                    <Avatar className="h-24 w-24 sm:h-32 md:h-36 sm:w-32 md:w-36 border-2 border-primary/20 p-1.5 sm:p-2 bg-background">
                                        <AvatarImage
                                            src={getAvatarUrl(profile.avatar_url, profile.id, 'avataaars', null, 'male')}
                                            className="rounded-full"
                                        />
                                        <AvatarFallback className="text-2xl sm:text-3xl md:text-4xl bg-muted text-primary font-black">
                                            {getInitials(profile.full_name) || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-primary p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-card shadow-xl">
                                        <Check className="h-3 w-3 sm:h-5 sm:w-5 text-primary-foreground stroke-[3px] sm:stroke-[4px]" />
                                    </div>
                                </div>

                                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 sm:mb-4 uppercase tracking-tighter leading-none text-foreground break-words w-full px-2">{profile.full_name}</h2>

                                <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 bg-primary/10 border border-primary/20 rounded-xl sm:rounded-2xl mb-5 sm:mb-6">
                                    <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" strokeWidth={3} />
                                    <span className="text-[10px] sm:text-xs font-black text-primary uppercase tracking-[0.1em]">Verified Elite</span>
                                </div>

                                <p className="text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-8 max-w-[200px] leading-relaxed">
                                    Strategic technical performance and engineering readiness verified by the Arjuna AI Intelligence Engine.
                                </p>

                                <div className="mt-auto w-full pt-6 sm:pt-8 border-t border-border">
                                    <div className="flex items-center justify-center gap-2 text-primary overflow-hidden">
                                        <Globe className="h-3.5 w-3.5 shrink-0" />
                                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] truncate">arjunaai.in/p/{profile.profile_slug || profile.id.slice(0, 8)}</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* MIDDLE COLUMN - Main Content */}
                    <div className="md:col-span-2 lg:col-span-6 flex flex-col gap-4 sm:gap-6">
                        {/* Candidate Overview Card (Top Dashboard) */}
                        <div className="opacity-0 animate-in fade-in slide-in-from-bottom-5 duration-500 delay-100 fill-mode-forwards">
                            <Card className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xl">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4">
                                    <OverviewItem
                                        icon={<Trophy className="text-amber-500 h-5 w-5 sm:h-6 sm:w-6" />}
                                        value={rank ? `#${rank}` : "Unranked"}
                                        label="Global Rank"
                                    />
                                    <OverviewItem
                                        icon={<Target className="text-primary h-5 w-5 sm:h-6 sm:w-6" />}
                                        value={stats?.averageScore ? `${stats.averageScore}%` : "N/A"}
                                        label="Technical Precision"
                                    />
                                    <OverviewItem
                                        icon={<Clock className="text-sky-500 h-5 w-5 sm:h-6 sm:w-6" />}
                                        value={stats?.completedCount || 0}
                                        label="Verified Sessions"
                                    />
                                </div>
                            </Card>
                        </div>

                        {/* Interview Performance History Card */}
                        <div className="opacity-0 animate-in fade-in slide-in-from-bottom-5 duration-500 delay-200 fill-mode-forwards flex-1">
                            <Card className="bg-card border border-border rounded-2xl p-5 sm:p-6 md:p-8 lg:p-10 shadow-xl min-h-[450px] sm:min-h-[500px] flex flex-col h-full">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-2">
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <StatsCircle icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />} />
                                        <div>
                                            <h3 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-foreground">Global Performance</h3>
                                            <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5 sm:mt-1">Real-time Intelligence Verification</p>
                                        </div>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="w-full sm:w-auto bg-muted border-border rounded-xl h-9 sm:h-11 px-4 sm:px-6 gap-2 text-[9px] sm:text-xs font-black uppercase tracking-widest hover:bg-muted/80">
                                                {performanceView} <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="bg-card border-border rounded-xl min-w-[140px] p-2" align="end">
                                            <DropdownMenuItem className="rounded-lg h-10 text-xs font-bold focus:bg-muted cursor-pointer" onClick={() => setPerformanceView('Recent')}>
                                                Show Recent
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="rounded-lg h-10 text-xs font-bold focus:bg-muted cursor-pointer" onClick={() => setPerformanceView('Top')}>
                                                Show Top Scores
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Chart Section */}
                                <div className="flex-1 w-full mt-4 sm:mt-8 relative">
                                    {chartData.length > 0 ? (
                                        <div className="h-48 sm:h-64 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.1)" vertical={false} />
                                                    <XAxis
                                                        dataKey="time"
                                                        stroke="hsl(var(--muted-foreground) / 0.5)"
                                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9, fontWeight: 700 }}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        dy={10}
                                                    />
                                                    <YAxis
                                                        stroke="hsl(var(--muted-foreground) / 0.5)"
                                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9, fontWeight: 700 }}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        domain={[0, 100]}
                                                        ticks={[0, 50, 100]}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: 'hsl(var(--card))',
                                                            border: '1px solid hsl(var(--border))',
                                                            borderRadius: '12px',
                                                            padding: '8px 12px',
                                                            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                                                        }}
                                                        labelStyle={{ color: 'hsl(var(--primary))', fontWeight: 900, fontSize: 10, textTransform: 'uppercase' }}
                                                        itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 700, fontSize: 11 }}
                                                        formatter={(value: number) => [`${value}%`, 'Score']}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="score"
                                                        stroke="hsl(var(--primary))"
                                                        strokeWidth={2}
                                                        fill="url(#colorScore)"
                                                        animationDuration={1500}
                                                        animationEasing="ease-out"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="h-48 sm:h-64 w-full flex items-center justify-center">
                                            <div className="text-center px-4">
                                                <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-20" />
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">No interview data yet</p>
                                                <p className="text-[10px] text-muted-foreground opacity-60 mt-2">Complete interviews to see performance trends</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-10 pb-2">
                                    {sortedInterviews.length > 0 ? (
                                        <>
                                            {sortedInterviews.slice(0, 3).map((session, i) => (
                                                <div
                                                    key={session.position + session.completed_at || i}
                                                    className="bg-muted/30 border border-border rounded-2xl p-4 sm:p-5 hover:border-primary/30 transition-all group cursor-default shadow-sm opacity-0 animate-in fade-in zoom-in-95 fill-mode-forwards"
                                                    style={{ animationDelay: `${i * 100}ms` }}
                                                >
                                                    <div className="flex items-center justify-between mb-3 text-foreground">
                                                        <div className="text-[10px] sm:text-xs font-black group-hover:text-primary transition-colors truncate flex-1 uppercase">{session.position}</div>
                                                        <div className="text-xs sm:text-sm font-black text-primary ml-2">{session.score || 0}%</div>
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Badge variant="outline" className="text-[8px] sm:text-[9px] font-bold border-border bg-card text-muted-foreground px-1.5 py-0">
                                                            {session.interview_type || 'Tech'}
                                                        </Badge>
                                                        {session.difficulty && (
                                                            <Badge variant="outline" className="text-[8px] sm:text-[9px] font-bold border-primary/20 bg-primary/5 text-primary px-1.5 py-0">
                                                                {session.difficulty}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-[9px] text-muted-foreground mb-4 font-bold uppercase tracking-wider">
                                                        {new Date(session.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                    <div className="flex items-center justify-between pt-3 border-t border-border">
                                                        <div className="flex items-center gap-1 grayscale group-hover:grayscale-0 transition-all">
                                                            <Check className="h-2.5 w-2.5 text-emerald-500 stroke-[3px]" />
                                                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Verified</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            {(session.score || 0) >= 80 && <Flame className="h-3 w-3 text-orange-500 fill-orange-500/20" />}
                                                            {(session.score || 0) >= 70 && <TrendingUp className="h-3 w-3 text-primary" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <div className="col-span-full text-center py-8 sm:py-12">
                                            <History className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-20" />
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">No completed interviews</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Stats & Actions */}
                    <div className="md:col-span-2 lg:col-span-3 flex flex-col sm:grid sm:grid-cols-2 lg:flex lg:flex-col gap-4 sm:gap-6">
                        {/* System Credentials Card */}
                        <div className="opacity-0 animate-in fade-in slide-in-from-right-5 duration-500 fill-mode-forwards">
                            <Card className="bg-card border border-border rounded-2xl p-5 sm:p-6 md:p-8 shadow-xl">
                                <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 sm:mb-8">Credentials</h3>
                                <div className="space-y-4 sm:space-y-6">
                                    <CredentialItem icon={<History className="text-primary h-3.5 w-3.5" />} label="Analysis Engine" value="v3.1 Elite" />
                                    <CredentialItem icon={<ShieldCheck className="text-primary h-3.5 w-3.5" />} label="Trust Validation" value="Verified" />
                                    <CredentialItem icon={<Trophy className="text-primary h-3.5 w-3.5" />} label="Global Tier" value="Elite Pro" />
                                    <CredentialItem
                                        icon={<Calendar className="text-primary h-3.5 w-3.5" />}
                                        label="Network Entry"
                                        value={`${new Date(profile.created_at).toLocaleString('en-US', { month: 'short' })} '${new Date(profile.created_at).getFullYear().toString().slice(-2)}`}
                                    />
                                </div>
                            </Card>
                        </div>

                        {/* Expertise Matrix Card */}
                        <div className="opacity-0 animate-in fade-in slide-in-from-right-5 duration-500 delay-100 fill-mode-forwards flex-1">
                            <Card className="bg-card border border-border rounded-2xl p-5 sm:p-6 md:p-8 shadow-xl h-full">
                                <div className="flex items-center justify-between mb-6 sm:mb-8">
                                    <div>
                                        <h3 className="text-lg sm:text-xl font-black tracking-tight text-foreground">Expertise Matrix</h3>
                                        <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Weighted Assessment</p>
                                    </div>
                                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary opacity-20" strokeWidth={2.5} />
                                </div>

                                <div className="grid grid-cols-1 gap-y-6 sm:gap-y-8">
                                    {skills.length > 0 ? (
                                        skills.map((skill) => (
                                            <SkillProgress
                                                key={skill.name}
                                                label={skill.name}
                                                value={skill.averageScore}
                                                count={skill.count}
                                            />
                                        ))
                                    ) : (
                                        <div className="col-span-full text-center py-6">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">No skill data verified</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>

                </div>

                {/* Platform Footer */}
                <footer className="mt-12 sm:mt-24 pt-8 sm:pt-10 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-700 pb-10">
                    <div className="flex items-center gap-3">
                        <Image src="/arjuna_logo.png" alt="" width={20} height={20} className="h-5 w-5 sm:h-6 sm:w-6" />
                        <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-center sm:text-left">
                            © {new Date().getFullYear()} ARJUNA AI • THE FUTURE OF HIRING
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
                        <FooterLink label="Trust" />
                        <FooterLink label="Verification" />
                        <FooterLink label="Engine" />
                        <FooterLink label="Roadmap" />
                    </div>
                </footer>
            </main>
        </div>
    )
}

function StatsCircle({ icon }: { icon: React.ReactNode }) {
    return (
        <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            {icon}
        </div>
    )
}

function OverviewItem({ icon, value, label }: { icon: React.ReactNode, value: string | number, label: string }) {
    return (
        <div className="flex sm:flex-col lg:flex-row items-center sm:text-center lg:text-left gap-4 lg:gap-5 group">
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-muted flex items-center justify-center text-lg sm:text-xl group-hover:bg-muted/80 transition-colors border border-transparent group-hover:border-border shadow-inner shrink-0">
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-xl sm:text-2xl font-black text-foreground truncate">{value}</div>
                <div className="text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none sm:mt-1">{label}</div>
            </div>
        </div>
    )
}

function SkillProgress({ label, value, count }: { label: string, value: number, count?: number }) {
    return (
        <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-end gap-2">
                <div className="text-[10px] sm:text-xs font-black text-foreground uppercase tracking-wider truncate">{label}</div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <div className="text-[9px] sm:text-[10px] font-black text-primary">{value}%</div>
                    {count && count > 1 && (
                        <div className="hidden sm:block text-[8px] font-bold text-muted-foreground">({count})</div>
                    )}
                </div>
            </div>
            <div className="w-full h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-primary to-primary shadow-[0_0_15px_-5px_rgba(168,85,247,0.5)] transition-all duration-1000 ease-out fill-mode-forwards"
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    )
}

function CredentialItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
                <div className="opacity-60 group-hover:opacity-100 transition-opacity translate-y-[-1px]">{icon}</div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{label}</span>
            </div>
            <span className="text-xs font-black text-foreground/80 group-hover:text-primary transition-colors uppercase tracking-tight">{value}</span>
        </div>
    )
}

function FooterLink({ label }: { label: string }) {
    return (
        <Link href="/" className="text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-[0.2em]">
            {label}
        </Link>
    )
}
