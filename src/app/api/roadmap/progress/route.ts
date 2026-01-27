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

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { roadmapId, itemType, itemId, phaseNumber, notes } = body;

        if (!roadmapId || !itemType || !itemId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const progress = await roadmapService.trackProgress(
            user.id,
            roadmapId,
            itemType,
            itemId,
            phaseNumber,
            notes,
            supabase
        );

        return NextResponse.json({ progress }, { status: 200 });
    } catch (err: unknown) {
        console.error(err);
        return NextResponse.json(
            { error: (err as Error).message || 'Failed to track progress' },
            { status: 500 }
        );
    }
}
