import { createServerClient } from '@supabase/ssr';
import { AuthError } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
  '/chat',
  '/profile',
  '/settings',
  '/notifications',
  '/contacts',
  '/search',
];

const AUTH_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

/**
 * Fast check to detect presence of Supabase auth session cookies.
 * Avoids initializing Supabase SSR client or making network calls for unauthenticated requests.
 */
function hasAuthCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some(
    cookie =>
      Boolean(cookie.value?.trim()) &&
      ((cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')) ||
        cookie.name.includes('supabase-auth-token'))
  );
}

/**
 * Creates a safe redirect URL that prevents redirect loops.
 */
function createSafeRedirectUrl(targetPath: string, request: NextRequest, includeRedirectTo = false): URL {
  const url = new URL(targetPath, request.url);
  if (includeRedirectTo) {
    const rawPath = request.nextUrl.pathname;
    const isSafeToRedirect =
      PROTECTED_PREFIXES.some(p => rawPath.startsWith(p)) &&
      !AUTH_PREFIXES.some(a => rawPath.startsWith(a)) &&
      !rawPath.startsWith('/auth');

    if (isSafeToRedirect) {
      url.searchParams.set('redirectTo', rawPath);
    }
  }
  return url;
}

/**
 * Executes a promise with an upper bound timeout to ensure Vercel Edge limit is never exceeded.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<T>(resolve => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([
    promise
      .then(res => {
        clearTimeout(timer);
        return res;
      })
      .catch(() => {
        clearTimeout(timer);
        return fallback;
      }),
    timeoutPromise,
  ]);
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const isProtectedRoute = PROTECTED_PREFIXES.some(route => pathname.startsWith(route));
  const isAuthRoute = AUTH_PREFIXES.some(route => pathname.startsWith(route));
  const isRootRoute = pathname === '/';

  // Fast path: if not a protected route, auth route, or root, pass through immediately
  if (!isProtectedRoute && !isAuthRoute && !isRootRoute) {
    return NextResponse.next();
  }

  const hasSessionCookie = hasAuthCookie(request);

  // 1. FAST PATH FOR UNAUTHENTICATED REQUESTS (0ms, 0 external network requests)
  if (!hasSessionCookie) {
    if (isProtectedRoute) {
      const redirectUrl = createSafeRedirectUrl('/login', request, true);
      return NextResponse.redirect(redirectUrl);
    }
    if (isRootRoute) {
      const redirectUrl = createSafeRedirectUrl('/login', request, false);
      return NextResponse.redirect(redirectUrl);
    }
    // Public auth routes (/login, /register, etc.) load immediately
    return NextResponse.next();
  }

  // 2. AUTHENTICATED OR POTENTIALLY AUTHENTICATED REQUESTS
  // If user is accessing an auth route with an error or logout flag, don't redirect away
  if (isAuthRoute && (searchParams.has('error') || searchParams.has('logout'))) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Missing credentials - fail safe without hanging
    if (isProtectedRoute) {
      return NextResponse.redirect(createSafeRedirectUrl('/login', request, true));
    }
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Verify session with a strict 2500ms timeout
  const fallbackResult = { data: { user: null }, error: new AuthError('Auth timeout', 408) };
  const authResult = await withTimeout(
    supabase.auth.getUser(),
    2500,
    fallbackResult
  );

  const user = authResult?.data?.user ?? null;

  if (isProtectedRoute && !user) {
    const redirectUrl = createSafeRedirectUrl('/login', request, true);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    // Propagate any cookies that were cleared or modified by Supabase
    supabaseResponse.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  if (isAuthRoute && user) {
    const redirectUrl = createSafeRedirectUrl('/chat', request, false);
    return NextResponse.redirect(redirectUrl);
  }

  if (isRootRoute) {
    const target = user ? '/chat' : '/login';
    const redirectUrl = createSafeRedirectUrl(target, request, false);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _vercel (Vercel system/analytics paths)
     * - favicon.ico, robots.txt, sitemap.xml
     * - api routes (e.g. /api/turn, etc.)
     * - auth callback (/auth/callback)
     * - static files with extensions (svg, png, jpg, jpeg, gif, webp, ico, css, js, etc.)
     */
    '/((?!_next/static|_next/image|_vercel|api|auth/callback|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|json|xml|woff|woff2|ttf|eot|mp3|mp4|webm|webmanifest)$).*)',
  ],
};
