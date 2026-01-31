import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Cron Job: Cleanup Zombie Sessions
 * 
 * Auto-completes sessions that have been stuck in "in_progress" status
 * for more than 10 minutes without any updates.
 * 
 * This handles edge cases where:
 * - User closes tab/browser
 * - Browser crashes
 * - Power loss
 * - Network disconnection
 * - beforeunload events fail (especially on mobile)
 * 
 * Schedule: Run every 5 minutes via Vercel Cron or external service
 * 
 * Security: Protected by CRON_SECRET environment variable
 */

const STALE_SESSION_THRESHOLD_MINUTES = 10;
const MAX_SESSIONS_PER_RUN = 50;

export async function GET(request: NextRequest) {
    try {
        // 1. Verify cron secret for security
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret) {
            console.error('❌ CRON_SECRET not configured');
            return NextResponse.json(
                { error: 'Cron job not configured' },
                { status: 500 }
            );
        }

        if (authHeader !== `Bearer ${cronSecret}`) {
            console.error('❌ Unauthorized cron job attempt');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 2. Initialize Supabase admin client (bypasses RLS)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('❌ Supabase credentials not configured');
            return NextResponse.json(
                { error: 'Database not configured' },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // 3. Find zombie sessions (in_progress for >10 minutes)
        const staleThreshold = new Date();
        staleThreshold.setMinutes(staleThreshold.getMinutes() - STALE_SESSION_THRESHOLD_MINUTES);


        const { data: zombieSessions, error: fetchError } = await supabase
            .from('interview_sessions')
            .select('id, user_id, created_at, duration_seconds, updated_at')
            .eq('status', 'in_progress')
            .lt('updated_at', staleThreshold.toISOString())
            .order('updated_at', { ascending: true })
            .limit(MAX_SESSIONS_PER_RUN);

        if (fetchError) {
            console.error('❌ Error fetching zombie sessions:', fetchError);
            return NextResponse.json(
                { error: 'Failed to fetch sessions', details: fetchError.message },
                { status: 500 }
            );
        }

        if (!zombieSessions || zombieSessions.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No zombie sessions found',
                processed: 0,
                completed: 0,
                errors: []
            });
        }


        // 4. Process each zombie session
        const results = {
            processed: 0,
            completed: 0,
            errors: [] as string[]
        };

        for (const session of zombieSessions) {
            results.processed++;

            try {
                // Calculate total duration from created_at to now
                const createdAt = new Date(session.created_at);
                const now = new Date();
                const totalDurationSeconds = Math.round((now.getTime() - createdAt.getTime()) / 1000);

                // Cap at reasonable maximum (e.g., 2 hours)
                const cappedDuration = Math.min(totalDurationSeconds, 7200);
                const existingDuration = session.duration_seconds || 0;
                const additionalDuration = Math.max(0, cappedDuration - existingDuration);


                if (additionalDuration > 0) {
                    const { error: rpcError } = await supabase.rpc('update_user_credits', {
                        user_uuid: session.user_id,
                        seconds_to_add: -Math.round(additionalDuration),
                        transaction_type: 'usage',
                        transaction_description: `Zombie session cleanup: ${session.id}`
                    });

                    if (rpcError) {
                        console.error(`❌ Failed to track usage for session ${session.id}:`, rpcError);
                    } else {
                    }
                }

                // Mark session as completed with zombie cleanup note
                const { error: updateError } = await supabase
                    .from('interview_sessions')
                    .update({
                        status: 'completed',
                        duration_seconds: cappedDuration,
                        completed_at: new Date().toISOString(),
                        feedback: {
                            note: 'Session auto-completed by cleanup job',
                            reason: 'zombie_session_cleanup',
                            original_duration: existingDuration,
                            calculated_duration: cappedDuration,
                            cleanup_timestamp: new Date().toISOString()
                        }
                    })
                    .eq('id', session.id);

                if (updateError) {
                    console.error(`❌ Failed to complete session ${session.id}:`, updateError);
                    results.errors.push(`Session ${session.id}: ${updateError.message}`);
                } else {
                    results.completed++;
                }

            } catch (sessionError) {
                const errorMsg = sessionError instanceof Error ? sessionError.message : String(sessionError);
                console.error(`❌ Error processing session ${session.id}:`, errorMsg);
                results.errors.push(`Session ${session.id}: ${errorMsg}`);
            }
        }


        return NextResponse.json({
            success: true,
            message: `Processed ${results.processed} zombie sessions`,
            processed: results.processed,
            completed: results.completed,
            errors: results.errors,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json(
            {
                error: 'Cron job failed',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

// Also support POST for manual triggering (with same auth)
export async function POST(request: NextRequest) {
    return GET(request);
}
