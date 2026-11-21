import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const aiAgents = [
    'GPTBot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'ClaudeBot',
    'Claude-SearchBot',
    'Claude-User',
    'Claude-Web',
    'PerplexityBot',
    'Perplexity-User',
    'Google-Extended',
    'Googlebot',
    'Applebot-Extended',
  ];

  const publicAllows = [
    '/',
    '/llms.txt',
    '/llms-full.txt',
    '/.well-known/agent-card.json',
    '/.well-known/makaremi-public-key.pem',
    '/api/knowledge-graph',
    '/api/mcp',
    '/*.md',
  ];

  // Never block /_next/ static CSS/JS assets so search crawlers can render Core Web Vitals properly.
  // Disallow only private/internal mutation endpoints and non-indexable local studio/offline routes.
  const privateDisallows = [
    '/api/revalidate',
    '/api/newsletter',
    '/api/curation-manifest',
    '/api/etl/',
    '/api/webhooks/',
    '/fa/curation-studio',
    '/fr/curation-studio',
    '/en/curation-studio',
    '/fa/offline',
    '/fr/offline',
    '/en/offline',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: publicAllows,
        disallow: privateDisallows,
      },
      {
        userAgent: aiAgents,
        allow: publicAllows,
        disallow: privateDisallows,
      },
    ],
    sitemap: 'https://makaremi.com/sitemap.xml',
    host: 'https://makaremi.com',
  };
}
