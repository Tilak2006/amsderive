/** @type {import('next').NextConfig} */
const nextConfig = {
  // reactStrictMode intentionally disabled:
  // In development, Strict Mode double-invokes useEffect which causes Two WebGL
  // contexts + two requestAnimationFrame loops to run simultaneously on the
  // WireframeMesh component. Even with cleanup, there is a window where both
  // are active. Re-enable only if you need lifecycle warnings during debugging.
  reactStrictMode: false,

  compiler: {
    // Strip all console.* calls from production bundle
    removeConsole: process.env.NODE_ENV === 'production',
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;