import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Award, AlertCircle, BarChart3, Target, Zap } from 'lucide-react';

interface AnalysisData {
    total_interviews: number;
    average_score: number;
    completion_rate: number;
    strengths: string[];
    weaknesses: string[];
    trend: 'improving' | 'stable' | 'declining';
}

interface RoadmapOverviewProps {
    data: AnalysisData;
}

export function RoadmapOverview({ data }: RoadmapOverviewProps) {
    if (!data) {
        return null;
    }

    const getTrendIcon = () => {
        switch (data.trend) {
            case 'improving':
                return <TrendingUp className="w-5 h-5 text-emerald-500" />;
            case 'declining':
                return <TrendingDown className="w-5 h-5 text-rose-500" />;
            default:
                return <Minus className="w-5 h-5 text-amber-500" />;
        }
    };

    const getTrendColor = () => {
        switch (data.trend) {
            case 'improving':
                return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'declining':
                return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
            default:
                return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        }
    };

    const getTrendLabelColor = () => {
        switch (data.trend) {
            case 'improving':
                return 'text-emerald-600 dark:text-emerald-400';
            case 'declining':
                return 'text-rose-600 dark:text-rose-400';
            default:
                return 'text-amber-600 dark:text-amber-400';
        }
    };

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    {
                        label: 'Total Interviews',
                        value: data.total_interviews,
                        icon: <BarChart3 className="w-5 h-5 text-blue-500" />,
                        description: 'Sessions completed',
                        gradient: 'from-blue-500/5 to-blue-600/5'
                    },
                    {
                        label: 'Average Score',
                        value: `${data.average_score}%`,
                        icon: <Target className="w-5 h-5 text-purple-500" />,
                        description: 'Overall proficiency',
                        gradient: 'from-purple-500/5 to-purple-600/5'
                    },
                    {
                        label: 'Performance Trend',
                        value: data.trend,
                        icon: getTrendIcon(),
                        description: 'Recent growth pattern',
                        gradient: 'from-orange-500/5 to-orange-600/5',
                        customValueClass: `capitalize ${getTrendLabelColor()}`
                    }
                ].map((stat, i) => (
                    <Card key={i} className={`glass-card hover-lift relative overflow-hidden border-none bg-gradient-to-br ${stat.gradient} backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 ring-1 ring-black/5 dark:ring-white/5`}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                                <div className="p-2 rounded-xl bg-white dark:bg-black/20 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                                    {stat.icon}
                                </div>
                            </div>
                            <CardTitle className={`text-3xl font-bold mt-2 ${stat.customValueClass || ''}`}>
                                {stat.value}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground font-medium">
                                {stat.description}
                            </p>
                        </CardContent>
                        {/* Decorative background element */}
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-current opacity-[0.03] rounded-full blur-2xl pointer-events-none" />
                    </Card>
                ))}
            </div>

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
                {/* Strengths */}
                <Card className="glass-card hover-lift border-none shadow-sm ring-1 ring-black/5 dark:ring-white/5 bg-emerald-50/30 dark:bg-emerald-950/10">
                    <CardHeader className="border-b border-emerald-100/50 dark:border-emerald-900/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                <Award className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold">Key Strengths</CardTitle>
                                <p className="text-sm text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">Where you're excelling right now</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid gap-3">
                            {data.strengths?.length > 0 ? (
                                data.strengths.map((strength, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-3.5 rounded-2xl bg-white dark:bg-black/20 border border-emerald-100/50 dark:border-emerald-900/50 group hover:scale-[1.01] transition-all">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                                            <Zap className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <span className="text-sm font-medium leading-tight">{strength}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground p-4 text-center border-2 border-dashed rounded-2xl">
                                    Continue through sessions to reveal your strengths.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Areas for Growth */}
                <Card className="border-none shadow-sm ring-1 ring-black/5 dark:ring-white/5 bg-amber-50/30 dark:bg-amber-950/10">
                    <CardHeader className="border-b border-amber-100/50 dark:border-amber-900/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold">Priority Growth Areas</CardTitle>
                                <p className="text-sm text-amber-600/70 dark:text-amber-400/70 mt-0.5">Focus areas to boost your career</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid gap-3">
                            {data.weaknesses?.length > 0 ? (
                                data.weaknesses.map((weakness, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-3.5 rounded-2xl bg-white dark:bg-black/20 border border-amber-100/50 dark:border-amber-900/50 group hover:scale-[1.01] transition-all">
                                        <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:bg-amber-500/20 transition-colors">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                                        </div>
                                        <span className="text-sm font-medium leading-tight">{weakness}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground p-4 text-center border-2 border-dashed rounded-2xl">
                                    No major weaknesses identified yet. Keep it up!
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
