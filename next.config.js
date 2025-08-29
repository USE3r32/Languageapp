/** @type {import('next').NextConfig} */
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  register: true,
  skipWaiting: true,
  buildExcludes: [/middleware-manifest\.json$/],
  disable: process.env.NODE_ENV === 'development'
});

const nextConfig = withPWA({
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000']
    },
  },
  // Moved from experimental in Next.js 15.5.2
  serverExternalPackages: ['@clerk/nextjs'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // Additional configuration for Next.js 15.5.2 compatibility
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ensure proper handling of async context in server components
      config.externals = config.externals || [];
      config.externals.push({
        '@clerk/nextjs/server': '@clerk/nextjs/server',
      });
    }
    return config;
  },
});

module.exports = nextConfig;