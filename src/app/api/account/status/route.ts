import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();

        // Initial client to get user identity
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) { return cookieStore.get(name)?.value; },
                    set(name: string, value: string, options: CookieOptions) { try { cookieStore.set({ name, value, ...options }); } catch { } },
                    remove(name: string, options: CookieOptions) { try { cookieStore.set({ name, value: '', ...options }); } catch { } },
                },
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Use SERVICE ROLE to bypass RLS to check status
        const adminClient = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                cookies: {
                    get(name: string) { return cookieStore.get(name)?.value; },
                    set(name: string, value: string, options: CookieOptions) { try { cookieStore.set({ name, value, ...options }); } catch { } },
                    remove(name: string, options: CookieOptions) { try { cookieStore.set({ name, value: '', ...options }); } catch { } },
                },
            }
        );

        const { data: status, error: statusError } = await adminClient
            .from("profiles")
            .select("is_active, deactivated_at, deactivation_reason")
            .eq("id", user.id)
            .maybeSingle();

        if (statusError) {
            console.error('❌ Status check error:', statusError);
            return NextResponse.json({ error: statusError.message }, { status: 500 });
        }

        if (!status) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            isActive: status.is_active,
            deactivatedAt: status.deactivated_at,
            deactivationReason: status.deactivation_reason
        });

    } catch (err: unknown) {
        console.error(err);
        return NextResponse.json(
            { error: (err as Error).message || "Internal server error" },
            { status: 500 }
        );
    }
}
