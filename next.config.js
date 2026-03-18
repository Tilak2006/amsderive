/** @type {import('next').NextConfig} */
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
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;