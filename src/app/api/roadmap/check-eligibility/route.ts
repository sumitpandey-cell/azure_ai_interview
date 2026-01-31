import { NextResponse } from 'next/server';
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

export async function GET() {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const eligibility = await roadmapService.checkPaymentEligibility(user.id);

        return NextResponse.json(eligibility, { status: 200 });
    } catch (err: unknown) {
        console.error(err);
        return NextResponse.json(
            { error: (err as Error).message || 'Failed to check eligibility' },
            { status: 500 }
        );
    }
}
