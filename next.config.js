/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  // reactStrictMode intentionally disabled:
  // In development, Strict Mode double-invokes useEffect which causes Two WebGL
  // contexts + two requestAnimationFrame loops to run simultaneously on the
  // WireframeMesh component. Even with cleanup, there is a window where both
  // are active. Re-enable only if you need lifecycle warnings during debugging.
  reactStrictMode: false,

  compress: true,
  poweredByHeader: false,

  compiler: {
    // Strip all console.* calls from production bundle
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Tree-shake Recharts — only bundle the components actually imported
  modularizeImports: {
    recharts: {
      transform: 'recharts/es6/{{member}}',
    },
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 year for immutable images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },

  experimental: {
    optimizeCss: true,
  },

  async headers() {
    return [
      // /_next/static/* is handled automatically by Next.js with immutable headers — no override needed.
      // Near-static files — 30-day cache, stale-while-revalidate for edge nodes.
      // Avoid immutable because public/ filenames are not content-hashed.
      {
        source: '/(favicon.ico|favicon-.*|apple-touch-icon.*|android-chrome-.*|manifest.json|robots.txt|sitemap.xml)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/:path*\\.(png|jpg|jpeg|svg|webp|pdf)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
      // Security headers for all HTML pages (no Cache-Control here — see below)
      {
        source: '/((?!_next/static|_next/image|favicon).*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      // CSP for /register — no external JS allowed; only self + Firebase Storage for file previews.
      // 'unsafe-inline' required for Next.js __NEXT_DATA__ inline script. Upgrade to nonce-based
      // CSP if stricter enforcement is needed in future.
      {
        source: '/register',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, s-maxage=300, stale-while-revalidate=1800' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-src 'none'",
              "object-src 'none'",
              "form-action 'self'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
      // CSP for /admin/* — allows Firebase Auth APIs for signInWithEmailAndPassword
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              // Firebase Auth + Firestore client SDK endpoints
              "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com wss://*.firebaseio.com",
              "frame-src 'none'",
              "object-src 'none'",
              "form-action 'self'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
      // CSP for /firm/* — same Firebase Auth needs as admin
      {
        source: '/firm/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com wss://*.firebaseio.com",
              "frame-src 'none'",
              "object-src 'none'",
              "form-action 'self'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
      // Public static pages — CDN edge cache 6hr, stale-while-revalidate 24hr.
      // These pages have no auth, no dynamic data, and are pre-rendered at build time.
      // s-maxage controls Vercel's CDN; max-age=0 prevents browser from staling silently.
      {
        source: '/',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, s-maxage=21600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/syllabus',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/(about|competition|rules|ams-derive|campus-ambassador-leaderboard)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, s-maxage=21600, stale-while-revalidate=86400' },
        ],
      },
      // Auth-protected pages — never cache. /register is a public form shell and is cached above;
      // registration APIs remain no-store below.
      {
        source: '/(admin|firm)/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
      {
        source: '/(admin|firm)',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
      // Rank page — dynamic data with 60s API cache; match edge TTL
      {
        source: '/rank/:slug',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=120' },
        ],
      },
      // registration-count is explicitly CDN-cached — must precede the catch-all
      {
        source: '/api/registration-count',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=120' },
        ],
      },
      // API routes — never cache at browser or CDN, except explicit public read-only endpoints above.
      {
        source: '/api/:path((?!registration-count$).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
