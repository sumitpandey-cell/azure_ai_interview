import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
    '/',
    '/auth',
    '/auth/callback',
    '/about',
    '/contact',
    '/pricing',
    '/site.webmanifest',
    '/manifest.webmanifest',
    '/manifest.json',
    '/sw.js',
    '/workbox-',
    '/p',
    '/faq',
    '/terms',
    '/privacy',
    '/blog',
];

// Define routes that should redirect to dashboard if already authenticated

export async function middleware(req: NextRequest) {
    // Create an unmodified response first
    let response = NextResponse.next({
        request: {
            headers: req.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return req.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    // Update the request cookies so subsequent logic sees the change
                    req.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                    // Update the response cookies so the browser gets the change
                    response = NextResponse.next({
                        request: {
                            headers: req.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                },
                remove(name: string, options: CookieOptions) {
                    // Update the request cookies
                    req.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                    // Update the response cookies
                    response = NextResponse.next({
                        request: {
                            headers: req.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                },
            },
        }
    );

    // IMPORTANT: Refresh session to ensure cookies are updated
    // This call will invoke the 'set' or 'remove' cookie methods above if needed
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = req.nextUrl;

    // Check if the current route is public
    const isPublicRoute = PUBLIC_ROUTES.some(route =>
        pathname === route || pathname.startsWith(`${route}/`)
    );

    // Check if the current route is an auth route (excluding callback)
    const isAuthRoute = pathname === '/auth';

    // Check if user is trying to access reactivate page
    const isReactivateRoute = pathname === '/reactivate';

    // If user is authenticated, check if account is deactivated
    // Don't redirect if it's already the reactivate route OR an API route
    const isApiRoute = pathname.startsWith('/api/');
    if (user && !isReactivateRoute && !isApiRoute) {
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_active')
                .eq('id', user.id)
                .maybeSingle() as { data: { is_active: boolean } | null };

            // If account is deactivated, redirect to reactivate page
            if (profile && profile.is_active === false) {
                const reactivateUrl = new URL('/reactivate', req.url);
                return NextResponse.redirect(reactivateUrl);
            }
        } catch (err: unknown) {
            console.error('Error checking account status in middleware:', err);
            // Continue on error to avoid blocking legitimate users
        }
    }

    // If user is authenticated and trying to access auth page, redirect to dashboard
    if (user && isAuthRoute) {
        const dashboardUrl = new URL('/dashboard', req.url);
        return NextResponse.redirect(dashboardUrl);
    }

    // If user is not authenticated and trying to access protected routes, redirect to auth
    if (!user && !isPublicRoute && !isReactivateRoute) {
        const authUrl = new URL('/auth', req.url);
        // Store the original URL to redirect back after login
        authUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(authUrl);
    }

    // Allow the request to proceed with updated cookies
    return response;
}

// Configure which routes should be processed by this middleware
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         * - api routes (handled separately)
         */
        '/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest|manifest\\.json|site\\.webmanifest|sw\\.js|workbox-.*\\.js|apple-touch-icon.*\\.png|robots\\.txt|sitemap.*\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
