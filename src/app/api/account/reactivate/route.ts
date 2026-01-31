import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST() {
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

        // Use SERVICE ROLE to bypass RLS, because the current profile is likely deactivated
        // and cannot be seen/updated by the anon/user key.
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

        const { error: updateError } = await adminClient
            .from("profiles")
            .update({
                is_active: true,
                deactivated_at: null,
                deactivation_reason: null,
                updated_at: new Date().toISOString()
            })
            .eq("id", user.id);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "Account reactivated successfully"
        });

    } catch (err: unknown) {
        return NextResponse.json(
            { error: (err as Error).message || "Internal server error" },
            { status: 500 }
        );
    }
}
