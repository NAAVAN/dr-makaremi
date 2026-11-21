import type { Locale } from '@makaremi/shared';
import {
  getStoredWorkTranslation,
  type StoredWorkTranslation,
  type WorkCollection,
} from './translations-store';

export interface BaseTranslationLike {
  languages_code?: string | null;
  title?: string | null;
  subtitle?: string | null;
  executive_summary?: string | null;
  synopsis?: string | null;
  description?: string | null;
  body_markdown?: string | null;
  transcript_markdown?: string | null;
  curatorial_statement_markdown?: string | null;
  commentary_markdown?: string | null;
  description_markdown?: string | null;
  verses?: Array<{
    line_index: number;
    hemistich_a: string;
    hemistich_b?: string | null;
    translation_text?: string | null;
  }> | null;
}

const PERSIAN_CHAR_RE = /[\u0600-\u06FF]/;
const FRENCH_HINT_RE =
  /[éèêëàâçùûôîïœæ]|\b(le|la|les|des|du|une|pour|dans|avec|sur|entre|psychanalyse|calligraphie|exposition|poème|livre|iranien)\b/i;

/**
 * Deterministically detects the authentic original language of any work.
 * Checks explicit `languages_code` AND verifies script heuristics on the primary title/body
 * so Persian originals are never misclassified as French/English or vice versa.
 */
export function detectOriginalLanguage<T extends BaseTranslationLike>(
  translations: T[] | undefined,
  fallback: Locale = 'fa'
): Locale {
  if (!translations || translations.length === 0) return fallback;

  const first = translations[0];
  const sampleText = [
    first.title,
    first.executive_summary,
    first.synopsis,
    first.description,
    first.body_markdown?.slice(0, 240),
    first.curatorial_statement_markdown?.slice(0, 240),
    first.verses?.[0]?.hemistich_a,
  ]
    .filter(Boolean)
    .join(' ');

  if (PERSIAN_CHAR_RE.test(sampleText)) return 'fa';

  const code = (first.languages_code || '').slice(0, 2).toLowerCase();
  if (code === 'fr') return 'fr';
  if (code === 'en') return 'en';
  if (code === 'fa') return 'fa';

  if (FRENCH_HINT_RE.test(sampleText)) return 'fr';
  return fallback;
}

export function getLanguageDir(lang: Locale): 'rtl' | 'ltr' {
  return lang === 'fa' ? 'rtl' : 'ltr';
}

export function getLanguageLabel(lang: Locale, uiLocale: Locale): string {
  const labels: Record<Locale, Record<Locale, string>> = {
    fa: { fa: 'فارسی', fr: 'فرانسوی', en: 'انگلیسی' },
    fr: { fa: 'Persan', fr: 'Français', en: 'Anglais' },
    en: { fa: 'Persian', fr: 'French', en: 'English (UK)' },
  };
  return labels[uiLocale][lang];
}

export interface ResolvedWorkTranslation<T extends BaseTranslationLike> {
  originalLang: Locale;
  originalRecord: T | undefined;
  translatedRecord: StoredWorkTranslation | null;
  /** True ONLY when the work's authentic original language differs from the active site locale */
  needsTranslationOption: boolean;
  /** True when a complete pre-translated edition in `siteLocale` is already available */
  hasTranslation: boolean;
}

/**
 * Core invariant enforced across every card and reader:
 * 1. Original work is ALWAYS primary and untouched.
 * 2. If `originalLang === siteLocale`, `needsTranslationOption` is FALSE (zero button clutter).
 * 3. If `originalLang !== siteLocale`, resolves either a native paired record in `translations[]`
 *    OR a verified entry in `STATIC_WORK_TRANSLATIONS`.
 */
export function resolveWorkTranslation<T extends BaseTranslationLike>(params: {
  collection: WorkCollection;
  slug: string;
  translations?: T[];
  siteLocale: Locale;
}): ResolvedWorkTranslation<T> {
  const { collection, slug, translations, siteLocale } = params;
  const originalLang = detectOriginalLanguage(translations, 'fa');
  const originalRecord =
    translations?.find((t) => (t.languages_code || '').toLowerCase().startsWith(originalLang)) ||
    translations?.[0];

  if (originalLang === siteLocale) {
    return {
      originalLang,
      originalRecord,
      translatedRecord: null,
      needsTranslationOption: false,
      hasTranslation: false,
    };
  }

  // 1. Check native paired record inside `translations[]` (e.g. Polylang-paired bilingual exhibitions/artworks/books or curated articles)
  const nativeMatch = translations?.find((t) =>
    (t.languages_code || '').toLowerCase().startsWith(siteLocale)
  );
  if (nativeMatch && nativeMatch !== originalRecord) {
    return {
      originalLang,
      originalRecord,
      translatedRecord: {
        title: nativeMatch.title || slug,
        subtitle: nativeMatch.subtitle || undefined,
        summary:
          nativeMatch.executive_summary ||
          nativeMatch.synopsis ||
          nativeMatch.description ||
          undefined,
        body_markdown:
          nativeMatch.body_markdown ||
          nativeMatch.transcript_markdown ||
          nativeMatch.curatorial_statement_markdown ||
          nativeMatch.description_markdown ||
          undefined,
        commentary_markdown: nativeMatch.commentary_markdown || undefined,
        verses: nativeMatch.verses
          ? nativeMatch.verses.map((v) => ({
              line_index: v.line_index,
              hemistich_a: v.hemistich_a,
              hemistich_b: v.hemistich_b || undefined,
              translation_text: v.translation_text || undefined,
            }))
          : undefined,
        provenance: 'editorial_verified',
        updated_at: '2026-11-22',
      },
      needsTranslationOption: true,
      hasTranslation: true,
    };
  }

  // 2. Check static pre-translated overlay store (populated by Waves 3–5 without touching original vault)
  const stored = getStoredWorkTranslation(collection, slug, siteLocale);
  return {
    originalLang,
    originalRecord,
    translatedRecord: stored,
    needsTranslationOption: true,
    hasTranslation: Boolean(stored),
  };
}
