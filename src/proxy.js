import { NextResponse } from 'next/server';

/**
 * Edge Proxy — Admin & Firm Auth Pre-Check
 *
 * Runs at the edge (closest CDN node) before any page JS loads.
 * Soft guard only — authoritative check remains client-side Firebase auth.
 * Prevents unnecessary download + render of protected page JS for
 * clearly unauthenticated visitors.
 */
export function proxy(request) {
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

// Run on /admin/* and /firm/* paths
export const config = {
  matcher: ['/admin/:path*', '/firm/:path*'],
};
