import { BadgeDefinition, UserBadgeData } from '@/types/badge-types';

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
    // STREAK BADGES
    {
        id: 'streak-3',
        name: '3-Day Rookie',
        description: 'Complete interviews for 3 consecutive days',
        category: 'streak',
        rarity: 'bronze',
        icon: '🔥',
        requirement: '3-day streak',
        checkCondition: (data) => data.streak >= 3,
        getProgress: (data) => ({ current: Math.min(data.streak, 3), max: 3 }),
    },
    {
        id: 'streak-7',
        name: '7-Day Consistent',
        description: 'Maintain a 7-day interview streak',
        category: 'streak',
        rarity: 'bronze',
        icon: '⚡',
        requirement: '7-day streak',
        checkCondition: (data) => data.streak >= 7,
        getProgress: (data) => ({ current: Math.min(data.streak, 7), max: 7 }),
    },
    {
        id: 'streak-30',
        name: '30-Day Grinder',
        description: 'Show true commitment with a 30-day streak',
        category: 'streak',
        rarity: 'gold',
        icon: '💪',
        requirement: '30-day streak',
        checkCondition: (data) => data.streak >= 30,
        getProgress: (data) => ({ current: Math.min(data.streak, 30), max: 30 }),
    },
    {
        id: 'streak-100',
        name: '100-Day Acharya',
        description: 'Legendary dedication - 100 days of continuous practice',
        category: 'streak',
        rarity: 'platinum',
        icon: '👑',
        requirement: '100-day streak',
        checkCondition: (data) => data.streak >= 100,
        getProgress: (data) => ({ current: Math.min(data.streak, 100), max: 100 }),
    },

    // LEADERBOARD BADGES
    {
        id: 'weekly-top-10',
        name: 'Top 10% Weekly',
        description: 'Rank in the top 10% this week',
        category: 'leaderboard',
        rarity: 'silver',
        icon: '🏆',
        requirement: 'Top 10% rank',
        checkCondition: (data) => {
            if (!data.weeklyRank || !data.totalWeeklyUsers) return false;
            return data.weeklyRank <= Math.ceil(data.totalWeeklyUsers * 0.1);
        },
    },
    {
        id: 'weekly-top-3',
        name: 'Weekly Top 3',
        description: 'Finish in the top 3 this week',
        category: 'leaderboard',
        rarity: 'gold',
        icon: '🥇',
        requirement: 'Top 3 rank',
        checkCondition: (data) => {
            if (!data.weeklyRank) return false;
            return data.weeklyRank <= 3;
        },
    },
    {
        id: 'monthly-champion',
        name: 'Monthly Champion',
        description: 'Claim the #1 spot for the month',
        category: 'leaderboard',
        rarity: 'platinum',
        icon: '👑',
        requirement: '#1 monthly rank',
        checkCondition: (data) => data.monthlyRank === 1,
    },

    // MILESTONE BADGES
    {
        id: 'first-interview',
        name: 'First Interview',
        description: 'Complete your first interview',
        category: 'milestone',
        rarity: 'bronze',
        icon: '🎯',
        requirement: '1 interview',
        checkCondition: (data) => data.totalInterviews >= 1,
        getProgress: (data) => ({ current: Math.min(data.totalInterviews, 1), max: 1 }),
    },
    {
        id: 'interviews-10',
        name: '10 Interviews',
        description: 'Complete 10 interviews',
        category: 'milestone',
        rarity: 'silver',
        icon: '🎖️',
        requirement: '10 interviews',
        checkCondition: (data) => data.totalInterviews >= 10,
        getProgress: (data) => ({ current: Math.min(data.totalInterviews, 10), max: 10 }),
    },
    {
        id: 'interviews-50',
        name: '50 Interviews',
        description: 'Complete 50 interviews',
        category: 'milestone',
        rarity: 'gold',
        icon: '🏅',
        requirement: '50 interviews',
        checkCondition: (data) => data.totalInterviews >= 50,
        getProgress: (data) => ({ current: Math.min(data.totalInterviews, 50), max: 50 }),
    },

    // SPECIAL BADGES
    {
        id: 'comeback-hero',
        name: 'Comeback Hero',
        description: 'Return after a break and complete a 3-day streak',
        category: 'special',
        rarity: 'special',
        icon: '🦸',
        requirement: '7+ days inactive, then 3-day streak',
        checkCondition: (data) => {
            return data.wasInactive && data.currentStreak >= 3;
        },
        getProgress: (data) => {
            if (!data.wasInactive) return { current: 0, max: 3 };
            return { current: Math.min(data.currentStreak, 3), max: 3 };
        },
    },
];

export const getRarityColor = (rarity: string): string => {
    switch (rarity) {
        case 'bronze':
            return 'from-amber-600 to-orange-700';
        case 'silver':
            return 'from-slate-400 to-slate-600';
        case 'gold':
            return 'from-yellow-400 to-yellow-600';
        case 'platinum':
            return 'from-purple-400 to-purple-600';
        case 'special':
            return 'from-blue-500 to-cyan-500';
        default:
            return 'from-gray-400 to-gray-600';
    }
};

export const getRarityBorderColor = (rarity: string): string => {
    switch (rarity) {
        case 'bronze':
            return 'border-amber-600';
        case 'silver':
            return 'border-slate-400';
        case 'gold':
            return 'border-yellow-400';
        case 'platinum':
            return 'border-purple-400';
        case 'special':
            return 'border-blue-500';
        default:
            return 'border-gray-400';
    }
};

export const getRarityGlowColor = (rarity: string): string => {
    switch (rarity) {
        case 'bronze':
            return 'shadow-amber-500/50';
        case 'silver':
            return 'shadow-slate-400/50';
        case 'gold':
            return 'shadow-yellow-400/50';
        case 'platinum':
            return 'shadow-purple-400/50';
        case 'special':
            return 'shadow-blue-500/50';
        default:
            return 'shadow-gray-400/50';
    }
};
