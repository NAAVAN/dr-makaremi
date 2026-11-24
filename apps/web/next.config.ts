import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  transpilePackages: ['@makaremi/shared'],
  skipTrailingSlashRedirect: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  outputFileTracingIncludes: {
    '/api/**': [
      '../../packages/shared/src/data/vault/**/*',
      '../../packages/shared/src/data/translations/**/*',
      '../../packages/shared/src/data/transcripts/**/*',
      '../../packages/shared/src/data/curator-overlays/**/*',
      '../../packages/shared/src/data/commerce/**/*',
      '../../packages/shared/src/data/glossary-lock.json',
    ],
    '/[locale]/**': [
      '../../packages/shared/src/data/vault/**/*',
      '../../packages/shared/src/data/translations/**/*',
      '../../packages/shared/src/data/transcripts/**/*',
      '../../packages/shared/src/data/curator-overlays/**/*',
      '../../packages/shared/src/data/commerce/**/*',
      '../../packages/shared/src/data/glossary-lock.json',
    ],
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'admin.makaremi.com',
        pathname: '/assets/**',
      },
      {
        protocol: 'https',
        hostname: 'iiif.makaremi.com',
        pathname: '/iiif/**',
      },
      {
        protocol: 'https',
        hostname: 'www.makaremi.com',
        pathname: '/wp-content/**',
      },
      {
        protocol: 'https',
        hostname: 'makaremi.com',
        pathname: '/wp-content/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/vi/**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=(), payment=(self "https://js.stripe.com")' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
              "img-src 'self' data: blob: https://admin.makaremi.com https://iiif.makaremi.com https://www.makaremi.com https://makaremi.com http://www.makaremi.com https://i.ytimg.com https://hassanmakaremi.com https://www.hassanmakaremi.com",
              "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net",
              "connect-src 'self' https://admin.makaremi.com https://iiif.makaremi.com https://api.stripe.com https://checkout.stripe.com",
              "frame-src 'self' https://www.youtube-nocookie.com https://player.vimeo.com https://js.stripe.com https://checkout.stripe.com https://hooks.stripe.com",
              "media-src 'self' blob: data:",
              "frame-ancestors 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://checkout.stripe.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
