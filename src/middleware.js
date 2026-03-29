import { NextResponse } from 'next/server';

/**
 * Edge Middleware — Admin Auth Pre-Check
 *
 * Runs at the edge (closest CDN node) before any page JS loads.
 * If the user has no `__session` cookie and tries to access /admin/*,
 * they are instantly redirected to /admin/login — no client-side spinner.
 *
 * This is a SOFT guard. The authoritative check remains the client-side
 * Firebase `onAuthStateChanged` call in each admin page. This middleware
 * simply prevents the unnecessary download + render of admin page JS
 * for clearly unauthenticated visitors.
 */
export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Only guard admin pages (not the login page itself, API routes, or static assets)
  if (
    pathname === '/admin/login' ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/')
  ) {
    return NextResponse.next();
  }

  // Check for the lightweight session cookie
  const session = request.cookies.get('__session');

  if (!session?.value) {
    const loginUrl = new URL('/admin/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Only run middleware on /admin/* paths
export const config = {
  matcher: ['/admin/:path*'],
};
