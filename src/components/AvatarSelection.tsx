"use client";

import React from 'react';
import { Mic, Brain, Sparkles, ChevronRight, Zap, Heart, Target, Award } from 'lucide-react';
import { INTERVIEWER_AVATARS, type InterviewerAvatar } from '@/config/interviewer-avatars';

interface AvatarSelectionProps {
    selectedAvatar: InterviewerAvatar;
    onSelect: (avatar: InterviewerAvatar) => void;
    variant?: 'default' | 'compact';
    disabled?: boolean;
}

export function AvatarSelection({ selectedAvatar, onSelect, variant = 'default', disabled = false }: AvatarSelectionProps) {
    const getAvatarIcon = (avatar: InterviewerAvatar) => {
        switch (avatar.id) {
            case 'kirti': return Heart;
            case 'partha': return Brain;
            case 'drona': return Award;
            case 'kunti': return Target;
            default: return Sparkles;
        }
    };

    const getStrictness = (avatar: InterviewerAvatar) => {
        if (avatar.description.toLowerCase().includes('empathetic')) return 'Moderate';
        if (avatar.description.toLowerCase().includes('strategic')) return 'High';
        if (avatar.description.toLowerCase().includes('mentor')) return 'Very High';
        return 'Adaptive';
    };

    const getVoiceDescription = (voice: string) => {
        const voiceMap: Record<string, string> = {
            'Kore': 'Friendly',
            'Charon': 'Professional',
            'Fenrir': 'Deep & Calm',
            'Aoede': 'Energetic',
            'Puck': 'Precise'
        };
        return voiceMap[voice] || 'Professional';
    };

    if (variant === 'compact') {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/60">Interviewer Persona</span>
                    <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                        <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                        AI Verified
                    </span>
                </div>

                <div className="flex items-center gap-3 p-2 bg-card/30 backdrop-blur-xl border border-border rounded-2xl">
                    {INTERVIEWER_AVATARS.map((avatar) => {
                        const isSelected = selectedAvatar.id === avatar.id;
                        return (
                            <button
                                key={avatar.id}
                                onClick={() => !disabled && onSelect(avatar)}
                                disabled={disabled}
                                className={`relative h-12 w-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-300 group ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-110 active:scale-95'} ${isSelected
                                    ? `bg-gradient-to-br ${avatar.color} ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg shadow-primary/20`
                                    : 'bg-muted/50 grayscale hover:grayscale-0'
                                    }`}
                            >
                                {avatar.avatar}
                                {isSelected && (
                                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full border border-background flex items-center justify-center">
                                        <div className="h-1 w-1 bg-white rounded-full" />
                                    </div>
                                )}

                                {/* Tooltip-style name on hover */}
                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-popover text-[8px] font-black uppercase rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none border border-border">
                                    {avatar.name}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Selection Details */}
                <div className="px-2 flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-black text-foreground uppercase tracking-tight">{selectedAvatar.name}</p>
                        <p className="text-[9px] text-muted-foreground font-medium line-clamp-1">{selectedAvatar.description}</p>
                    </div>
                    <div className="text-right">
                        <span className="text-[9px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full">
                            {getVoiceDescription(selectedAvatar.voice)}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full">
            {/* ... rest of the existing default implementation remains same ... */}
            {/* Background Ambient Glow */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-900/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-900/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
                        <Sparkles size={12} />
                        <span>AI-Powered Interview</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">Select Your Interviewer</h2>
                    <p className="text-muted-foreground max-w-lg mx-auto text-sm">Choose an AI persona tailored to your interview style and goals.</p>
                </div>

                {/* Main Avatar Container */}
                <div className="flex items-center justify-center mb-10">
                    <div className="flex -space-x-8 hover:space-x-2 transition-all duration-500 ease-out py-12 px-4">
                        {INTERVIEWER_AVATARS.map((avatar) => {
                            const isSelected = selectedAvatar.id === avatar.id;
                            const Icon = getAvatarIcon(avatar);
                            const strictness = getStrictness(avatar);
                            const voiceDesc = getVoiceDescription(avatar.voice);

                            return (
                                <div
                                    key={avatar.id}
                                    className={`group relative transition-all duration-500 ease-out ${disabled ? 'pointer-events-none opacity-50' : ''}`}
                                    onClick={() => !disabled && onSelect(avatar)}
                                >
                                    {/* Avatar Circle */}
                                    <div
                                        className={`relative w-24 h-24 rounded-full ring-4 shadow-2xl cursor-pointer 
                                        transition-all duration-500 transform
                                        group-hover:scale-125 group-hover:-translate-y-4 group-hover:z-50 
                                        z-0 flex items-center justify-center text-4xl
                                        ${isSelected
                                                ? 'ring-primary shadow-[0_0_30px_rgba(99,102,241,0.4)] scale-110 -translate-y-2 grayscale-0'
                                                : 'ring-border grayscale group-hover:grayscale-0 group-hover:ring-primary/50 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]'
                                            }
                                        bg-gradient-to-br ${avatar.color}`}
                                    >
                                        {avatar.avatar}

                                        {/* Selection Indicator */}
                                        {isSelected && (
                                            <div className="absolute -top-2 -right-2 bg-primary rounded-full p-1.5 border-2 border-background shadow-lg">
                                                <ChevronRight size={14} className="text-primary-foreground" />
                                            </div>
                                        )}

                                        {/* Voice Active Indicator */}
                                        <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1.5 border border-border">
                                            <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.6)] ${isSelected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`}></div>
                                        </div>
                                    </div>

                                    {/* Dropdown Info Card */}
                                    <div className="absolute top-28 left-1/2 -translate-x-1/2 w-72 
                                        bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl 
                                        opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                                        group-hover:translate-y-0 translate-y-8
                                        transition-all duration-300 ease-out delay-75 z-40 overflow-visible
                                        before:content-[''] before:absolute before:-top-8 before:left-0 before:w-full before:h-8 before:bg-transparent">

                                        {/* Glowing Top Border */}
                                        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${avatar.color} opacity-50`}></div>

                                        {/* Content */}
                                        <div className="p-6 text-center relative">
                                            <div className="relative z-10">
                                                <h3 className="text-2xl font-bold text-foreground mb-1">{avatar.name}</h3>
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4 border border-primary/20">
                                                    <Icon size={12} />
                                                    <span>{avatar.description}</span>
                                                </div>

                                                {/* Personality Quote */}
                                                <div className="mb-6 p-3 bg-muted/50 rounded-lg border-l-2 border-primary/50">
                                                    <p className="text-xs text-muted-foreground italic">
                                                        &quot;{avatar.personality}&quot;
                                                    </p>
                                                </div>

                                                {/* Stats Grid */}
                                                <div className="grid grid-cols-2 gap-3 text-left mb-6">
                                                    <div className="bg-muted/50 p-2.5 rounded-lg border border-border">
                                                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">Strictness</span>
                                                        <span className="text-sm font-medium text-foreground">{strictness}</span>
                                                    </div>
                                                    <div className="bg-muted/50 p-2.5 rounded-lg border border-border">
                                                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">Voice</span>
                                                        <span className="text-sm font-medium text-foreground">{voiceDesc}</span>
                                                    </div>
                                                </div>

                                                {/* Action Button */}
                                                <button
                                                    disabled={disabled}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!disabled) onSelect(avatar);
                                                    }}
                                                    className={`w-full py-3 px-4 rounded-xl text-sm font-bold 
                                                    transition-all duration-300 shadow-lg 
                                                    flex items-center justify-center gap-2 group/btn ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:scale-[1.02] active:scale-[0.98]'}
                                                    ${isSelected
                                                            ? 'bg-primary text-primary-foreground shadow-primary/20'
                                                            : 'bg-primary/90 hover:bg-primary text-primary-foreground shadow-primary/20'
                                                        }`}
                                                >
                                                    <Mic size={16} />
                                                    {isSelected ? 'Selected' : 'Select Interviewer'}
                                                    <ChevronRight size={16} className={disabled ? '' : "group-hover/btn:translate-x-1 transition-transform"} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Decorative Elements */}
                                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-card border-t border-l border-border transform rotate-45 z-[-1]"></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex gap-8 justify-center text-muted-foreground text-xs tracking-widest uppercase font-semibold">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Voice Active
                    </div>
                    <div className="flex items-center gap-2">
                        <Zap size={12} />
                        Real-time Feedback
                    </div>
                </div>
            </div>
        </div>
    );
}
