import type { WordPressPostRecord, EnrichedMigrationArticle } from './types';
import { enrichArticle } from './enrichment-pipeline';
import { countWords } from './persian-normalizer';

/**
 * Converts legacy WordPress HTML and shortcodes into clean Markdown.
 */
export function convertWpHtmlToMarkdown(html: string): string {
  if (!html) return '';

  let md = html;

  // 1. Remove WordPress shortcodes: [caption ...], [/caption], [gallery ...], etc.
  md = md.replace(/\[caption[^\]]*\]/gi, '');
  md = md.replace(/\[\/caption\]/gi, '');
  md = md.replace(/\[gallery[^\]]*\]/gi, '');
  md = md.replace(/\[\/?vc_[^\]]*\]/gi, '');

  // 2. Convert standard HTML tags
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');

  md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (_m, content) => {
    return content.trim().split('\n').map((line: string) => `> ${line.trim()}`).join('\n') + '\n\n';
  });

  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

  md = md.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  md = md.replace(/<\/?ul[^>]*>/gi, '\n');
  md = md.replace(/<\/?ol[^>]*>/gi, '\n');

  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gis, '$1\n\n');

  // Strip remaining HTML tags
  md = md.replace(/<[^>]+>/g, '');

  // Unescape standard HTML entities
  md = md
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8230;/g, '…');

  return md.trim();
}

/**
 * Migrates WordPress posts into the unified enriched archive format.
 */
export async function migrateWordPressPosts(
  posts: WordPressPostRecord[]
): Promise<EnrichedMigrationArticle[]> {
  const enrichedList: EnrichedMigrationArticle[] = [];

  for (const wpPost of posts) {
    // Only migrate published or reviewable posts
    if (wpPost.post_status !== 'publish' && wpPost.post_status !== 'pending') {
      continue;
    }

    const cleanMarkdown = convertWpHtmlToMarkdown(wpPost.post_content);
    if (countWords(cleanMarkdown) < 50) {
      continue; // Filter short fragments
    }

    const enriched = await enrichArticle({
      source: 'wordpress',
      sourceId: String(wpPost.id),
      sourceUrl: `https://makaremi.com/?p=${wpPost.id}`,
      timestamp: wpPost.post_date,
      rawTitle: wpPost.post_title,
      rawContent: cleanMarkdown,
      isMergedThread: false,
    });

    enrichedList.push(enriched);
  }

  return enrichedList;
}
