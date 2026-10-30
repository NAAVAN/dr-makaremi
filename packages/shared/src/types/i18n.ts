export const SUPPORTED_LOCALES = ['fa', 'fr', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'fa';

export type TextDirection = 'rtl' | 'ltr';

export interface LanguageMeta {
  code: Locale;
  dbCode: 'fa-IR' | 'fr-FR' | 'en-US';
  name: string;
  nativeName: string;
  direction: TextDirection;
}

export const LANGUAGES_MAP: Record<Locale, LanguageMeta> = {
  fa: {
    code: 'fa',
    dbCode: 'fa-IR',
    name: 'Persian',
    nativeName: 'فارسی',
    direction: 'rtl',
  },
  fr: {
    code: 'fr',
    dbCode: 'fr-FR',
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
  },
  en: {
    code: 'en',
    dbCode: 'en-US',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
  },
};
