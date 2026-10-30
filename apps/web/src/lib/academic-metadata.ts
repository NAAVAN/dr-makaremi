import type { Article, Book, Locale } from '@makaremi/shared';

/**
 * Sanitizes input strings by stripping CR/LF line breaks and control characters
 * to prevent meta-tag and HTTP header injection attacks.
 */
export function sanitizeMetaString(val: string | null | undefined): string {
  if (!val) return '';
  return val
    .replace(/[\r\n\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generates HighWire Press and Dublin Core tags for Articles
 * Compatible with Google Scholar, Zotero, Mendeley, and ResearchGate crawlers.
 */
export function buildArticleAcademicMeta(
  article: Article,
  locale: Locale = 'fa'
): Record<string, string> {
  const trans =
    article.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    article.translations?.[0];

  const pillarSlug =
    article.pillar === 'psychoanalysis'
      ? locale === 'fr'
        ? 'psychanalyse'
        : 'psychoanalysis'
      : article.pillar === 'art_calligraphy'
      ? 'art'
      : article.pillar === 'cultural_strategy'
      ? 'strategy'
      : 'human-rights';

  const baseUrl = 'https://makaremi.com';
  const articleUrl = `${baseUrl}/${locale}/${pillarSlug}/articles/${article.slug}`;
  const markdownUrl = `${articleUrl}.md`;

  const title = sanitizeMetaString(trans?.title || article.slug);
  const summary = sanitizeMetaString(trans?.executive_summary || '');
  const pubDate = sanitizeMetaString(
    (article.published_at || article.created_at).slice(0, 10).replace(/-/g, '/')
  );
  const isoDate = sanitizeMetaString(
    (article.published_at || article.created_at).slice(0, 10)
  );

  return {
    // HighWire Press Tags (Google Scholar Native)
    citation_title: title,
    citation_author: 'Makaremi, Hassan',
    citation_author_institution:
      'Sorbonne University; League for Defence of Human Rights in Iran (LDDHI)',
    citation_publication_date: pubDate,
    citation_online_date: pubDate,
    citation_language: locale,
    citation_abstract_html_url: articleUrl,
    citation_fulltext_html_url: articleUrl,
    citation_markdown_url: markdownUrl,
    citation_publisher: 'Official Digital Archive of Dr. Hassan Makaremi',

    // Dublin Core Tags
    'DC.title': title,
    'DC.creator': 'Dr. Hassan Makaremi',
    'DC.subject': `Lacanian Psychoanalysis, ${article.pillar}, Clinical Studies`,
    'DC.description': summary,
    'DC.publisher': 'Dr. Hassan Makaremi Digital Archive',
    'DC.date': isoDate,
    'DC.type': 'Text.Article',
    'DC.format': 'text/html',
    'DC.identifier': articleUrl,
    'DC.language': locale,
  };
}

/**
 * Generates HighWire Press and Dublin Core tags for Books
 */
export function buildBookAcademicMeta(
  book: Book,
  locale: Locale = 'fa'
): Record<string, string> {
  const trans =
    book.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    book.translations?.[0];

  const baseUrl = 'https://makaremi.com';
  const bookUrl = `${baseUrl}/${locale}/books/${book.slug}`;
  const markdownUrl = `${bookUrl}.md`;

  const title = sanitizeMetaString(trans?.title || book.slug);
  const summary = sanitizeMetaString(trans?.synopsis || '');
  const pubYear = sanitizeMetaString(
    book.publication_year ? `${book.publication_year}/01/01` : '2012/01/01'
  );
  const isoYear = sanitizeMetaString(
    book.publication_year ? `${book.publication_year}-01-01` : '2012-01-01'
  );
  const publisher = sanitizeMetaString(trans?.publisher_name || 'Publisher');
  const isbn = sanitizeMetaString(book.isbn_13 || '');

  const meta: Record<string, string> = {
    citation_title: title,
    citation_author:
      book.slug === 'lacan-seminar-3-psychoses'
        ? 'Lacan, Jacques; Makaremi, Hassan (Translator)'
        : 'Makaremi, Hassan',
    citation_author_institution: 'Sorbonne University',
    citation_publication_date: pubYear,
    citation_online_date: pubYear,
    citation_language: locale,
    citation_abstract_html_url: bookUrl,
    citation_fulltext_html_url: bookUrl,
    citation_markdown_url: markdownUrl,
    citation_publisher: publisher,

    'DC.title': title,
    'DC.creator': 'Dr. Hassan Makaremi',
    'DC.subject': `Book, ${book.pillar}`,
    'DC.description': summary,
    'DC.publisher': publisher,
    'DC.date': isoYear,
    'DC.type': 'Text.Book',
    'DC.format': 'text/html',
    'DC.identifier': bookUrl,
    'DC.language': locale,
  };

  if (isbn) {
    meta.citation_isbn = isbn;
    meta['DC.identifier.ISBN'] = isbn;
  }

  return meta;
}
