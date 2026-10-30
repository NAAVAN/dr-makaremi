// Static legacy WordPress URL mapping to canonical makaremi.com URLs
// Includes both URL-encoded and UTF-8 decoded paths to ensure 100% match rate
export const STATIC_LEGACY_REDIRECTS: Record<string, string> = {
  // 1. Homepages and Landings
  '/home-persan': '/fa',
  '/home-persan/': '/fa',
  '/landing-page-fa_ir': '/fa',
  '/landing-page-fa_ir/': '/fa',
  '/home': '/fr',
  '/home/': '/fr',
  '/welcome': '/en',
  '/welcome/': '/en',

  // 2. Pillar 1: Lacanian Psychoanalysis
  '/aya-ravankavi-elm-ast-fa': '/fa/psychoanalysis/articles/is-psychoanalysis-a-science',
  '/aya-ravankavi-elm-ast-fa/': '/fa/psychoanalysis/articles/is-psychoanalysis-a-science',
  '/etat-limite-un-concept-psychanalytique': '/fr/psychanalyse/articles/etat-limite-concept-psychanalytique',
  '/etat-limite-un-concept-psychanalytique/': '/fr/psychanalyse/articles/etat-limite-concept-psychanalytique',
  '/topologie-des-lieux-saints': '/fr/psychanalyse/articles/topologie-des-lieux-saints',
  '/topologie-des-lieux-saints/': '/fr/psychanalyse/articles/topologie-des-lieux-saints',
  '/role-de-l-inconscient-relation-entre-cavalier-et-cheval': '/fr/psychanalyse/articles/relation-cavalier-cheval',
  '/role-de-l-inconscient-relation-entre-cavalier-et-cheval/': '/fr/psychanalyse/articles/relation-cavalier-cheval',
  '/genre/gen-psychanalyse-fa': '/fa/books?pillar=psychoanalysis',
  '/genre/gen-psychanalyse-fa/': '/fa/books?pillar=psychoanalysis',

  // 3. Pillar 2: Modern Calligraphy & Art Exhibitions
  '/nameyshgah-ir/fa-expo-8': '/fa/art/exhibitions/pompadour-2002-between-sign-and-symbol',
  '/nameyshgah-ir/fa-expo-8/': '/fa/art/exhibitions/pompadour-2002-between-sign-and-symbol',
  '/nameyshgah-ir': '/fa/art/exhibitions',
  '/nameyshgah-ir/': '/fa/art/exhibitions',
  '/galerie-art': '/fr/art/galerie',
  '/galerie-art/': '/fr/art/galerie',

  // 4. Poetry & Audio Recitations
  '/poeme/mra-navazesh-kn': '/fa/poetry/poems/caress-me',
  '/poeme/mra-navazesh-kn/': '/fa/poetry/poems/caress-me',
  '/poeme': '/fa/poetry',
  '/poeme/': '/fa/poetry',

  // 5. Pillar 4: Human Rights & Dadkhahi (1988 Massacre, Khavaran, UNHRC)
  // Both URL-encoded and UTF-8 decoded forms
  '/%D8%A7neshast-paltaki-khavar-fa': '/fa/human-rights/speeches/khavaran-justice-session',
  '/%D8%A7neshast-paltaki-khavar-fa/': '/fa/human-rights/speeches/khavaran-justice-session',
  '/انشست-پالتاکی-خاور-fa': '/fa/human-rights/speeches/khavaran-justice-session',
  '/انشست-پالتاکی-خاور-fa/': '/fa/human-rights/speeches/khavaran-justice-session',
  '/neshast-paltaki-khavar-fa': '/fa/human-rights/speeches/khavaran-justice-session',
  '/neshast-paltaki-khavar-fa/': '/fa/human-rights/speeches/khavaran-justice-session',
  '/lddhi-reports': '/fa/human-rights/lddhi',
  '/lddhi-reports/': '/fa/human-rights/lddhi',

  // 6. Books Showcase
  '/list-ketabhay-farsi-ir': '/fa/books',
  '/list-ketabhay-farsi-ir/': '/fa/books',
  '/genre/farsi-books': '/fa/books',
  '/genre/farsi-books/': '/fa/books',

  // 7. Videos and Speeches
  '/video/hassan-makaremi-parle-de-hafez-de-chiraz': '/fr/media/videos/hafez-de-chiraz',
  '/video/hassan-makaremi-parle-de-hafez-de-chiraz/': '/fr/media/videos/hafez-de-chiraz',
  '/video': '/fa/media/videos',
  '/video/': '/fa/media/videos',
};
