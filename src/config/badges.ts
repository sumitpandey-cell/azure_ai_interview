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
        rarity: 'silver',
        icon: '⚡',
        requirement: '7-day streak',
        checkCondition: (data) => data.streak >= 7,
        getProgress: (data) => ({ current: Math.min(data.streak, 7), max: 7 }),
    },
    {
        id: 'streak-14',
        name: '14-Day Dedicated',
        description: 'Two weeks of consistent practice',
        category: 'streak',
        rarity: 'silver',
        icon: '🌟',
        requirement: '14-day streak',
        checkCondition: (data) => data.streak >= 14,
        getProgress: (data) => ({ current: Math.min(data.streak, 14), max: 14 }),
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

    // PERFORMANCE BADGES
    {
        id: 'high-scorer',
        name: 'High Scorer',
        description: 'Achieve a score of 80% or higher',
        category: 'performance',
        rarity: 'bronze',
        icon: '⭐',
        requirement: 'Score 80%+',
        checkCondition: (data) => (data as any).highestScore >= 80,
        getProgress: (data) => ({ current: Math.min((data as any).highestScore || 0, 80), max: 80 }),
    },
    {
        id: 'excellence',
        name: 'Excellence',
        description: 'Score 90% or higher in an interview',
        category: 'performance',
        rarity: 'silver',
        icon: '🌟',
        requirement: 'Score 90%+',
        checkCondition: (data) => (data as any).highestScore >= 90,
        getProgress: (data) => ({ current: Math.min((data as any).highestScore || 0, 90), max: 90 }),
    },
    {
        id: 'perfect-score',
        name: 'Perfect Score',
        description: 'Achieve a flawless 100% score',
        category: 'performance',
        rarity: 'gold',
        icon: '💯',
        requirement: 'Score 100%',
        checkCondition: (data) => (data as any).highestScore >= 100,
        getProgress: (data) => ({ current: Math.min((data as any).highestScore || 0, 100), max: 100 }),
    },
    {
        id: 'consistent-performer',
        name: 'Consistent Performer',
        description: 'Maintain 75%+ average across 5 interviews',
        category: 'performance',
        rarity: 'gold',
        icon: '📊',
        requirement: '75%+ avg (5 interviews)',
        checkCondition: (data) => (data as any).averageScore >= 75 && data.totalInterviews >= 5,
        getProgress: (data) => ({ current: Math.min((data as any).averageScore || 0, 75), max: 75 }),
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
        id: 'interviews-5',
        name: '5 Interviews',
        description: 'Complete 5 interviews',
        category: 'milestone',
        rarity: 'bronze',
        icon: '🎪',
        requirement: '5 interviews',
        checkCondition: (data) => data.totalInterviews >= 5,
        getProgress: (data) => ({ current: Math.min(data.totalInterviews, 5), max: 5 }),
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
        id: 'interviews-25',
        name: '25 Interviews',
        description: 'Complete 25 interviews',
        category: 'milestone',
        rarity: 'silver',
        icon: '🏵️',
        requirement: '25 interviews',
        checkCondition: (data) => data.totalInterviews >= 25,
        getProgress: (data) => ({ current: Math.min(data.totalInterviews, 25), max: 25 }),
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
    {
        id: 'interviews-100',
        name: '100 Interviews',
        description: 'Complete 100 interviews - True dedication!',
        category: 'milestone',
        rarity: 'platinum',
        icon: '🎊',
        requirement: '100 interviews',
        checkCondition: (data) => data.totalInterviews >= 100,
        getProgress: (data) => ({ current: Math.min(data.totalInterviews, 100), max: 100 }),
    },

    // COMMUNICATION BADGES
    {
        id: 'communication-guru',
        name: 'Communication Guru',
        description: 'Excel in communication skills',
        category: 'communication',
        rarity: 'gold',
        icon: '💬',
        requirement: 'High communication score',
        checkCondition: (data) => (data as any).communicationScore >= 85,
        getProgress: (data) => ({ current: Math.min((data as any).communicationScore || 0, 85), max: 85 }),
    },
    {
        id: 'articulate',
        name: 'Articulate',
        description: 'Demonstrate clear and concise communication',
        category: 'communication',
        rarity: 'silver',
        icon: '🗣️',
        requirement: 'Clear communication',
        checkCondition: (data) => (data as any).communicationScore >= 75,
        getProgress: (data) => ({ current: Math.min((data as any).communicationScore || 0, 75), max: 75 }),
    },

    // SKILL MASTERY BADGES
    {
        id: 'subject-matter-expert',
        name: 'Subject Matter Expert',
        description: 'Master a specific skill domain',
        category: 'skill',
        rarity: 'gold',
        icon: '🎓',
        requirement: 'Skill mastery',
        checkCondition: (data) => (data as any).skillMastery >= 90,
        getProgress: (data) => ({ current: Math.min((data as any).skillMastery || 0, 90), max: 90 }),
    },
    {
        id: 'technical-wizard',
        name: 'Technical Wizard',
        description: 'Demonstrate exceptional technical knowledge',
        category: 'skill',
        rarity: 'platinum',
        icon: '🧙',
        requirement: 'Technical excellence',
        checkCondition: (data) => (data as any).technicalScore >= 95,
        getProgress: (data) => ({ current: Math.min((data as any).technicalScore || 0, 95), max: 95 }),
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

    // SPEED BADGES
    {
        id: 'quick-thinker',
        name: 'Quick Thinker',
        description: 'Complete interview in under 15 minutes',
        category: 'speed',
        rarity: 'bronze',
        icon: '⚡',
        requirement: 'Complete in <15 min',
        checkCondition: (data) => (data as any).fastestTime <= 15,
    },
    {
        id: 'lightning-fast',
        name: 'Lightning Fast',
        description: 'Complete interview in under 10 minutes',
        category: 'speed',
        rarity: 'silver',
        icon: '⚡',
        requirement: 'Complete in <10 min',
        checkCondition: (data) => (data as any).fastestTime <= 10,
    },

    // DIVERSITY BADGES
    {
        id: 'versatile',
        name: 'Versatile',
        description: 'Complete 3 different interview types',
        category: 'diversity',
        rarity: 'silver',
        icon: '🎭',
        requirement: '3 interview types',
        checkCondition: (data) => (data as any).interviewTypes >= 3,
        getProgress: (data) => ({ current: Math.min((data as any).interviewTypes || 0, 3), max: 3 }),
    },
    {
        id: 'jack-of-all-trades',
        name: 'Jack of All Trades',
        description: 'Complete 5 different interview types',
        category: 'diversity',
        rarity: 'gold',
        icon: '🌈',
        requirement: '5 interview types',
        checkCondition: (data) => (data as any).interviewTypes >= 5,
        getProgress: (data) => ({ current: Math.min((data as any).interviewTypes || 0, 5), max: 5 }),
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
    {
        id: 'early-bird',
        name: 'Early Bird',
        description: 'Complete interviews in the morning (6 AM - 10 AM)',
        category: 'special',
        rarity: 'special',
        icon: '🌅',
        requirement: 'Morning interviews',
        checkCondition: (data) => (data as any).morningInterviews >= 5,
        getProgress: (data) => ({ current: Math.min((data as any).morningInterviews || 0, 5), max: 5 }),
    },
    {
        id: 'night-owl',
        name: 'Night Owl',
        description: 'Complete interviews late at night (10 PM - 2 AM)',
        category: 'special',
        rarity: 'special',
        icon: '🦉',
        requirement: 'Night interviews',
        checkCondition: (data) => (data as any).nightInterviews >= 5,
        getProgress: (data) => ({ current: Math.min((data as any).nightInterviews || 0, 5), max: 5 }),
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
