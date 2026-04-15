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
      // Near-static files — 30-day cache, stale-while-revalidate for edge nodes
      {
        source: '/(favicon.ico|favicon-.*|apple-touch-icon.*|android-chrome-.*|manifest.json|robots.txt|sitemap.xml)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
      // og-image may change per campaign — keep at 1 day
      {
        source: '/og-image\\.jpg',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
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
      // Public static pages — CDN edge cache 1hr, stale-while-revalidate 24hr.
      // These pages have no auth, no dynamic data, and are pre-rendered at build time.
      // s-maxage controls Vercel's CDN; max-age=0 prevents browser from staling silently.
      {
        source: '/',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/(syllabus|about|competition|rules|ams-derive|campus-ambassador-leaderboard)',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
      // Auth-protected + sensitive pages — never cache
      {
        source: '/(register|admin|firm)/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
      {
        source: '/(register|admin|firm)',
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
      // API routes — never cache at browser or CDN
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);