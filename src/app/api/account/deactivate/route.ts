import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();

        // Initial client to get the user
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

        // Get optional deactivation reason
        const body = await request.json().catch(() => ({}));
        const reason = body.reason || null;

        // Use SERVICE ROLE key to bypass RLS for this critical update
        // This ensures the update happens even if the user is in a weird auth state
        const adminClient = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key here
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
                is_active: false,
                deactivated_at: new Date().toISOString(),
                deactivation_reason: reason,
                updated_at: new Date().toISOString()
            })
            .eq("id", user.id);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // Sign out the user using the original client
        await supabase.auth.signOut();

        return NextResponse.json({
            success: true,
            message: "Account deactivated successfully"
        });

    } catch (err: unknown) {
        console.error("❌ Account Deactivation Error:", (err as Error).message);
        return NextResponse.json(
            { error: (err as Error).message || "Internal server error" },
            { status: 500 }
        );
    }
}
