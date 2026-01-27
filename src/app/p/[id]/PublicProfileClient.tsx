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
    Globe, Share2, Sparkles, TrendingUp, Award,
    Diamond, Flame, History, ChevronDown, Calendar,
    Lock,
    Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
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
            <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-[1400px] space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <Skeleton className="lg:col-span-3 h-[800px] bg-slate-900 rounded-2xl" />
                        <Skeleton className="lg:col-span-6 h-[800px] bg-slate-900 rounded-2xl" />
                        <Skeleton className="lg:col-span-3 h-[800px] bg-slate-900 rounded-2xl" />
                    </div>
                </div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center p-6 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-900/50 p-12 rounded-2xl border border-white/5 backdrop-blur-2xl max-w-lg"
                >
                    <Lock className="h-20 w-20 text-slate-500 mx-auto mb-6 opacity-20" />
                    <h1 className="text-3xl font-bold text-white mb-3">Profile Protected</h1>
                    <p className="text-slate-400 mb-8">This interview profile is either private or does not exist on our platform.</p>
                    <Link href="/">
                        <Button className="bg-indigo-600 hover:bg-indigo-500 px-8 h-12 rounded-xl font-bold">
                            Go Home
                        </Button>
                    </Link>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-white selection:bg-primary/30 p-3 sm:p-6 lg:p-8 overflow-x-hidden">
            {/* Platform Branding Header */}
            <div className="max-w-[1400px] mx-auto mb-6 sm:mb-8 flex items-center justify-between gap-3">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary rounded-lg blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                        <Image src="/favicon.ico" alt="Arjuna AI" width={40} height={40} className="relative h-8 w-8 sm:h-10 sm:w-10 object-contain" />
                    </div>
                    <div>
                        <div className="text-lg sm:text-xl font-black tracking-tighter text-white">ARJUNA AI</div>
                        <div className="text-[9px] sm:text-[10px] font-bold text-primary/70 tracking-[0.2em] uppercase">The Global Interview Standard</div>
                    </div>
                </Link>

                <div className="hidden sm:block">
                    <p className="text-sm font-medium text-slate-500">
                        Elevate your career with <span className="text-white font-bold">verified AI credentials.</span>
                    </p>
                </div>

                <Link href="/auth">
                    <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 rounded-xl h-9 sm:h-10 px-3 sm:px-4 font-bold text-[10px] sm:text-xs gap-2">
                        Get Your Profile <ArrowRight className="h-3 w-3" />
                    </Button>
                </Link>
            </div>

            {/* Background Texture */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/3 rounded-full blur-[150px]" />
            </div>

            <main className="relative z-10 max-w-[1400px] mx-auto">
                {/* 3-Column Grid with Alignment */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">

                    {/* LEFT COLUMN */}
                    <div className="lg:col-span-3 flex flex-col gap-4 sm:gap-6">
                        {/* Profile Info Card */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1">
                            <Card className="h-full bg-card border border-white/5 rounded-2xl sm:rounded-2xl overflow-hidden p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl relative">
                                <div className="absolute top-6 right-6">
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Public</span>
                                    </div>
                                </div>

                                <div className="mt-6 relative mb-8 group">
                                    <div className="absolute -inset-4 bg-gradient-to-r from-primary to-primary rounded-full blur-2xl opacity-10 group-hover:opacity-30 transition-opacity" />
                                    <Avatar className="h-28 w-28 sm:h-36 sm:w-36 border-2 border-primary/20 p-2 bg-card">
                                        <AvatarImage
                                            src={getAvatarUrl(profile.avatar_url, profile.id, 'avataaars', null, 'male')}
                                            className="rounded-full"
                                        />
                                        <AvatarFallback className="text-3xl sm:text-4xl bg-slate-900 text-primary font-black">
                                            {getInitials(profile.full_name) || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute bottom-2 right-2 bg-primary p-2 rounded-2xl border-4 border-card shadow-xl">
                                        <Check className="h-5 w-5 text-black stroke-[4px]" />
                                    </div>
                                </div>

                                <h2 className="text-3xl sm:text-4xl font-black mb-3 sm:mb-4 uppercase tracking-tighter leading-none">{profile.full_name}</h2>

                                <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary/10 border border-primary/20 rounded-2xl mb-6">
                                    <Award className="h-4 w-4 text-primary" />
                                    <span className="text-xs font-black text-primary uppercase tracking-[0.1em]">Verified Elite</span>
                                </div>

                                <p className="text-sm text-slate-500 mb-8 max-w-[200px]">
                                    Professional tech performance verified by the Arjuna AI Engine.
                                </p>

                                <div className="mt-auto w-full pt-8 border-t border-white/5">
                                    <div className="flex items-center justify-center gap-2 text-primary">
                                        <Globe className="h-4 w-4" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">arjuna.ai/p/{profile.profile_slug || profile.id.slice(0, 8)}</span>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Candidate Overview Card */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <Card className="bg-card border border-white/5 rounded-2xl sm:rounded-2xl p-6 sm:p-8 shadow-2xl">
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 mb-8">Candidate Overview</h3>
                                <div className="space-y-6 sm:space-y-8">
                                    <OverviewItem
                                        icon={<Trophy className="text-yellow-500" />}
                                        value={rank ? `#${rank}` : "Unranked"}
                                        label="WORLD RANK"
                                    />
                                    <OverviewItem
                                        icon={<Target className="text-primary" />}
                                        value={stats?.averageScore ? `${stats.averageScore}%` : "N/A"}
                                        label="PRECISION"
                                    />
                                    <OverviewItem
                                        icon={<Clock className="text-blue-400" />}
                                        value={stats?.completedCount || 0}
                                        label="INTERVIEWS"
                                    />
                                </div>
                            </Card>
                        </motion.div>
                    </div>

                    {/* MIDDLE COLUMN */}
                    <div className="lg:col-span-6 flex flex-col gap-4 sm:gap-6">
                        {/* Interview Performance History Card */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <Card className="bg-card border border-white/5 rounded-2xl sm:rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl min-h-[500px] flex flex-col">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-4">
                                        <StatsCircle icon={<TrendingUp className="h-5 w-5" />} />
                                        <div>
                                            <h3 className="text-xl sm:text-2xl font-black tracking-tight">Interview Performance</h3>
                                            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Live AI Verification Ledger</p>
                                        </div>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="bg-white/5 border-white/10 rounded-xl sm:rounded-2xl h-10 sm:h-11 px-4 sm:px-6 gap-2 text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-white/10">
                                                {performanceView} <ChevronDown className="h-4 w-4 text-slate-500" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="bg-[#0c1221] border-white/10 rounded-xl min-w-[140px] p-2">
                                            <DropdownMenuItem className="rounded-lg h-10 text-xs font-bold focus:bg-white/5 cursor-pointer" onClick={() => setPerformanceView('Recent')}>
                                                Show Recent
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="rounded-lg h-10 text-xs font-bold focus:bg-white/5 cursor-pointer" onClick={() => setPerformanceView('Top')}>
                                                Show Top Scores
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Chart Section */}
                                <div className="flex-1 w-full mt-6 sm:mt-8 md:mt-10 relative">
                                    {chartData.length > 0 ? (
                                        <div className="h-64 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                                    <defs>
                                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="rgb(168, 85, 247)" stopOpacity={0.8} />
                                                            <stop offset="95%" stopColor="rgb(168, 85, 247)" stopOpacity={0.1} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                    <XAxis
                                                        dataKey="time"
                                                        stroke="rgba(148, 163, 184, 0.5)"
                                                        tick={{ fill: 'rgba(148, 163, 184, 0.7)', fontSize: 11, fontWeight: 700 }}
                                                        tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                                    />
                                                    <YAxis
                                                        stroke="rgba(148, 163, 184, 0.5)"
                                                        tick={{ fill: 'rgba(148, 163, 184, 0.7)', fontSize: 11, fontWeight: 700 }}
                                                        tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                                        domain={[0, 100]}
                                                        ticks={[0, 25, 50, 75, 100]}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                                            border: '1px solid rgba(168, 85, 247, 0.3)',
                                                            borderRadius: '12px',
                                                            padding: '8px 12px',
                                                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                                                        }}
                                                        labelStyle={{ color: 'rgba(168, 85, 247, 1)', fontWeight: 900, fontSize: 11, textTransform: 'uppercase' }}
                                                        itemStyle={{ color: 'white', fontWeight: 700, fontSize: 12 }}
                                                        formatter={(value: number) => [`${value}%`, 'Score']}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="score"
                                                        stroke="rgb(168, 85, 247)"
                                                        strokeWidth={3}
                                                        fill="url(#colorScore)"
                                                        animationDuration={1500}
                                                        animationEasing="ease-out"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="h-64 w-full flex items-center justify-center">
                                            <div className="text-center">
                                                <TrendingUp className="h-12 w-12 text-slate-700 mx-auto mb-4 opacity-20" />
                                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">No interview data yet</p>
                                                <p className="text-xs text-slate-600 mt-2">Complete interviews to see performance trends</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Session Ledger Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-8 sm:mt-10 md:mt-12 pb-2">
                                    {sortedInterviews.length > 0 ? (
                                        <AnimatePresence mode="popLayout">
                                            {sortedInterviews.slice(0, 3).map((session, i) => (
                                                <motion.div
                                                    key={session.position + session.completed_at || i}
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    className="bg-white/5 border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-5 hover:border-primary/30 transition-all group cursor-default"
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="text-xs font-black text-white group-hover:text-primary transition-colors truncate flex-1 uppercase">{session.position}</div>
                                                        <div className="text-sm font-black text-primary ml-2">{session.score || 0}%</div>
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Badge variant="outline" className="text-[9px] font-bold border-white/10 bg-white/5 text-slate-400">
                                                            {session.interview_type || 'Technical'}
                                                        </Badge>
                                                        {session.difficulty && (
                                                            <Badge variant="outline" className="text-[9px] font-bold border-primary/20 bg-primary/5 text-primary">
                                                                {session.difficulty}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 mb-4 font-bold uppercase tracking-wider">
                                                        {new Date(session.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                                        <div className="flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all">
                                                            <Check className="h-3 w-3 text-emerald-500 stroke-[3px]" />
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verified</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {(session.score || 0) >= 80 && <Flame className="h-3.5 w-3.5 text-orange-500 fill-orange-500/20" />}
                                                            {(session.score || 0) >= 70 && <TrendingUp className="h-3.5 w-3.5 text-primary" />}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    ) : (
                                        <div className="col-span-full text-center py-12">
                                            <History className="h-12 w-12 text-slate-700 mx-auto mb-4 opacity-20" />
                                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">No completed interviews</p>
                                            <p className="text-xs text-slate-600 mt-2">Interview history will appear here</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </motion.div>

                        {/* Skills & Expertise Card */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <Card className="bg-card border border-white/5 rounded-2xl sm:rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-lg sm:text-xl font-black tracking-tight">Skills & Expertise</h3>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Weighted assessment matrix</p>
                                    </div>
                                    <Sparkles className="h-6 w-6 text-primary opacity-20" />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 sm:gap-x-12 md:gap-x-16 gap-y-6 sm:gap-y-8 md:gap-y-10">
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
                                        <div className="col-span-full text-center py-8">
                                            <Sparkles className="h-10 w-10 text-slate-700 mx-auto mb-3 opacity-20" />
                                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">No skill data available</p>
                                            <p className="text-xs text-slate-600 mt-2">Skills will be assessed through interviews</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="lg:col-span-3 flex flex-col gap-4 sm:gap-6">
                        {/* System Credentials Card */}
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <Card className="bg-card border border-white/5 rounded-2xl sm:rounded-2xl p-6 sm:p-8 shadow-2xl">
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 mb-8">System Credentials</h3>
                                <div className="space-y-6">
                                    <CredentialItem icon={<History className="text-primary" />} label="Engine" value="ArjunaAI v3.1" />
                                    <CredentialItem icon={<ShieldCheck className="text-primary" />} label="Proof" value="Crypto-Secure" />
                                    <CredentialItem icon={<Trophy className="text-primary" />} label="Tier" value="Professional" />
                                    <CredentialItem icon={<Calendar className="text-primary" />} label="Joined" value={new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} />
                                </div>
                            </Card>
                        </motion.div>

                        {/* Claim My Profile Card - Fixed Streak */}
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                            <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 border border-white/10 rounded-2xl sm:rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden group hover:border-primary/40 transition-all duration-500">
                                <div className="absolute top-[-20%] right-[-20%] w-48 h-48 bg-primary/20 rounded-full blur-[80px] group-hover:scale-125 transition-transform duration-700" />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl sm:text-2xl font-black tracking-tight">Claim Profile</h3>
                                        <Diamond className="h-7 w-7 text-blue-400 drop-shadow-[0_0_12px_rgba(96,165,250,0.8)] animate-pulse" />
                                    </div>
                                    <p className="text-[10px] text-primary/50 uppercase tracking-[0.2em] mb-8 font-black">Digital verification asset</p>

                                    <div className="w-full h-2 bg-white/5 rounded-full mb-4 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min((profile.streak_count || 0) * 10, 100)}%` }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            className="h-full bg-gradient-to-r from-primary to-primary rounded-full shadow-[0_0_15px_rgba(168,85,247,0.6)]"
                                        />
                                    </div>
                                    <div className="text-[11px] font-black uppercase tracking-[0.1em] text-white/80">
                                        {profile.streak_count || 0} DAY{profile.streak_count !== 1 ? 'S' : ''} PERSISTENCE
                                    </div>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Profile Actions Card */}
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                            <Card className="bg-card border border-white/5 rounded-2xl sm:rounded-2xl p-6 sm:p-8 shadow-2xl">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-6 text-center">Profile Actions</h3>
                                <div className="flex flex-col gap-3">
                                    <Button className="w-full bg-[#1e293b] hover:bg-[#334155] border-white/5 rounded-2xl h-12 text-xs font-black uppercase tracking-widest gap-2 transition-all active:scale-95">
                                        <Share2 className="h-4 w-4" /> Share Credentials
                                    </Button>
                                    <Link href="/auth" className="w-full">
                                        <Button className="w-full bg-[#1e1b4b] hover:bg-[#312e81] border border-[#312e81] text-primary rounded-2xl h-12 text-xs font-black uppercase tracking-widest transition-all active:scale-95">
                                            Manage Profile
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Final Platforms CTA */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex-1 min-h-[220px]">
                            <Card className="h-full bg-card border border-primary/20 rounded-2xl sm:rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl text-center flex flex-col items-center justify-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <h3 className="text-base sm:text-lg font-black leading-[1.3] mb-6 sm:mb-8 relative z-10 px-2">
                                    Ready to build your <br /> <span className="text-primary">verified track record?</span>
                                </h3>
                                <Link href="/auth" className="w-full relative z-10">
                                    <Button className="w-full bg-gradient-to-r from-primary to-primary hover:from-primary/90 hover:to-primary/90 rounded-[1.2rem] h-14 font-black text-sm uppercase tracking-widest shadow-[0_10px_30px_-10px_rgba(168,85,247,0.5)] transition-all active:scale-95 group/btn">
                                        Start Interview
                                        <Sparkles className="ml-2 h-4 w-4 group-hover/btn:rotate-12 transition-transform" />
                                    </Button>
                                </Link>
                                <p className="text-[10px] font-bold text-slate-500 mt-6 uppercase tracking-widest leading-relaxed">
                                    Join 10,000+ elite engineers <br /> on the Arjuna platform.
                                </p>
                            </Card>
                        </motion.div>
                    </div>

                </div>

                {/* Platform Footer */}
                <footer className="mt-24 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
                    <div className="flex items-center gap-4">
                        <Image src="/favicon.ico" alt="" width={24} height={24} className="h-6 w-6" />
                        <div className="text-[10px] font-black uppercase tracking-[0.2em]">
                            © {new Date().getFullYear()} ARJUNA AI PLATFORM • THE FUTURE OF TECH HIRING
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-8">
                        <FooterLink label="Trust Center" />
                        <FooterLink label="Verification API" />
                        <FooterLink label="About Engine" />
                        <FooterLink label="Career Roadmap" />
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
        <div className="flex items-center gap-5 group">
            <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-xl group-hover:bg-white/10 transition-colors border border-transparent group-hover:border-white/5 shadow-inner">
                {icon}
            </div>
            <div>
                <div className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">{value}</div>
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{label}</div>
            </div>
        </div>
    )
}

function SkillProgress({ label, value, count }: { label: string, value: number, count?: number }) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-end">
                <div className="text-xs font-black text-white uppercase tracking-wider">{label}</div>
                <div className="flex items-center gap-2">
                    <div className="text-[10px] font-black text-primary">{value}% Accuracy</div>
                    {count && count > 1 && (
                        <div className="text-[9px] font-bold text-slate-500">({count} tests)</div>
                    )}
                </div>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 1.2, delay: 0.2, ease: "circOut" }}
                    className="h-full bg-gradient-to-r from-primary to-primary shadow-[0_0_15px_-5px_rgba(168,85,247,0.5)]"
                />
            </div>
        </div>
    )
}

function CredentialItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
                <div className="opacity-50 group-hover:opacity-100 transition-opacity">{icon}</div>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{label}</span>
            </div>
            <span className="text-xs font-black text-slate-300 group-hover:text-white transition-colors uppercase tracking-tight">{value}</span>
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
