import { NextResponse } from 'next/server';

/**
 * Edge Middleware — Admin, Subadmin & Firm Auth Pre-Check
 *
 * The __session, __subadminSession, and __firmSession cookies are Firebase session cookies
 * minted server-side (HttpOnly). The edge runtime cannot run the Admin SDK,
 * so this remains a soft structural guard (cookie presence check).
 *
 * The authoritative check is performed by every API route via requireAdmin()
 * / requireSubadmin() and by each page's first API call which
 * validates the session cookie server-side via admin.auth().verifySessionCookie().
 *
 * Because cookies are now HttpOnly, they cannot be set or read by client JS,
 * so an attacker cannot forge them via XSS.
 */
export function proxy(request) {
  const { pathname } = request.nextUrl;

  // Skip API routes and static assets entirely
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  // Guard /admin/* — redirect to login if no session cookie present
  if (pathname.startsWith('/admin/')) {
    if (pathname === '/admin/login') return NextResponse.next();
    const session = request.cookies.get('__session');
    if (!session?.value) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Guard /firm/* — redirect to login if no firm session cookie present
  if (pathname.startsWith('/firm/')) {
    if (pathname === '/firm/login') return NextResponse.next();
    const firmSession = request.cookies.get('__firmSession');
    if (!firmSession?.value) {
      return NextResponse.redirect(new URL('/firm/login', request.url));
    }
  }

  // Guard /subadmin/* — redirect to login if no subadmin session cookie present
  if (pathname.startsWith('/subadmin/')) {
    if (pathname === '/subadmin/login') return NextResponse.next();
    const subadminSession = request.cookies.get('__subadminSession');
    if (!subadminSession?.value) {
      return NextResponse.redirect(new URL('/subadmin/login', request.url));
    }
  }

  return NextResponse.next();
}

// Run on protected account paths
export const config = {
  matcher: ['/admin/:path*', '/firm/:path*', '/subadmin/:path*'],
};
