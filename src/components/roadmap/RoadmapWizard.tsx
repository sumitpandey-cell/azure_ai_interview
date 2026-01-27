'use client';

import React, { useState } from 'react';
import {
    ChevronRight,
    ChevronLeft,
    Sparkles,
    Code,
    BarChart,
    Palette,
    Briefcase,
    Target,
    Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface RoadmapWizardProps {
    onGenerate: (data: { domain: string; role: string; level: string }) => void;
    isLoading: boolean;
}

const DOMAINS = [
    { id: 'Technical', title: 'Software Engineering', icon: Code, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'Marketing', title: 'Marketing & Sales', icon: BarChart, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'Creative', title: 'Design & Creative', icon: Palette, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { id: 'Behavioral', title: 'Product & HR', icon: Briefcase, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'General', title: 'General Career', icon: Target, color: 'text-green-500', bg: 'bg-green-500/10' },
];

const LEVELS = [
    { id: 'Junior', title: 'Junior', desc: '0-2 years of experience' },
    { id: 'Intermediate', title: 'Intermediate', desc: '2-5 years of experience' },
    { id: 'Senior', title: 'Senior', desc: '5-8 years of experience' },
    { id: 'Staff', title: 'Lead / Staff', desc: '8+ years of experience' },
];

export function RoadmapWizard({ onGenerate, isLoading }: RoadmapWizardProps) {
    const [step, setStep] = useState(1);
    const [domain, setDomain] = useState('');
    const [role, setRole] = useState('');
    const [level, setLevel] = useState('Intermediate');

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const isStep2Valid = role.length >= 3;
    const isStep3Valid = !!level;

    return (
        <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Progress Bar */}
            <div className="flex gap-2 mb-8">
                {[1, 2, 3].map((s) => (
                    <div
                        key={s}
                        className={cn(
                            "h-1.5 flex-1 rounded-full transition-all duration-500",
                            step >= s ? "bg-primary" : "bg-muted"
                        )}
                    />
                ))}
            </div>

            <Card className="border-border/60 shadow-xl shadow-primary/5 rounded-2xl overflow-hidden backdrop-blur-sm bg-card/50">
                <CardContent className="p-8">
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 uppercase tracking-widest text-[10px] py-1 px-3">Step 1: Domain Selection</Badge>
                                <h3 className="text-2xl font-bold tracking-tight">What is your primary domain?</h3>
                                <p className="text-muted-foreground text-sm">Select the field you want to master interviews for.</p>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {DOMAINS.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                setDomain(item.id);
                                                handleNext();
                                            }}
                                            className={cn(
                                                "flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                                                domain === item.id
                                                    ? "border-primary bg-primary/5 shadow-sm"
                                                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                                            )}
                                        >
                                            <div className={cn("p-2 rounded-lg", item.bg)}>
                                                <Icon className={cn("h-5 w-5", item.color)} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm tracking-tight">{item.title}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 uppercase tracking-widest text-[10px] py-1 px-3">Step 2: Target Goal</Badge>
                                <h3 className="text-2xl font-bold tracking-tight">What is your target role?</h3>
                                <p className="text-muted-foreground text-sm">Be specific, e.g., &quot;Fullstack React Developer&quot; or &quot;Content Strategist&quot;.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="role" className="text-xs uppercase font-black text-muted-foreground tracking-widest">Job Title</Label>
                                    <Input
                                        id="role"
                                        placeholder="Enter the role you are aiming for..."
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="h-12 text-base font-medium bg-muted/50 border-border/60 focus:ring-primary/20"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {['Frontend Developer', 'Backend Engineer', 'Product Manager'].includes(role) || !role ? (
                                        ['React Developer', 'Fullstack Engineer', 'UI/UX Designer', 'Growth Marketer'].map((suggestion) => (
                                            <button
                                                key={suggestion}
                                                onClick={() => setRole(suggestion)}
                                                className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-primary"
                                            >
                                                {suggestion}
                                            </button>
                                        ))
                                    ) : null}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button variant="ghost" onClick={handleBack} className="flex-1 rounded-xl h-12 font-bold uppercase tracking-widest text-xs">
                                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    disabled={!isStep2Valid}
                                    className="flex-[2] rounded-xl h-12 font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                                >
                                    Continue <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 uppercase tracking-widest text-[10px] py-1 px-3">Step 3: Seniority Level</Badge>
                                <h3 className="text-2xl font-bold tracking-tight">What level are you targeting?</h3>
                                <p className="text-muted-foreground text-sm">We will adjust the roadmap depth based on your expectation.</p>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {LEVELS.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setLevel(item.id)}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-xl border transition-all text-left",
                                            level === item.id
                                                ? "border-primary bg-primary/5 shadow-sm"
                                                : "border-border hover:border-primary/50 hover:bg-muted/50"
                                        )}
                                    >
                                        <div>
                                            <p className="font-bold text-sm tracking-tight">{item.title}</p>
                                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                                        </div>
                                        {level === item.id && <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center"><Zap className="h-3 w-3 text-white fill-current" /></div>}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button variant="ghost" onClick={handleBack} className="flex-1 rounded-xl h-12 font-bold uppercase tracking-widest text-xs">
                                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                                </Button>
                                <Button
                                    onClick={() => onGenerate({ domain, role, level })}
                                    disabled={!isStep3Valid || isLoading}
                                    className="flex-[2] rounded-xl h-12 font-bold uppercase tracking-widest text-xs shadow-xl shadow-primary/30"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center animate-pulse">Initializing Path...</span>
                                    ) : (
                                        <span className="flex items-center"><Sparkles className="mr-2 h-4 w-4 fill-current" /> Generate Blueprint</span>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
