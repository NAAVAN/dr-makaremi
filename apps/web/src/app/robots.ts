import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const aiAgents = [
    'GPTBot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'ClaudeBot',
    'Claude-Web',
    'PerplexityBot',
    'Google-Extended',
    'Googlebot',
    'Applebot-Extended',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/llms.txt', '/llms-full.txt', '/api/knowledge-graph', '/*.md'],
        disallow: ['/api/revalidate', '/api/newsletter', '/_next/'],
      },
      {
        userAgent: aiAgents,
        allow: [
          '/',
          '/llms.txt',
          '/llms-full.txt',
          '/api/knowledge-graph',
          '/*.md',
        ],
        disallow: ['/api/revalidate', '/api/newsletter', '/_next/'],
      },
    ],
    sitemap: 'https://makaremi.com/sitemap.xml',
    host: 'https://makaremi.com',
  };
}
