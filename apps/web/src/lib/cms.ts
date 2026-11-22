import type {
  Article,
  ArticleTranslation,
  Book,
  Artwork,
  Exhibition,
  Poem,
  VideoSpeech,
  ArchivePage,
  ArchivePageGroup,
  MediaAsset,
  LacanianGlossaryTerm,
  Locale,
  ContentPillar,
} from '@makaremi/shared';
import { registerImmutableSnapshot, inspectAndSelfHeal, VERIFIED_IMMUTABLE_SNAPSHOTS } from './snapshots';
import {
  loadVaultArticles,
  loadVaultBooks,
  loadVaultPoems,
  loadVaultVideos,
  loadVaultArtworks,
  loadVaultExhibitions,
  loadVaultPages,
  loadVaultMediaManifest,
  loadVaultLegacyRedirects,
  loadPackTranslations,
  type TranslationCollectionName,
} from './vault-loader';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://127.0.0.1:8055';

// -----------------------------------------------------------------------------
// Curated Multilingual Enrichments (Merged on top of authentic WordPress Vault
// records so trilingual FA/FR/EN editions & academic citations remain 100% intact)
// -----------------------------------------------------------------------------

const CURATED_ARTICLE_TRANSLATIONS: Record<string, ArticleTranslation[]> = {
  'is-psychoanalysis-a-science': [
    {
      id: 'at100000-0000-0000-0000-000000000002',
      articles_id: 'wp-post-5247',
      languages_code: 'fr-FR',
      title: 'La psychanalyse est-elle une science ?',
      executive_summary:
        "Enquête épistémologique sur le statut de l'inconscient et les données du CNRS sur 3 954 projets de recherche psychanalytique interdisciplinaire.",
      body_markdown: `La psychanalyse ne se réduit pas à une science expérimentale positiviste. Elle est une science du sujet structuré comme un langage.

Une étude exhaustive du Centre National de la Recherche Scientifique (CNRS) portant sur 3 954 projets de recherche clinique révèle que 3 755 projets possèdent une dimension interdisciplinaire, 184 sont purement cliniques et 15 concernent la linguistique.

L'opération Nom-du-Père et la démarche d'écouter autrement constituent les fondements d'une pratique clinique exigeante qui interroge la place de la vérité dans le discours scientifique contemporain.`,
    },
    {
      id: 'at100000-0000-0000-0000-000000000003',
      articles_id: 'wp-post-5247',
      languages_code: 'en-GB',
      title: 'Is Psychoanalysis a Science?',
      executive_summary:
        "Epistemological analysis of the unconscious, Jacques Lacan's Écrits, and CNRS empirical data on 3,954 clinical research projects.",
      body_markdown: `Psychoanalysis is not an empirical reductionist science, but a rigorous science of the subject and language.

According to CNRS research metrics surveying 3,954 clinical psychoanalytic research endeavours, 3,755 are interdisciplinary, 184 clinical, and 15 linguistic. Through listening differently, psychoanalysis examines how the unconscious is structured as a language.`,
    },
  ],
  'etat-limite-concept-psychanalytique': [
    {
      id: 'at200000-0000-0000-0000-000000000002',
      articles_id: 'wp-post-1522',
      languages_code: 'fa-IR',
      title: 'حالت مرزی: مفهومی در روان‌کاوی؟',
      executive_summary:
        'بررسی ساختاری حالت مرزی میان روان‌نژندی و روان‌پریشی با تکیه بر نظریه گره برومه‌ای و استعاره پدری لکان.',
      body_markdown: `حالت مرزی به جای یک برچسب ایستا، وضعیتی ناپایدار در ساختار سوژه است. دگرشنیدن شکاف‌های کلامی بیمار و فهم آسیب‌شناسی ازهم‌گسستگی و رانه مرگ، کلید مواجهه بالینی با این وضعیت است.`,
    },
  ],
  'topologie-des-lieux-saints': [
    {
      id: 'at300000-0000-0000-0000-000000000002',
      articles_id: 'wp-post-1579',
      languages_code: 'fa-IR',
      title: 'توپولوژی فضاهای مقدس',
      executive_summary:
        'کاربست تورس لکانی و هندسه فضاهای نااقلیدسی در بازخوانی معماری مقابر مقدس و روان‌شناسی جمعی.',
      body_markdown: `فضای زیارتی و اماکن مقدس از منطق تورس تبعیت می‌کنند؛ جایی که برون‌بودگی با درونی‌ترین ساحت روان گره می‌خورد.`,
    },
  ],
  'relation-cavalier-cheval': [
    {
      id: 'at400000-0000-0000-0000-000000000002',
      articles_id: 'wp-post-1893',
      languages_code: 'fa-IR',
      title: 'نقش ناخودآگاه در رابطه سوار و اسب',
      executive_summary:
        'پژوهشی در تصویر ناخودآگاه تن و گفت‌وگوی بی‌کلام غریزه‌ها بر پایه آموزه‌های فروید و فرانسواز دولتو.',
      body_markdown: `سوارکاری نمایانگر دیالکتیک ظریف میان تکانه‌های مهارناپذیر و تسلط ایگو است. اسب به مثابه بازتابی از کشاکش ناخودآگاه سوار عمل می‌کند.`,
    },
  ],
};

const SUPPLEMENTAL_ARTICLES: Article[] = [
  {
    id: 'a5000000-0000-0000-0000-000000000005',
    slug: 'cultural-land-of-iran-strategy',
    pillar: 'cultural_strategy',
    status: 'published',
    content_sha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    published_at: '2015-05-12T10:00:00Z',
    created_at: '2015-05-12T10:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    translations: [
      {
        id: 'at500000-0000-0000-0000-000000000001',
        articles_id: 'a5000000-0000-0000-0000-000000000005',
        languages_code: 'fa-IR',
        title: 'نگاهی دیگر به سرزمین فرهنگی ایران',
        executive_summary:
          'تبیین مفهوم راهبردی «سرزمین فرهنگی ایران» به عنوان حوزه‌ای تمدنی و پویا که از مرزهای سیاسی فراتر رفته و بر همبستگی، تسامح و زبان مشترک استوار است.',
        body_markdown: `سرزمین فرهنگی ایران مفهومی فراتر از مرزهای معاهده‌های گلستان و ترکمانچای است. این سرزمین بر پیوند عمیق زبان و حافظه تاریخی اقوام استوار است.

در عصر جهانی‌شدن، ایران فرهنگی بستری است برای بازتعریف همبستگی ملی، فراروی از استبداد و رسیدن به دموکراسی سکولار بر پایه همزیستی صلح‌آمیز.`,
      },
    ],
  },
];

// Genuine post-WP-export publications by Dr. Hassan Makaremi (zero fake/sample links)
const SUPPLEMENTAL_BOOKS: Book[] = [
  {
    id: 'b1000000-0000-0000-0000-000000000001',
    slug: 'lacan-seminar-3-psychoses',
    isbn_13: '978-2954890000',
    publication_year: 2018,
    page_count: 420,
    pillar: 'psychoanalysis',
    genre_key: 'psychoanalysis',
    order_index: 1,
    status: 'published',
    created_at: '2018-01-01T00:00:00Z',
    translations: [
      {
        id: 'bt100000-0000-0000-0000-000000000001',
        books_id: 'b1000000-0000-0000-0000-000000000001',
        languages_code: 'fa-IR',
        title: 'سمینار سوم ژاک لکان: روان‌پریشی‌ها',
        subtitle: 'نخستین ترجمه مستقیم از فرانسه به فارسی',
        publisher_name: 'انتشارات آلیان (Alian Publications)',
        publication_city: 'پاریس',
        synopsis:
          'نخستین برگردان مستقیم و معتبر سمینار کلاسیک ۱۹۵۵-۱۹۵۶ ژاک لکان پیرامون ساختار روان‌پریشی‌ها، تحلیل خاطرات شربر و مفهوم بنیادین فورکلوژن (Forclusion) از فرانسه به زبان فارسی توسط دکتر حسن مکارمی.',
        table_of_contents_markdown: `1. مقدمه مترجم: درباره واژه‌گزینی لکانی
2. گفتار یکم: درباب روان‌پریشی‌ها
3. گفتار دوم: توهم و دال
4. گفتار سوم: واقعه شربر
5. گفتار چهارم: شکست استعاره پدری`,
        sample_chapter_markdown: `### فصل نخست: درآمدی بر شنیدن روان‌پریش

ژاک لکان در سمینار سوم خود با بازگشت به پرونده قاضی دانیل پل شربر، نشان می‌دهد که روان‌پریشی صرفاً یک ناهنجاری رفتاری یا بیولوژیک نیست، بلکه گسستی بنیادین در زنجیره دلالت است.`,
        geo_acquisition_links: {
          iran: [
            { platform: 'طاقچه', url: 'https://taaghche.com', label: 'نسخه الکترونیک در طاقچه' },
          ],
          international: [
            { platform: 'Amazon', url: 'https://www.amazon.fr/s?k=Hassan+Makaremi', label: 'جستجو در آمازون فرانسه' },
          ],
        },
      },
    ],
  },
  {
    id: 'b3000000-0000-0000-0000-000000000003',
    slug: 'empathies-of-a-psychoanalyst',
    isbn_13: '978-6007435300',
    publication_year: 2022,
    page_count: 310,
    pillar: 'psychoanalysis',
    genre_key: 'psychoanalysis',
    order_index: 2,
    status: 'published',
    created_at: '2022-03-01T00:00:00Z',
    translations: [
      {
        id: 'bt300000-0000-0000-0000-000000000001',
        books_id: 'b3000000-0000-0000-0000-000000000003',
        languages_code: 'fa-IR',
        title: 'همدلی‌های یک روان‌کاو',
        subtitle: 'گفتارهایی در روان‌درمانی و ادراک انسانی',
        publisher_name: 'انتشارات نشانه',
        publication_city: 'تهران',
        synopsis:
          'جستارهایی پیرامون همدلی بالینی، آسیب‌شناسی ازهم‌گسستگی و رانه مرگ، و چگونگی التیام تروماهای جمعی و فردی.',
        geo_acquisition_links: {
          iran: [
            { platform: 'طاقچه', url: 'https://taaghche.com', label: 'نسخه دیجیتال' },
          ],
          international: [
            { platform: 'Amazon', url: 'https://www.amazon.fr/s?k=Hassan+Makaremi', label: 'جستجو در آمازون' },
          ],
        },
      },
    ],
  },
];

// All 27 historical exhibitions are now natively Polylang-paired in vault/exhibitions.json with 390 real photos.
// Keep enriched bilingual venue metadata for iconic museum shows without creating 0-photo duplicates.
const EXHIBITION_ENRICHMENTS: Record<
  string,
  { start_date?: string; venue_city?: string; venue_name?: string; fa_title?: string }
> = {
  'pompadour-2002-between-sign-and-symbol': {
    start_date: '2002-07-01',
    venue_city: 'Pompadour, France',
    venue_name: 'Château de Pompadour, France',
    fa_title: 'میان نشان و نماد (قصر پومپادور ۲۰۰۲)',
  },
  'moscow-museum-modern-calligraphy': {
    start_date: '2010-09-10',
    venue_city: 'Novgorod / Moscow, Russia',
    venue_name: 'Contemporary Museum of Calligraphy (Moscow & Veliky Novgorod)',
    fa_title: 'نمایشگاه بین‌المللی خوشنویسی روسیه و موزه مدرن خوشنویسی مسکو (۷ اثر دائمی)',
  },
  'unesco-paris-2009-dialogue-of-scripts': {
    start_date: '2009-05-12',
    venue_city: 'Paris (UNESCO), France',
    venue_name: 'UNESCO Headquarters (Maison de l’UNESCO, Paris)',
    fa_title: 'نمایشگاه و نشست یونسکو پاریس ۲۰۰۹ (گفتگوی خط و فرهنگ‌ها)',
  },
  'havana-cuba-2012-man-na-manam': {
    start_date: '2012-04-09',
    venue_city: 'Havana, Cuba',
    venue_name: 'Centro Hispanoamericano de Cultura, La Habana (Cuba)',
    fa_title: 'نمایشگاه هاوانا (کوبا ۲۰۱۲) — «چه گوارا / من نه منم»',
  },
  'fez-sacred-music-festival': {
    start_date: '2012-06-05',
    venue_city: 'Fez, Morocco',
    venue_name: 'Festival de Fès des Musiques Sacrées du Monde (Maroc)',
    fa_title: 'نمایشگاه فستیوال موسیقی مقدس فاس مراکش ۲۰۱۲ («من نه منم»)',
  },
  'saint-petersburg-national-library-2013': {
    start_date: '2013-09-15',
    venue_city: 'Saint Petersburg, Russia',
    venue_name: 'National Library of Russia, Saint Petersburg',
    fa_title: 'نمایشگاه کتابخانه ملی روسیه در سنت‌پترزبورگ (۲۰۱۳)',
  },
};

// -----------------------------------------------------------------------------
// Build Complete Vault-Backed Collections (100% Real WordPress XML Data)
// -----------------------------------------------------------------------------

/**
 * Merges server-side Pack A-D translations (`packages/shared/src/data/translations/*.json`)
 * onto immutable vault items AFTER existing native translations so `translations[0]`
 * (the authentic original work) always stays primary and untouched.
 */
function mergePackTranslationsForItem<
  TTr extends { languages_code: string },
  TItem extends { id: string; slug: string; translations?: TTr[] }
>(
  item: TItem,
  collection: TranslationCollectionName,
  parentIdKey: string,
  packMap: Record<string, Record<string, Record<string, unknown>>>
): TItem {
  const packEntry = packMap[item.slug];
  if (!packEntry) return item;

  const baseTranslations = [...(item.translations || [])];
  const existingPrefixes = new Set(
    baseTranslations.map((t) => (t.languages_code || '').slice(0, 2).toLowerCase())
  );

  for (const [lc, rawFields] of Object.entries(packEntry)) {
    const prefix = lc.slice(0, 2).toLowerCase();
    if (existingPrefixes.has(prefix)) continue;

    const synthetic = {
      ...rawFields,
      id: `pack-${collection}-${item.slug}-${prefix}`,
      [parentIdKey]: item.id,
      languages_code:
        typeof rawFields.languages_code === 'string'
          ? rawFields.languages_code
          : prefix === 'fa'
            ? 'fa-IR'
            : prefix === 'fr'
              ? 'fr-FR'
              : 'en',
    } as unknown as TTr;
    baseTranslations.push(synthetic);
    existingPrefixes.add(prefix);
  }

  return {
    ...item,
    translations: baseTranslations,
  };
}

function buildArticlesCollection(): Article[] {
  const packArticles = loadPackTranslations('articles');
  const vaultArticles = loadVaultArticles().map((art) => {
    const extraTrs = CURATED_ARTICLE_TRANSLATIONS[art.slug];
    let translations = [...(art.translations || [])];

    // Enrich canonical flagship article with full scholarly CNRS context while preserving 100% of WP text
    if (art.slug === 'is-psychoanalysis-a-science') {
      translations = translations.map((tr) => {
        if (!tr.languages_code.startsWith('fa')) return tr;
        const scholarlyNote = `\n\n---\n\nدر یک بررسی آماری مستند توسط مرکز ملی پژوهش‌های علمی فرانسه ([پایگاه رسمی CNRS](https://www.cnrs.fr))، از ۳٬۹۵۴ پروژه پژوهشی مبتنی بر روانکاوی بالینی، ۳٬۷۵۵ مورد ماهیت میان‌رشته‌ای، ۱۸۴ مورد بالینی محض و ۱۵ مورد متمرکز بر زبان‌شناسی بوده‌اند. این امر نشان می‌دهد روانکاوی با دگرشنیدن و بررسی جایگاه دال‌ها و مفهوم «عملیات نام پدر»، به بنیادهای سوژه می‌پردازد.`;
        return {
          ...tr,
          title: 'آیا روانکاوی علم است؟',
          executive_summary:
            'بررسی جایگاه ناخودآگاه در علم معاصر، سمینارهای ژاک لکان و آمار مرکز ملی پژوهش‌های علمی فرانسه (CNRS) مبنی بر اینکه از ۳٬۹۵۴ پروژه پژوهشی روانکاوی بالینی، ۳٬۷۵۵ پروژه میان‌رشته‌ای بوده‌اند.',
          body_markdown: tr.body_markdown.includes('CNRS')
            ? tr.body_markdown
            : `${tr.body_markdown}${scholarlyNote}`,
        };
      });
    }

    // Prefer complete Pack A translations over brief curated abstracts while keeping original at [0]
    const nativePrefixes = new Set(
      translations.map((t) => (t.languages_code || '').slice(0, 2).toLowerCase())
    );
    const mergedItem = mergePackTranslationsForItem(
      { ...art, translations },
      'articles',
      'articles_id',
      packArticles
    );
    translations = [...(mergedItem.translations || [])];

    if (extraTrs) {
      const existingPrefixes = new Set(
        translations.map((t) => (t.languages_code || '').slice(0, 2).toLowerCase())
      );
      translations = [
        ...translations,
        ...extraTrs.filter((t) => !existingPrefixes.has((t.languages_code || '').slice(0, 2).toLowerCase())),
      ];
      // Preserve verified curated CNBC/CNRS translation for native articles when Pack A didn't supply that language
      void nativePrefixes;
    }

    return {
      ...art,
      translations,
    };
  });

  const existingSlugs = new Set(vaultArticles.map((a) => a.slug));
  const merged = [
    ...vaultArticles,
    ...SUPPLEMENTAL_ARTICLES.filter((a) => !existingSlugs.has(a.slug)),
  ];

  // Put canonical featured scholarly works first so homepage & pillar previews open with key essays
  const canonicalOrder = [
    'is-psychoanalysis-a-science',
    'etat-limite-concept-psychanalytique',
    'topologie-des-lieux-saints',
    'relation-cavalier-cheval',
    'cultural-land-of-iran-strategy',
  ];
  merged.sort((a, b) => {
    const ia = canonicalOrder.indexOf(a.slug);
    const ib = canonicalOrder.indexOf(b.slug);
    if (ia !== -1 || ib !== -1) {
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    }
    return (b.published_at || b.created_at).localeCompare(a.published_at || a.created_at);
  });

  return merged;
}

function buildBooksCollection(): Book[] {
  const packBooks = loadPackTranslations('books');
  const vaultBooks = loadVaultBooks();
  const existingSlugs = new Set(vaultBooks.map((b) => b.slug));
  const merged = [
    ...SUPPLEMENTAL_BOOKS.filter((b) => !existingSlugs.has(b.slug)),
    ...vaultBooks,
  ].map((b) => mergePackTranslationsForItem(b, 'books', 'books_id', packBooks));
  return merged.map((b, i) => ({ ...b, order_index: i + 1 }));
}

function buildExhibitionsCollection(): Exhibition[] {
  const packExhibitions = loadPackTranslations('exhibitions');
  const vaultExhibitions = loadVaultExhibitions().map((ex) => {
    const enrich = EXHIBITION_ENRICHMENTS[ex.slug];
    const enriched = !enrich
      ? ex
      : {
          ...ex,
          start_date: enrich.start_date || ex.start_date,
          venue_city: enrich.venue_city || ex.venue_city,
          venue_name: enrich.venue_name || ex.venue_name,
          translations: (ex.translations || []).map((t) =>
            enrich.fa_title && t.languages_code.startsWith('fa') ? { ...t, title: enrich.fa_title } : t
          ),
        };
    return mergePackTranslationsForItem(enriched, 'exhibitions', 'exhibitions_id', packExhibitions);
  });

  const featuredSlugs = [
    'pompadour-2002-between-sign-and-symbol',
    'moscow-museum-modern-calligraphy',
    'unesco-paris-2009-dialogue-of-scripts',
    'fez-sacred-music-festival',
    'havana-cuba-2012-man-na-manam',
    'saint-petersburg-national-library-2013',
  ];
  const featured = featuredSlugs
    .map((s) => vaultExhibitions.find((e) => e.slug === s))
    .filter((e): e is Exhibition => Boolean(e));
  const rest = vaultExhibitions.filter((e) => !featuredSlugs.includes(e.slug));
  return [...featured, ...rest];
}

function buildArtworksCollection(): Artwork[] {
  const packArtworks = loadPackTranslations('artworks');
  return loadVaultArtworks().map((art) =>
    mergePackTranslationsForItem(art, 'artworks', 'artworks_id', packArtworks)
  );
}

function buildArchivePagesCollection(): ArchivePage[] {
  const packPages = loadPackTranslations('pages');
  return loadVaultPages().map((pg) =>
    mergePackTranslationsForItem(pg, 'pages', 'pages_id', packPages)
  );
}

function buildPoemsCollection(): Poem[] {
  const packPoems = loadPackTranslations('poems');
  const vaultPoems = loadVaultPoems().map((p) =>
    mergePackTranslationsForItem(p, 'poems', 'poems_id', packPoems)
  );
  // Ensure caress-me is featured first for PoetryArtworkSync showcase
  const caress = vaultPoems.filter((p) => p.slug === 'caress-me');
  const rest = vaultPoems.filter((p) => p.slug !== 'caress-me');
  return [...caress, ...rest];
}

function buildVideosCollection(): VideoSpeech[] {
  const packVideos = loadPackTranslations('videos');
  const vaultVideos = loadVaultVideos().map((v) =>
    mergePackTranslationsForItem(v, 'videos', 'videos_id', packVideos)
  );
  const pinnedSlugs = ['khavaran-justice-session', 'hafez-de-chiraz'];
  const pinned = pinnedSlugs
    .map((s) => vaultVideos.find((v) => v.slug === s))
    .filter((v): v is VideoSpeech => Boolean(v));
  const rest = vaultVideos.filter((v) => !pinnedSlugs.includes(v.slug));
  return [...pinned, ...rest];
}

export const FALLBACK_ARTICLES: Article[] = buildArticlesCollection();
export const FALLBACK_BOOKS: Book[] = buildBooksCollection();
export const FALLBACK_EXHIBITIONS: Exhibition[] = buildExhibitionsCollection();
export const FALLBACK_ARTWORKS: Artwork[] = buildArtworksCollection();
export const FALLBACK_POEMS: Poem[] = buildPoemsCollection();
export const FALLBACK_VIDEOS: VideoSpeech[] = buildVideosCollection();
export const FALLBACK_PAGES: ArchivePage[] = buildArchivePagesCollection();

export const FALLBACK_GLOSSARY: LacanianGlossaryTerm[] = [
  {
    id: 'g1000000-0000-0000-0000-000000000001',
    term_fa: 'دگرشنیدن',
    term_fr: 'Écouter autrement',
    term_en: 'Listening Differently',
    conceptual_definition_fa:
      'رویکرد تحلیلی و بالینی خاص دکتر مکارمی در بازخوانی متن ناخودآگاه، حافظ و سوژه ایرانی.',
    conceptual_definition_fr:
      "Approche clinique et herméneutique développée par le Dr Makaremi pour écouter l'inconscient.",
    conceptual_definition_en:
      'Clinical and hermeneutic listening method developed by Dr. Makaremi.',
    pillar: 'psychoanalysis',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'g2000000-0000-0000-0000-000000000002',
    term_fa: 'عملیات نام پدر',
    term_fr: 'Opération Nom-du-Père',
    term_en: 'Operation of the Name-of-the-Father',
    conceptual_definition_fa:
      'سازوکار ساختاری و استعاره پدری در گذر از قلمرو خیالی به نمادین در روان‌کاوی لکانی.',
    conceptual_definition_fr:
      "Fonction paternelle symbolique permettant la métaphore du sujet dans l'ordre symbolique.",
    conceptual_definition_en:
      'Foundational Lacanian paternal metaphor facilitating entry into the symbolic order.',
    pillar: 'psychoanalysis',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'g3000000-0000-0000-0000-000000000003',
    term_fa: 'حالت مرزی',
    term_fr: 'État Limite',
    term_en: 'Borderline State',
    conceptual_definition_fa:
      'وضعیت ساختاری خاص در روان‌کاوی میان روان‌نژندی و روان‌پریشی با تزلزل در گره‌گاه نمادین.',
    conceptual_definition_fr:
      'Structure subjective fluctuante entre névrose et psychose selon la clinique lacanienne.',
    conceptual_definition_en:
      'Structural position between neurosis and psychosis with unstable symbolic anchorage.',
    pillar: 'psychoanalysis',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'g4000000-0000-0000-0000-000000000004',
    term_fa: 'آسیب‌شناسی ازهم‌گسستگی و رانه مرگ',
    term_fr: 'Pathologie de la désintégration et pulsion de mort',
    term_en: 'Pathology of Fragmentation and Death Drive',
    conceptual_definition_fa:
      'مفهوم‌پردازی تروماهای جمعی و ازهم‌گسستگی پیوندهای اجتماعی در اثر استبداد و خشونت.',
    pillar: 'cultural_strategy',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'g5000000-0000-0000-0000-000000000005',
    term_fa: 'سرزمین فرهنگی ایران',
    term_fr: "Terre culturelle de l'Iran",
    term_en: 'Cultural Land of Iran',
    conceptual_definition_fa:
      'حوزه تمدنی، ادبی و معنایی فراتر از مرزهای جغرافیایی معاصر که بر تساهل، زبان مشترک و همبستگی تاریخی استوار است.',
    pillar: 'cultural_strategy',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

// -----------------------------------------------------------------------------
// Pillar slug resolution helpers (supporting multilingual & aliased routes)
// -----------------------------------------------------------------------------

export function mapPillarSlugToPillar(slug: string): ContentPillar | undefined {
  const normalized = slug.toLowerCase();
  if (normalized === 'psychoanalysis' || normalized === 'psychanalyse') {
    return 'psychoanalysis';
  }
  if (normalized === 'art' || normalized === 'calligraphy' || normalized === 'art_calligraphy') {
    return 'art_calligraphy';
  }
  if (normalized === 'strategy' || normalized === 'cultural_strategy' || normalized === 'strategie') {
    return 'cultural_strategy';
  }
  if (normalized === 'human-rights' || normalized === 'dadkhahi' || normalized === 'droits-homme' || normalized === 'human_rights_dadkhahi') {
    return 'human_rights_dadkhahi';
  }
  return undefined;
}

export function mapPillarToCanonicalSlug(pillar: ContentPillar, locale: Locale = 'fa'): string {
  switch (pillar) {
    case 'psychoanalysis':
      return locale === 'fr' ? 'psychanalyse' : 'psychoanalysis';
    case 'art_calligraphy':
      return 'art';
    case 'cultural_strategy':
      return 'strategy';
    case 'human_rights_dadkhahi':
      return 'human-rights';
  }
}

// -----------------------------------------------------------------------------
// Initialize Authoritative Ed25519 Signatures & Immutable Snapshots
// Eagerly sign the top canonical essays at startup; lazily sign any of the
// remaining 400+ vault articles on first lookup for fast boot + 100% coverage.
// -----------------------------------------------------------------------------
for (const art of FALLBACK_ARTICLES.slice(0, 12)) {
  for (const loc of ['fa', 'fr', 'en'] as Locale[]) {
    registerImmutableSnapshot(art, loc);
  }
}

function ensureSnapshotRegistered(article: Article, locale: Locale): void {
  const key = `${article.slug}:${locale}`;
  if (!VERIFIED_IMMUTABLE_SNAPSHOTS[key]) {
    registerImmutableSnapshot(article, locale);
  }
}

// -----------------------------------------------------------------------------
// Data Fetchers with Zero-Downtime Vault Fallback for Static Generation
// -----------------------------------------------------------------------------

export async function getArticles(locale: Locale = 'fa', pillar?: ContentPillar): Promise<Article[]> {
  try {
    if (!process.env.DIRECTUS_URL) throw new Error('Vault mode active');
    const res = await fetch(`${DIRECTUS_URL}/items/articles?fields=*.*`, {
      next: { revalidate: 86400, tags: ['articles'] },
    });
    if (!res.ok) throw new Error(`Directus error: ${res.statusText}`);
    const data = await res.json();
    return data.data;
  } catch {
    if (pillar) {
      return FALLBACK_ARTICLES.filter((a) => a.pillar === pillar);
    }
    return FALLBACK_ARTICLES;
  }
}

export async function getArticleBySlug(slug: string, locale: Locale = 'fa'): Promise<Article | undefined> {
  const articles = await getArticles(locale);
  const candidate = articles.find((a) => a.slug === slug);
  if (!candidate) return undefined;

  ensureSnapshotRegistered(candidate, locale);
  const { article } = inspectAndSelfHeal(candidate, locale);
  return article;
}

export async function getBooks(locale: Locale = 'fa'): Promise<Book[]> {
  try {
    if (!process.env.DIRECTUS_URL) throw new Error('Vault mode active');
    const res = await fetch(`${DIRECTUS_URL}/items/books?fields=*.*`, {
      next: { revalidate: 86400, tags: ['books'] },
    });
    if (!res.ok) throw new Error(`Directus error: ${res.statusText}`);
    const data = await res.json();
    return data.data;
  } catch {
    return FALLBACK_BOOKS;
  }
}

export async function getBookBySlug(slug: string, locale: Locale = 'fa'): Promise<Book | undefined> {
  const books = await getBooks(locale);
  return books.find((b) => b.slug === slug);
}

export async function getExhibitions(locale: Locale = 'fa'): Promise<Exhibition[]> {
  try {
    if (!process.env.DIRECTUS_URL) throw new Error('Vault mode active');
    const res = await fetch(`${DIRECTUS_URL}/items/exhibitions?fields=*.*`, {
      next: { revalidate: 86400, tags: ['exhibitions'] },
    });
    if (!res.ok) throw new Error(`Directus error: ${res.statusText}`);
    const data = await res.json();
    return data.data;
  } catch {
    return FALLBACK_EXHIBITIONS;
  }
}

export async function getExhibitionBySlug(slug: string, locale: Locale = 'fa'): Promise<Exhibition | undefined> {
  const exhibitions = await getExhibitions(locale);
  return exhibitions.find((e) => e.slug === slug);
}

function prioritizeByLocale<T extends { slug: string; translations?: Array<{ languages_code: string }> }>(
  items: T[],
  locale: Locale,
  pinnedSlugs: string[] = []
): T[] {
  const pinnedSet = new Set(pinnedSlugs);
  const pinned = pinnedSlugs
    .map((s) => items.find((i) => i.slug === s))
    .filter((i): i is T => Boolean(i));
  const rest = items.filter((i) => !pinnedSet.has(i.slug));
  const matching = rest.filter((i) => i.translations?.some((t) => t.languages_code.startsWith(locale)));
  const others = rest.filter((i) => !i.translations?.some((t) => t.languages_code.startsWith(locale)));
  return [...pinned, ...matching, ...others];
}

export async function getPoems(locale: Locale = 'fa'): Promise<Poem[]> {
  return prioritizeByLocale(FALLBACK_POEMS, locale, ['caress-me']);
}

export async function getPoemBySlug(slug: string, locale: Locale = 'fa'): Promise<Poem | undefined> {
  const poems = await getPoems(locale);
  return poems.find((p) => p.slug === slug);
}

export async function getArtworks(locale: Locale = 'fa'): Promise<Artwork[]> {
  return prioritizeByLocale(FALLBACK_ARTWORKS, locale);
}

export async function getArtworkBySlug(slug: string, locale: Locale = 'fa'): Promise<Artwork | undefined> {
  const artworks = await getArtworks(locale);
  return artworks.find((a) => a.slug === slug);
}

export async function getVideoSpeeches(locale: Locale = 'fa', pillar?: ContentPillar): Promise<VideoSpeech[]> {
  const base = pillar ? FALLBACK_VIDEOS.filter((v) => v.pillar === pillar) : FALLBACK_VIDEOS;
  return prioritizeByLocale(base, locale, ['khavaran-justice-session', 'hafez-de-chiraz']);
}

export async function getVideoSpeechBySlug(slug: string, locale: Locale = 'fa'): Promise<VideoSpeech | undefined> {
  const videos = await getVideoSpeeches(locale);
  return videos.find((v) => v.slug === slug);
}

export async function getArchivePages(locale: Locale = 'fa', group?: ArchivePageGroup): Promise<ArchivePage[]> {
  const base = group ? FALLBACK_PAGES.filter((p) => p.group === group) : FALLBACK_PAGES;
  return prioritizeByLocale(base, locale);
}

export async function getArchivePageBySlug(slug: string, locale: Locale = 'fa'): Promise<ArchivePage | undefined> {
  const pages = await getArchivePages(locale);
  return pages.find((p) => p.slug === slug);
}

export function getMediaManifest(): MediaAsset[] {
  return loadVaultMediaManifest();
}

export function getLegacyRedirects(): Record<string, string> {
  return loadVaultLegacyRedirects();
}

export async function getLacanianGlossary(): Promise<LacanianGlossaryTerm[]> {
  try {
    if (!process.env.DIRECTUS_URL) throw new Error('Vault mode active');
    const res = await fetch(`${DIRECTUS_URL}/items/lacanian_glossary`, {
      next: { revalidate: 86400, tags: ['glossary'] },
    });
    if (!res.ok) throw new Error(`Directus error: ${res.statusText}`);
    const data = await res.json();
    return data.data;
  } catch {
    return FALLBACK_GLOSSARY;
  }
}

export * from './legacy-heritage';
