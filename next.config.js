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
  // Next.js 15.5.2 specific configuration
  webpack: (config, { isServer, dev }) => {
    // Fix for middleware compilation in Next.js 15.5.2
    if (!isServer && !dev) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Ensure proper handling of async context in server components
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@clerk/nextjs/server': '@clerk/nextjs/server',
      });
    }
    
    return config;
  },
  // Fix for Next.js 15.5.2 middleware compilation
  transpilePackages: ['@clerk/nextjs'],
});

module.exports = nextConfig;