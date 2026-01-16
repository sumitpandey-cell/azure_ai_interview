import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
        const body = await request.json();
        const { sessionId, durationSeconds, startTranscriptIndex, resumedAt, endedAt } = body;

        if (!sessionId || !resumedAt || durationSeconds === undefined) {
            console.warn('[Cleanup API] Missing required fields:', { sessionId, resumedAt, durationSeconds });
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = await createClient();

        // 1. Normalize timestamps to ensure DB doesn't round to 0s
        // If JS dates are too close, EXTRACT(EPOCH FROM ...) in Postgres can return 0
        let finalEndedAt = endedAt;
        if (resumedAt && endedAt && durationSeconds >= 1) {
            const rDate = new Date(resumedAt);
            const eDate = new Date(endedAt);
            // If difference is less than 1s but durationSeconds is >= 1, force ended_at forward
            if (eDate.getTime() - rDate.getTime() < 1000) {
                eDate.setTime(rDate.getTime() + (durationSeconds * 1000));
                finalEndedAt = eDate.toISOString();
                console.log(`[Cleanup API] Adjusted endedAt for session ${sessionId} to ensure 1s+ duration`);
            }
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError) {
            console.error('[Cleanup API] Auth error:', authError);
            // If it's a network error/timeout, return 500 instead of 401
            if (authError.message?.includes('fetch failed') || authError.status === 0 || authError.name === 'AuthRetryableFetchError') {
                return NextResponse.json({ error: 'Connection to auth service failed' }, { status: 500 });
            }
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user) {
            console.warn('[Cleanup API] No user found in session');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Create the record and track usage atomically using the idempotent RPC
        // We now pass undefined/null for p_end_idx as the RPC handles COALESCE(p_end_idx, current_length)
        const { data: rpcResult, error: rpcError } = await (supabase as any).rpc('record_interview_segment', {
            p_session_id: sessionId,
            p_user_id: user.id,
            p_resumed_at: resumedAt,
            p_ended_at: finalEndedAt,
            p_duration_seconds: Math.max(1, Math.round(durationSeconds)),
            p_start_idx: startTranscriptIndex,
            p_end_idx: null // Handled by SQL: (SELECT jsonb_array_length(transcript) ...)
        });

        if (rpcError) {
            console.error('[Cleanup API] record_interview_segment RPC error:', rpcError);
            throw rpcError;
        }

        const result = rpcResult[0]; // Tabular return from RPC

        if (result.already_processed) {
            console.log(`[Cleanup API] Segment for ${sessionId} was already processed (Idempotency skip).`);
            return NextResponse.json({ success: true, alreadyProcessed: true });
        }

        if (!result.success) {
            console.warn(`[Cleanup API] Usage limit or validation failed: ${result.message}`);
            return NextResponse.json({
                success: false,
                error: result.message || 'Validation failed',
                remainingSeconds: result.remaining_seconds
            }, { status: 403 });
        }

        console.log(`[Cleanup API] Successfully recorded new segment for ${sessionId}. Actual duration: ${result.actual_duration}s. Remaining: ${result.remaining_seconds}s.`);
        return NextResponse.json({
            success: true,
            actualDuration: result.actual_duration,
            remainingSeconds: result.remaining_seconds
        });
    } catch (error: any) {
        console.error('[Cleanup API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
