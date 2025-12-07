/**
 * Utility functions for avatar generation and handling
 */

/**
 * Generates a cartoonish avatar URL using DiceBear API
 * @param seed - A unique identifier (like user ID or name) to generate consistent avatars
 * @param style - The avatar style to use (default: 'avataaars' for cartoonish style)
 * @returns URL string for the generated avatar
 */
export function generateAvatar(
    seed: string,
    style: 'avataaars' | 'bottts' | 'fun-emoji' | 'lorelei' | 'notionists' | 'personas' = 'avataaars',
    gender?: string
): string {
    // DiceBear API v7 - Free avatar generation service
    // Using avataaars style for cartoonish avatars
    let url = `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;

    if (style === 'avataaars' && gender) {
        const normalizedGender = gender.toLowerCase();
        if (normalizedGender === 'male') {
            // Male-leaning traits: short hair, chance of facial hair
            url += '&top[]=shortHair&top[]=shortHairTheCaesar&top[]=shortHairDreads01&top[]=shortHairDreads02&top[]=shortHairFrizzle&top[]=shortHairShaggyMullet&top[]=shortHairSides&top[]=shortHairTheCaesarSidePart&facialHairProbability=40';
        } else if (normalizedGender === 'female') {
            // Female-leaning traits: long hair, no facial hair
            url += '&top[]=longHair&top[]=longHairBob&top[]=longHairBun&top[]=longHairCurly&top[]=longHairCurvy&top[]=longHairDreads&top[]=longHairFrida&top[]=longHairFro&top[]=longHairFroBand&top[]=longHairMiaWallace&top[]=longHairNotTooLong&top[]=longHairShavedSides&top[]=longHairStraight&top[]=longHairStraight2&top[]=longHairStraightStrand&facialHairProbability=0';
        }
    }

    return url;
}

/**
 * Gets the appropriate avatar URL, falling back to generated avatar if none exists
 * Checks multiple sources in priority order:
 * 1. User's uploaded avatar (avatar_url)
 * 2. Google/OAuth profile picture (picture)
 * 3. Generated cartoonish avatar (based on gender if provided)
 * 
 * @param avatarUrl - The user's uploaded avatar URL (can be null/undefined)
 * @param fallbackSeed - Seed for generating fallback avatar (user ID or name)
 * @param style - Avatar style for fallback generation
 * @param oauthPicture - OAuth provider profile picture (e.g., Google profile photo)
 * @param gender - User's gender for avatar customization
 * @returns URL string for the avatar to display
 */
export function getAvatarUrl(
    avatarUrl: string | null | undefined,
    fallbackSeed: string,
    style: 'avataaars' | 'bottts' | 'fun-emoji' | 'lorelei' | 'notionists' | 'personas' = 'avataaars',
    oauthPicture?: string | null,
    gender?: string
): string {
    // Priority 1: Check if user has uploaded their own avatar
    if (avatarUrl && avatarUrl.trim() !== '') {
        return avatarUrl;
    }

    // Priority 2: Check if OAuth profile picture exists (e.g., Google profile photo)
    if (oauthPicture && oauthPicture.trim() !== '') {
        return oauthPicture;
    }

    // Priority 3: Generate a cartoonish avatar as fallback
    return generateAvatar(fallbackSeed, style, gender);
}

/**
 * Gets initials from a full name for avatar fallback
 * @param name - Full name of the user
 * @returns Initials (max 2 characters)
 */
export function getInitials(name: string | null | undefined): string {
    if (!name) return 'U';

    const parts = name.trim().split(' ');
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }

    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
