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
    '/invite',
    '/interview',
    '/recruiter/auth',
    '/test',
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
    ) || pathname === '/recruiter/auth'; // Explicitly add recruiter auth as public

    // Check if the current route is an auth route
    const isStandardAuthRoute = pathname === '/auth';
    const isRecruiterAuthRoute = pathname === '/recruiter/auth';
    const isAnyAuthRoute = isStandardAuthRoute || isRecruiterAuthRoute;

    // Check if user is trying to access reactivate page
    const isReactivateRoute = pathname === '/reactivate';

    // If user is authenticated, check if account is deactivated
    const isApiRoute = pathname.startsWith('/api/');
    let userType: string | null = null;

    if (user && !isApiRoute) {
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_active, user_type')
                .eq('id', user.id)
                .maybeSingle() as { data: { is_active: boolean; user_type: string } | null };

            if (profile) {
                userType = profile.user_type;
                // If account is deactivated, redirect to reactivate page
                if (profile.is_active === false && !isReactivateRoute) {
                    const reactivateUrl = new URL('/reactivate', req.url);
                    return NextResponse.redirect(reactivateUrl);
                }
            }
        } catch (err: unknown) {
            console.error('Error checking account status in middleware:', err);
        }
    }

    // REDIRECTION LOGIC

    // 1. If user is authenticated and trying to access an auth page
    if (user && isAnyAuthRoute) {
        // If recruiter, go to recruiter dashboard, else standard dashboard
        const dashboardPath = userType === 'recruiter' ? '/recruiter/dashboard' : '/dashboard';
        const dashboardUrl = new URL(dashboardPath, req.url);
        return NextResponse.redirect(dashboardUrl);
    }

    // 2. If user is NOT authenticated and trying to access PROTECTED routes
    if (!user && !isPublicRoute && !isReactivateRoute && !isApiRoute) {
        // Decide which auth page to show based on the requested URL
        const authPath = pathname.startsWith('/recruiter') ? '/recruiter/auth' : '/auth';
        const authUrl = new URL(authPath, req.url);
        authUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(authUrl);
    }

    // 3. Prevent non-recruiters from accessing recruiter routes (Optional but good)
    if (user && pathname.startsWith('/recruiter') && userType !== 'recruiter' && !isRecruiterAuthRoute) {
        // Student trying to access recruiter dashboard? Redirect to student dashboard
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // 4. Prevent recruiters from accessing student routes
    if (user && !pathname.startsWith('/recruiter') && !isPublicRoute && userType === 'recruiter' && !isReactivateRoute) {
        // Recruiter trying to access student dashboard/pages? Redirect to recruiter dashboard
        return NextResponse.redirect(new URL('/recruiter/dashboard', req.url));
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
