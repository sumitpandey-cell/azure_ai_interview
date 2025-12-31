import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { roadmapService } from '@/services/roadmap.service';

async function createClient() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll(); },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch { }
                },
            },
        }
    );
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get payment ID from request (if provided)
        const body = await request.json().catch(() => ({}));
        const { paymentId } = body;

        // Generate roadmap - pass supabase client
        const roadmap = await roadmapService.generateRoadmap(user.id, paymentId, supabase);

        return NextResponse.json({ roadmap }, { status: 200 });
    } catch (error: any) {
        console.error('Roadmap generation error:', error);

        // Handle specific error messages
        if (error.message === 'Minimum 3 completed interviews required') {
            return NextResponse.json(
                { error: 'insufficient_interviews', message: error.message },
                { status: 400 }
            );
        }

        if (error.message === 'Payment required for additional roadmap') {
            return NextResponse.json(
                { error: 'payment_required', message: error.message },
                { status: 402 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Failed to generate roadmap' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get active roadmap - pass supabase client
        const roadmap = await roadmapService.getActiveRoadmap(user.id, supabase);

        if (!roadmap) {
            return NextResponse.json({ roadmap: null }, { status: 200 });
        }

        // Get progress
        const progress = await roadmapService.getProgress(user.id, roadmap.id, supabase);

        return NextResponse.json({ roadmap, progress }, { status: 200 });
    } catch (error: any) {
        console.error('Roadmap fetch error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch roadmap' },
            { status: 500 }
        );
    }
}
