export type BadgeCategory = 'streak' | 'leaderboard' | 'milestone' | 'special' | 'performance' | 'communication' | 'skill' | 'speed' | 'diversity';

export type BadgeRarity = 'bronze' | 'silver' | 'gold' | 'platinum' | 'special';

export interface Badge {
    id: string;
    name: string;
    description: string;
    category: BadgeCategory;
    rarity: BadgeRarity;
    icon: string; // emoji or icon name
    requirement: string;
    earned: boolean;
    earnedAt?: string;
    progress?: number; // 0-100 for badges in progress
    maxProgress?: number;
}

export interface BadgeDefinition {
    id: string;
    name: string;
    description: string;
    category: BadgeCategory;
    rarity: BadgeRarity;
    icon: string;
    requirement: string;
    checkCondition: (userData: UserBadgeData) => boolean;
    getProgress?: (userData: UserBadgeData) => { current: number; max: number };
}

export interface UserBadgeData {
    streak: number;
    totalInterviews: number;
    weeklyRank: number | null;
    monthlyRank: number | null;
    totalWeeklyUsers: number;
    lastActiveDate: string | null;
    currentStreak: number;
    wasInactive: boolean;
    earnedBadges: string[];
    // Extended fields used by badge definitions
    highestScore: number;
    averageScore: number;
    communicationScore: number;
    skillMastery: number;
    technicalScore: number;
    fastestTime: number; // in minutes
    interviewTypes: number; // count of unique types
    morningInterviews: number;
    nightInterviews: number;
}

export interface BadgeEarnedEvent {
    badgeId: string;
    badgeName: string;
    badgeIcon: string;
    badgeRarity: BadgeRarity;
    earnedAt: string;
}
