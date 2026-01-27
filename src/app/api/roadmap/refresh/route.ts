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

        // Get inputs from request
        const body = await request.json().catch(() => ({}));
        const { paymentId, domain, role, level } = body;

        const roadmap = await roadmapService.refreshRoadmap(user.id, paymentId, supabase, domain, role, level);

        return NextResponse.json({ roadmap }, { status: 200 });
    } catch (error: any) {
        console.error('Roadmap refresh error:', error);

        if (error.message === 'Payment required for additional roadmap') {
            return NextResponse.json(
                { error: 'payment_required', message: error.message },
                { status: 402 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Failed to refresh roadmap' },
            { status: 500 }
        );
    }
}
