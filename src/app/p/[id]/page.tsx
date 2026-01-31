import { profileService } from "@/services/profile.service"
import { Metadata } from "next"
import PublicProfileClient from "./PublicProfileClient"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const profile = await profileService.getPublicProfile(resolvedParams.id);

    if (!profile || !profile.is_public) {
        return {
            title: "Private Profile - Arjuna AI",
            description: "This interview profile is private.",
            robots: {
                index: false,
                follow: false
            }
        }
    }

    return {
        title: `${profile.full_name || 'Candidate'} - AI Interview Profile | Arjuna AI`,
        description: `Check out ${profile.full_name || 'Candidate'}'s interview achievements and global rank on Arjuna AI, the world's most advanced AI interviewer.`,
        keywords: ['AI Interview', 'Technical Interview', 'Interview Profile', 'Arjuna AI', profile.full_name || 'Candidate'],
        authors: [{ name: 'Arjuna AI' }],
        viewport: {
            width: 'device-width',
            initialScale: 1,
            maximumScale: 5,
            userScalable: true,
        },
        openGraph: {
            title: `${profile.full_name || 'Candidate'} - Professional Interview Profile`,
            description: `View rank, scores, and technical skills verified by Arjuna AI.`,
            images: [profile.avatar_url || '/favicon.ico'],
            type: 'profile',
            siteName: 'Arjuna AI',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${profile.full_name || 'Candidate'} - AI Interview Profile`,
            description: `Professional interview achievements verified by Arjuna AI`,
            images: [profile.avatar_url || '/favicon.ico'],
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
            }
        }
    }
}

export default async function PublicProfile({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;

    // Debug logging for server-side environment
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.error("❌ ERROR: NEXT_PUBLIC_SUPABASE_URL is missing on the server!");
    }

    // We can fetch the initial profile data on the server for faster loading
    // and to handle the "not found" state gracefully before hydration
    const initialProfile = await profileService.getPublicProfile(resolvedParams.id);

    // Ensure types match component props (convert nulls to undefined/default)
    const safeProfile = initialProfile ? {
        ...initialProfile,
        full_name: initialProfile.full_name || 'Candidate',
        avatar_url: initialProfile.avatar_url || undefined,
        profile_slug: initialProfile.profile_slug || undefined
    } : null;

    return <PublicProfileClient initialProfile={safeProfile} />;
}
