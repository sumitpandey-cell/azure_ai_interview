import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';

    if (code) {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value, ...options });
                        } catch (error) {
                            // Handle cookie setting errors in edge runtime
                            console.error('Error setting cookie:', error);
                        }
                    },
                    remove(name: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value: '', ...options });
                        } catch (error) {
                            // Handle cookie removal errors in edge runtime
                            console.error('Error removing cookie:', error);
                        }
                    },
                },
            }
        );

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && data.session) {
            console.log('✅ Auth callback: Session exchanged successfully');

            // Create a response with the redirect
            const redirectUrl = `${origin}${next}`;
            const response = NextResponse.redirect(redirectUrl);

            // Ensure cookies are set in the response
            const sessionCookie = cookieStore.get('sb-access-token');
            if (sessionCookie) {
                response.cookies.set('sb-access-token', sessionCookie.value, {
                    path: '/',
                    maxAge: 60 * 60 * 24 * 7, // 7 days
                    sameSite: 'lax',
                    secure: process.env.NODE_ENV === 'production',
                });
            }

            return response;
        }

        console.error('❌ Auth callback error:', error);
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth?error=callback_failed`);
}
