import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  LANGUAGES_MAP,
  type Locale,
  type TextDirection,
} from '@makaremi/shared';

export { SUPPORTED_LOCALES, DEFAULT_LOCALE, LANGUAGES_MAP };
export type { Locale, TextDirection };

export function isValidLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}

export function getDirection(locale: Locale): TextDirection {
  return LANGUAGES_MAP[locale]?.direction || 'rtl';
}

export function getNativeLanguageName(locale: Locale): string {
  return LANGUAGES_MAP[locale]?.nativeName || 'فارسی';
}
