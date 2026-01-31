"use client";

import React, { useEffect, useState, useMemo, ReactNode } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { profileService } from "@/services/profile.service"
import { interviewService } from "@/services/interview.service"
import { leaderboardService } from "@/services/leaderboard.service"
import { analyticsService } from "@/services/analytics.service"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { getAvatarUrl, getInitials } from "@/lib/avatar-utils"
import {
    Check, Trophy, Target, ArrowRight, ShieldCheck,
    Globe, Sparkles, TrendingUp, Award,
    Flame, History, ChevronDown, Calendar,
    Lock, Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic";

const ProfilePerformanceChart = dynamic(() => import("@/components/ProfilePerformanceChart"), {
    ssr: false,
    loading: () => <div className="h-48 sm:h-64 w-full bg-muted/20 animate-pulse rounded-2xl" />
});
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Memoized Sub-components for better performance
const StatsCircle = React.memo(({ icon }: { icon: ReactNode }) => (
    <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
        {icon}
    </div>
));
StatsCircle.displayName = "StatsCircle";

const OverviewItem = React.memo(({ icon, value, label }: { icon: ReactNode, value: string | number, label: string }) => (
    <div className="flex items-center gap-5 group">
        <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-xl group-hover:bg-white/10 transition-colors border border-transparent group-hover:border-white/5 shadow-inner shrink-0">
            {icon}
        </div>
        <div className="min-w-0">
            <div className="text-2xl font-black text-white truncate leading-none mb-1">{value}</div>
            <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest truncate">{label}</div>
        </div>
    </div>
));
OverviewItem.displayName = "OverviewItem";

const SkillProgress = React.memo(({ label, value, count }: { label: string, value: number, count?: number }) => (
    <div className="space-y-4">
        <div className="flex justify-between items-end gap-2">
            <div className="text-xs font-black text-white uppercase tracking-wider truncate">{label}</div>
            <div className="text-[10px] font-black text-primary shrink-0">{value}% {count && count > 1 && <span className="text-slate-500 ml-1">({count})</span>}</div>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 1.2, delay: 0.2, ease: "circOut" }}
                className="h-full bg-primary shadow-[0_0_15px_-5px_rgba(168,85,247,0.5)]"
            />
        </div>
    </div>
));
SkillProgress.displayName = "SkillProgress";

const CredentialItem = React.memo(({ icon, label, value }: { icon: ReactNode, label: string, value: string }) => (
    <div className="flex items-center justify-between group gap-4">
        <div className="flex items-center gap-3 shrink-0">
            <div className="opacity-50 group-hover:opacity-100 transition-opacity">{icon}</div>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{label}</span>
        </div>
        <span className="text-xs font-black text-slate-300 group-hover:text-white transition-colors uppercase tracking-tight truncate">{value}</span>
    </div>
));
CredentialItem.displayName = "CredentialItem";

const FooterLink = React.memo(({ label }: { label: string }) => (
    <Link href="/" className="text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-[0.2em]">
        {label}
    </Link>
));
FooterLink.displayName = "FooterLink";

interface SkillData {
    name: string;
    averageScore: number;
    count: number;
}

interface Profile {
    id: string;
    full_name: string;
    avatar_url?: string;
    profile_slug?: string;
    created_at: string;
    streak_count?: number;
}

interface Stats {
    averageScore?: number;
    completedCount?: number;
}

interface Interview {
    id: string;
    position: string;
    score: number | null;
    completed_at: string;
    interview_type?: string;
    difficulty?: string;
}

interface PublicProfileClientProps {
    initialProfile: Profile | null;
}

export default function PublicProfileClient({ initialProfile }: PublicProfileClientProps) {
    const { id } = useParams()
    const [loading, setLoading] = useState(!initialProfile)
    const [profile, setProfile] = useState<Profile | null>(initialProfile)
    const [stats, setStats] = useState<Stats | null>(null)
    const [recentInterviews, setRecentInterviews] = useState<Interview[]>([])
    const [rank, setRank] = useState<number | null>(null)
    const [skills, setSkills] = useState<SkillData[]>([])
    const [performanceView, setPerformanceView] = useState<'Recent' | 'Top'>('Recent')

    const handleSetRecent = React.useCallback(() => setPerformanceView('Recent'), [])
    const handleSetTop = React.useCallback(() => setPerformanceView('Top'), [])

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            if (!id) return

            try {
                if (!profile) {
                    setLoading(true)
                    const profileData = await profileService.getPublicProfile(id as string)
                    if (isMounted) {
                        setProfile(profileData as Profile)
                        if (profileData) {
                            fetchExtraData(profileData.id)
                        }
                    }
                } else {
                    fetchExtraData(profile.id)
                }
            } catch (error) {
                console.error("Error loading public profile:", error)
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        const fetchExtraData = async (userId: string) => {
            try {
                const [statsData, interviews, userRank, skillsData] = await Promise.all([
                    interviewService.getPublicSessionStats(userId),
                    interviewService.getPublicRecentInterviews(userId, 10),
                    leaderboardService.getUserRank(userId),
                    analyticsService.getSkillProgress(userId)
                ])

                if (isMounted) {
                    setStats(statsData)
                    setRecentInterviews(interviews as Interview[])
                    setRank(userRank)
                    setSkills(skillsData.slice(0, 4))
                }
            } catch (err) {
                console.error("Error fetching extra public data:", err)
            }
        }

        fetchData()
        return () => { isMounted = false; }
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
        return [...recentInterviews]
            .filter(s => s.completed_at && s.score !== null)
            .sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime())
            .map(session => ({
                time: new Date(session.completed_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
                score: Number(session.score)
            }))
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
                        <Button className="bg-primary hover:bg-primary/90 px-8 h-12 rounded-xl font-bold">
                            Go Home
                        </Button>
                    </Link>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="dark">
            <div className="min-h-screen bg-[#050814] text-white selection:bg-primary/30 p-4 sm:p-8 lg:p-12 overflow-x-hidden">
                {/* Branding Header */}
                <div className="max-w-[1400px] mx-auto mb-10 flex items-center justify-between gap-4">
                    <Link href="/" className="flex items-center gap-3 group shrink-0">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary rounded-lg blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                            <Image src="/arjuna_logo.png" alt="Arjuna AI" width={40} height={40} className="relative h-10 w-10 object-contain dark:invert-0 light:invert" />
                        </div>
                        <div>
                            <div className="text-xl font-black tracking-tighter text-white">ARJUNA AI</div>
                            <div className="text-[10px] font-bold text-primary/70 tracking-[0.2em] uppercase">The Global Interview Standard</div>
                        </div>
                    </Link>

                    <div className="hidden lg:block">
                        <p className="text-sm font-medium text-slate-500">
                            Elevate your career with <span className="text-white font-bold uppercase tracking-tight">verified AI credentials.</span>
                        </p>
                    </div>

                    <Link href="/auth">
                        <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 rounded-xl h-10 font-bold text-xs gap-2 uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-sm">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-stretch">

                        {/* LEFT COLUMN */}
                        <div className="lg:col-span-3 flex flex-col gap-6">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1">
                                <Card className="h-full bg-[#0c1221] border border-white/5 rounded-2xl overflow-hidden p-8 flex flex-col items-center text-center shadow-2xl relative">
                                    <div className="absolute top-6 right-6">
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active</span>
                                        </div>
                                    </div>

                                    <div className="mt-6 relative mb-8 group">
                                        <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary/20 rounded-full blur-2xl opacity-10 group-hover:opacity-30 transition-opacity" />
                                        <Avatar className="h-36 w-36 border-2 border-primary/20 p-2 bg-[#0c1221]">
                                            <AvatarImage
                                                src={getAvatarUrl(profile.avatar_url, profile.id, 'avataaars', null, 'male')}
                                                className="rounded-full"
                                            />
                                            <AvatarFallback className="text-4xl bg-slate-900 text-primary font-black">
                                                {getInitials(profile.full_name) || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute bottom-2 right-2 bg-primary p-2 rounded-2xl border-4 border-[#0c1221] shadow-xl">
                                            <Check className="h-5 w-5 text-primary-foreground stroke-[4px]" />
                                        </div>
                                    </div>

                                    <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter leading-none text-white break-words w-full px-2">{profile.full_name}</h2>

                                    <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary/10 border border-primary/20 rounded-2xl mb-6">
                                        <Award className="h-4 w-4 text-primary" />
                                        <span className="text-xs font-black text-primary uppercase tracking-[0.1em]">Verified Elite</span>
                                    </div>

                                    <p className="text-sm text-slate-500 mb-8 max-w-[200px] leading-relaxed">
                                        Professional tech performance verified by the Arjuna AI Engine.
                                    </p>

                                    <div className="mt-auto w-full pt-8 border-t border-white/5">
                                        <div className="flex items-center justify-center gap-2 text-primary">
                                            <Globe className="h-4 w-4 shrink-0" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] truncate">arjunaai.in/p/{profile.profile_slug || profile.id.slice(0, 8)}</span>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                <Card className="bg-[#0c1221] border border-white/5 rounded-2xl p-8 shadow-2xl">
                                    <div className="grid grid-cols-1 gap-8">
                                        <OverviewItem icon={<Trophy className="text-amber-500 h-6 w-6" />} value={rank ? `#${rank}` : "---"} label="World Rank" />
                                        <OverviewItem icon={<Target className="text-primary h-6 w-6" />} value={stats?.averageScore ? `${stats.averageScore}%` : "---"} label="Precision" />
                                        <OverviewItem icon={<Clock className="text-sky-500 h-6 w-6" />} value={stats?.completedCount || 0} label="Verified Sessions" />
                                    </div>
                                </Card>
                            </motion.div>
                        </div>

                        {/* MIDDLE COLUMN */}
                        <div className="lg:col-span-6 flex flex-col gap-6">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                <Card className="bg-[#0c1221] border border-white/5 rounded-2xl p-6 sm:p-10 shadow-2xl min-h-[500px] flex flex-col h-full">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
                                        <div className="flex items-center gap-4">
                                            <StatsCircle icon={<TrendingUp className="h-5 w-5" />} />
                                            <div>
                                                <h3 className="text-2xl font-black tracking-tight text-white">Global Performance</h3>
                                                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Live Intelligence Verification</p>
                                            </div>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full sm:w-auto bg-white/5 border-white/10 rounded-2xl h-11 px-6 gap-2 text-xs font-black uppercase tracking-widest hover:bg-white/10">
                                                    {performanceView} <ChevronDown className="h-4 w-4 text-slate-500" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="bg-[#0c1221] border-white/10 rounded-xl min-w-[140px] p-2" align="end">
                                                <DropdownMenuItem className="rounded-lg h-10 text-xs font-bold focus:bg-white/5 cursor-pointer" onClick={handleSetRecent}>
                                                    Show Recent
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="rounded-lg h-10 text-xs font-bold focus:bg-white/5 cursor-pointer" onClick={handleSetTop}>
                                                    Show Top Scores
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="flex-1 w-full mt-10 relative">
                                        <ProfilePerformanceChart data={chartData} />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12 pb-2">
                                        <AnimatePresence mode="popLayout">
                                            {sortedInterviews.length > 0 ? (
                                                sortedInterviews.slice(0, 3).map((session, i) => (
                                                    <motion.div
                                                        key={session.id || i}
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: i * 0.1 }}
                                                        className="bg-white/5 border border-white/5 rounded-3xl p-5 hover:border-primary/30 transition-all group cursor-default shadow-sm"
                                                    >
                                                        <div className="flex items-center justify-between mb-3 text-white">
                                                            <div className="text-xs font-black group-hover:text-primary transition-colors truncate w-28 uppercase">{session.position}</div>
                                                            <div className="text-sm font-black text-primary">{session.score || 0}%</div>
                                                        </div>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Badge variant="outline" className="text-[9px] font-bold border-white/10 bg-white/5 text-slate-400">
                                                                {session.interview_type || 'Tech'}
                                                            </Badge>
                                                            {session.difficulty && (
                                                                <Badge variant="outline" className="text-[9px] font-bold border-primary/20 bg-primary/5 text-primary">
                                                                    {session.difficulty}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 mb-4 font-bold uppercase tracking-wider">
                                                            {new Date(session.completed_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </div>
                                                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                                            <div className="flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all">
                                                                <Check className="h-3 w-3 text-emerald-500 stroke-[3px]" />
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verified</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Flame className="h-3.5 w-3.5 text-orange-500 fill-orange-500/20" />
                                                                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))
                                            ) : (
                                                <div className="col-span-full text-center py-12">
                                                    <History className="h-10 w-10 text-slate-500 mx-auto mb-4 opacity-20" />
                                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">No completed interviews</p>
                                                </div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </Card>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                <Card className="bg-[#0c1221] border border-white/5 rounded-2xl p-10 shadow-2xl flex-1">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-xl font-black tracking-tight text-white">Expertise Matrix</h3>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Weighted assessment matrix</p>
                                        </div>
                                        <Sparkles className="h-6 w-6 text-primary opacity-20" />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                                        {skills.length > 0 ? (
                                            skills.map(skill => (
                                                <SkillProgress key={skill.name} label={skill.name} value={skill.averageScore} count={skill.count} />
                                            ))
                                        ) : (
                                            <div className="col-span-full py-4 text-center">
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No verified expertise found</p>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </motion.div>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="lg:col-span-3 flex flex-col gap-6">
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                <Card className="bg-[#0c1221] border border-white/5 rounded-2xl p-8 shadow-2xl">
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 mb-8">System Credentials</h3>
                                    <div className="space-y-6">
                                        <CredentialItem icon={<History className="text-primary h-4 w-4" />} label="Engine" value="v3.1 Elite" />
                                        <CredentialItem icon={<ShieldCheck className="text-primary h-4 w-4" />} label="Proof" value="Verified" />
                                        <CredentialItem icon={<Trophy className="text-primary h-4 w-4" />} label="Global Tier" value="Professional" />
                                        <CredentialItem icon={<Calendar className="text-primary h-4 w-4" />} label="Joined" value={new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} />
                                    </div>
                                </Card>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex-1">
                                <Card className="h-full bg-gradient-to-br from-primary/10 via-blue-600/5 to-purple-500/10 border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden group hover:border-primary/40 transition-all duration-500 text-center flex flex-col items-center justify-center">
                                    <Sparkles className="h-10 w-10 text-primary mb-6 animate-pulse" />
                                    <h3 className="text-xl font-black leading-[1.3] mb-8 text-white">
                                        Ready to build your <br /> <span className="text-primary">verified track record?</span>
                                    </h3>
                                    <Link href="/auth" className="w-full">
                                        <Button className="w-full bg-primary hover:bg-primary/90 rounded-2xl h-14 font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95">
                                            Start Interview
                                        </Button>
                                    </Link>
                                    <p className="text-[10px] font-bold text-slate-500 mt-6 uppercase tracking-widest leading-relaxed">
                                        Join 10,000+ elite engineers on the Arjuna engine.
                                    </p>
                                </Card>
                            </motion.div>
                        </div>

                    </div>

                    <footer className="mt-24 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-700 pb-12">
                        <div className="flex items-center gap-4">
                            <Image src="/arjuna_logo.png" alt="" width={24} height={24} className="h-6 w-6 dark:invert-0 light:invert" />
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                                © {new Date().getFullYear()} ARJUNA AI PLATFORM
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-8">
                            <FooterLink label="Trust Center" />
                            <FooterLink label="Verification API" />
                            <FooterLink label="About Engine" />
                        </div>
                    </footer>
                </main>
            </div>
        </div>
    )
}

