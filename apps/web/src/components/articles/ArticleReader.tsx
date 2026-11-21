import React from 'react';
import Link from 'next/link';
import { Calendar, User, FileText, Download } from 'lucide-react';
import { ContentIntegrityBadge } from './ContentIntegrityBadge';
import { AeoKeyTakeaways } from './AeoKeyTakeaways';
import { BilingualWorkReader } from '@/components/i18n/BilingualWorkReader';
import { renderSafeMarkdown } from '@/lib/markdown';
import { resolveWorkTranslation } from '@/lib/work-language';
import type { Article, ArticleTranslation, LacanianGlossaryTerm, Locale } from '@makaremi/shared';

interface ArticleReaderProps {
  article: Article;
  translation?: ArticleTranslation;
  glossaryTerms: LacanianGlossaryTerm[];
  locale: Locale;
}

export function ArticleReader({
  article,
  translation,
  glossaryTerms,
  locale,
}: ArticleReaderProps) {
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';

  const resolved = resolveWorkTranslation({
    collection: 'articles',
    slug: article.slug,
    translations: article.translations,
    siteLocale: locale,
  });

  const orig = resolved.originalRecord || translation;
  const title = orig?.title || article.slug;
  const summary = orig?.executive_summary || '';
  const body = orig?.body_markdown || '';
  const dateStr = article.published_at || article.created_at;
  const pillarRoute =
    article.pillar === 'psychoanalysis'
      ? isFr
        ? 'psychanalyse'
        : 'psychoanalysis'
      : article.pillar === 'art_calligraphy'
        ? 'art'
        : article.pillar === 'cultural_strategy'
          ? 'strategy'
          : 'human-rights';

  return (
    <article className="max-w-4xl mx-auto space-y-8">
      {/* Markdown Twin Link for AI/SEO Crawlers */}
      <link
        rel="alternate"
        type="text/markdown"
        href={`/${locale}/${pillarRoute}/articles/${article.slug}.md`}
        title="Markdown Twin"
      />

      {/* Header Info */}
      <header className="space-y-4 border-b border-[var(--border-subtle)] pb-6">
        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--foreground-muted)]">
          <span className="font-mono uppercase px-2.5 py-0.5 rounded-full bg-[var(--surface-sunken)] border border-[var(--border-subtle)] font-bold text-[var(--primary)]">
            {article.pillar.replace('_', ' ')}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            <time dateTime={dateStr}>{dateStr.slice(0, 10)}</time>
          </span>
          <address className="not-italic flex items-center gap-1">
            <User size={14} />
            <span>{isFa ? 'دکتر حسن مکارمی' : isFr ? 'Dr Hassan Makaremi' : 'Dr Hassan Makaremi'}</span>
          </address>
        </div>

        {/* Single H1 Tag */}
        <h1 className="text-2xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight">
          {title}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <ContentIntegrityBadge hash={article.content_sha256} locale={locale} slug={article.slug} />

          <div className="flex flex-wrap items-center gap-2">
            {article.pdf_url && (
              <a
                href={article.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 border border-[var(--primary)]/30 text-[var(--primary)] transition-colors"
              >
                <Download size={13} />
                <span>{isFa ? 'نسخه اصلی PDF مقاله' : isFr ? 'PDF Original' : 'Original PDF'}</span>
              </a>
            )}
            <a
              href={`/api/censorship-bypass/bundle?slug=${encodeURIComponent(article.slug)}&locale=${locale}`}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-300 transition-colors"
              title={
                isFa
                  ? 'دانلود نسخه مستقل آفلاین ضدسانسور'
                  : isFr
                    ? 'Télécharger le bundle hors-ligne anti-censure'
                    : 'Download standalone offline bundle'
              }
            >
              <Download size={13} />
              <span>{isFa ? 'بسته آفلاین ضدسانسور' : isFr ? 'Bundle Hors-Ligne' : 'Offline Bundle'}</span>
            </a>

            <Link
              href={`/${locale}/${pillarRoute}/articles/${article.slug}.md`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-[var(--surface-sunken)] hover:bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--foreground)] transition-colors"
              title="Clean Markdown Twin for AI Agents (AEO/GEO)"
            >
              <FileText size={13} />
              <span>.md (AI Twin)</span>
            </Link>
          </div>
        </div>
      </header>

      {/* AEO Key Takeaways Box (CNRS Empirical Research & Core Answers) */}
      <AeoKeyTakeaways
        slug={article.slug}
        locale={locale}
        title={title}
        executiveSummary={summary}
      />

      {/* 3-Mode Scholarly Bilingual Reader (Original Default / Site Translation / Side-by-Side) */}
      <BilingualWorkReader
        originalLang={resolved.originalLang}
        siteLocale={locale}
        translated={resolved.translatedRecord}
        originalContent={
          <div className="space-y-8">
            {summary && (
              <section
                aria-label={isFa ? 'چکیده مدیریتی' : isFr ? 'Résumé analytique' : 'Executive Summary'}
                className="aeo-summary-box"
              >
                <blockquote className="executive-summary p-6 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] shadow-sm text-base sm:text-lg italic leading-relaxed text-[var(--foreground)]">
                  <span className="block text-xs font-bold uppercase tracking-wider text-[var(--primary)] not-italic mb-2">
                    {isFa
                      ? 'چکیده مدیریتی و یافته‌های کلیدی:'
                      : isFr
                        ? 'Résumé analytique :'
                        : 'Executive Summary:'}
                  </span>
                  {summary}
                </blockquote>
              </section>
            )}

            <section
              aria-label={isFa ? 'متن اصلی مقاله' : isFr ? 'Texte intégral de l’article' : 'Article Body'}
              className="article-body text-base sm:text-lg leading-loose text-[var(--foreground)] font-serif space-y-6 break-words"
            >
              {renderSafeMarkdown(body, { glossaryTerms })}
            </section>
          </div>
        }
      />

      {/* Academic Citation Footer */}
      <footer className="mt-12 pt-6 border-t border-[var(--border-subtle)] rounded-2xl bg-[var(--surface-sunken)] p-6 text-xs text-[var(--foreground-muted)] space-y-2">
        <span className="font-bold text-[var(--foreground)] block">
          {isFa ? 'ارجاع علمی پیشنهادی (Citation):' : isFr ? 'Citation académique suggérée :' : 'Suggested Academic Citation:'}
        </span>
        <p className="font-mono text-[11px] leading-relaxed select-all bg-[var(--surface-card)] p-3 rounded-lg border border-[var(--border-subtle)]">
          Makaremi, H. ({dateStr.slice(0, 4)}). &quot;{title}&quot;. Official Digital Archive, https://makaremi.com/{locale}/{pillarRoute}/articles/{article.slug}
        </p>
      </footer>
    </article>
  );
}
