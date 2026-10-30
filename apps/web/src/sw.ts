import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist, StaleWhileRevalidate, CacheFirst, ExpirationPlugin } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // 1. Local font files: CacheFirst with 1-year expiration
    {
      matcher: ({ url }: { url: URL }) => url.pathname.startsWith('/fonts/'),
      handler: new CacheFirst({
        cacheName: 'makaremi-fonts',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 30,
            maxAgeSeconds: 31536000,
          }),
        ],
      }),
    },
    // 2. Core content articles, books preview, poetry: StaleWhileRevalidate for Iran offline resilience
    {
      matcher: ({ url }: { url: URL }) =>
        url.pathname.includes('/psychoanalysis/') ||
        url.pathname.includes('/books/') ||
        url.pathname.includes('/poetry/') ||
        url.pathname.includes('/human-rights/'),
      handler: new StaleWhileRevalidate({
        cacheName: 'makaremi-content-cache',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 200,
            maxAgeSeconds: 2592000, // 30 days
          }),
        ],
      }),
    },
    // 3. Compact AVIF / WebP images
    {
      matcher: ({ request }: { request: Request }) => request.destination === 'image',
      handler: new CacheFirst({
        cacheName: 'makaremi-images',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 1209600, // 14 days
          }),
        ],
      }),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: '/fa/offline',
        matcher({ request }: { request: Request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

serwist.addEventListeners();
