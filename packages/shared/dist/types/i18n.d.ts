export declare const SUPPORTED_LOCALES: readonly ["fa", "fr", "en"];
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export declare const DEFAULT_LOCALE: Locale;
export type TextDirection = 'rtl' | 'ltr';
export interface LanguageMeta {
    code: Locale;
    dbCode: 'fa-IR' | 'fr-FR' | 'en-US';
    name: string;
    nativeName: string;
    direction: TextDirection;
}
export declare const LANGUAGES_MAP: Record<Locale, LanguageMeta>;
//# sourceMappingURL=i18n.d.ts.map