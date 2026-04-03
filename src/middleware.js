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

  // Skip API routes and static assets entirely
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  // Guard /admin/* (soft pre-check, authoritative check is client-side Firebase auth)
  if (pathname.startsWith('/admin/')) {
    if (pathname === '/admin/login') return NextResponse.next();
    const session = request.cookies.get('__session');
    if (!session?.value) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Guard /firm/* (soft pre-check, authoritative check is client-side Firebase auth)
  if (pathname.startsWith('/firm/')) {
    if (pathname === '/firm/login') return NextResponse.next();
    const firmSession = request.cookies.get('__firmSession');
    if (!firmSession?.value) {
      return NextResponse.redirect(new URL('/firm/login', request.url));
    }
  }

  return NextResponse.next();
}

// Run middleware on /admin/* and /firm/* paths
export const config = {
  matcher: ['/admin/:path*', '/firm/:path*'],
};
