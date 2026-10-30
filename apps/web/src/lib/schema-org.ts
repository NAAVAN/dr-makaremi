import type { Article, Book, Exhibition, Artwork, VideoSpeech, Poem, LacanianGlossaryTerm, Locale } from '@makaremi/shared';

// -----------------------------------------------------------------------------
// Defense-in-Depth: Safe JSON-LD Serialization (Breakout XSS Immunity)
// -----------------------------------------------------------------------------
export function serializeSafeJsonLd(data: unknown): string {
  const json = JSON.stringify(data);
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

// -----------------------------------------------------------------------------
// Master Node: Dr. Hassan Makaremi Person Identity
// -----------------------------------------------------------------------------
export function buildPersonNode(locale: Locale = 'fa') {
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';

  return {
    '@type': 'Person',
    '@id': 'https://makaremi.com/#hassan-makaremi',
    name: 'Hassan Makaremi',
    alternateName: [
      'حسن مکارمی',
      'دکتر حسن مکارمی',
      'Dr. Hassan Makaremi',
      'Dr Hassan Makaremi',
    ],
    givenName: isFa ? 'حسن' : 'Hassan',
    familyName: isFa ? 'مکارمی' : 'Makaremi',
    birthDate: '1950',
    birthPlace: {
      '@type': 'Place',
      name: 'Shiraz, Iran',
      addressCountry: 'IR',
    },
    nationality: [
      { '@type': 'Country', name: 'Iran' },
      { '@type': 'Country', name: 'France' },
    ],
    jobTitle: [
      isFa ? 'روانکاو بالینی لکانی' : isFr ? 'Psychanalyste clinicien lacanien' : 'Clinical Lacanian Psychoanalyst',
      isFa ? 'پژوهشگر مطالعات راهبردی و فرهنگ' : isFr ? 'Chercheur en études stratégiques et culturelles' : 'Researcher in Cultural Strategic Studies',
      isFa ? 'هنرمند نقاش و خوشنویس مدرن' : isFr ? 'Peintre et calligraphe contemporain' : 'Modern Persian Calligrapher and Painter',
      isFa ? 'کنشگر حقوق بشر و دادخواهی' : isFr ? "Défenseur des droits de l'homme" : 'Human Rights Defender',
    ],
    description: isFa
      ? 'روانکاو بالینی لکانی، پژوهشگر دانشگاه سوربن، هنرمند خوشنویس مدرن در موزه مسکو، و عضو هیئت مدیره جامعه دفاع از حقوق بشر در ایران (LDDHI).'
      : isFr
      ? "Psychanalyste clinicien lacanien, chercheur à l'Université de la Sorbonne, artiste calligraphe contemporain et trésorier de la Ligue de défense des droits de l'homme en Iran (LDDHI / FIDH)."
      : 'Clinical Lacanian Psychoanalyst, Sorbonne University Researcher, Modern Calligrapher featured at the Moscow Museum of Modern Calligraphy, and Human Rights Defender.',
    url: 'https://makaremi.com',
    image: 'https://makaremi.com/images/hassan-makaremi-portrait.webp',
    knowsLanguage: ['fa', 'fr', 'en'],
    alumniOf: [
      { '@type': 'CollegeOrUniversity', name: 'Amirkabir University of Technology (Tehran Polytechnic)' },
      { '@type': 'CollegeOrUniversity', name: 'Shiraz University' },
      { '@type': 'CollegeOrUniversity', name: 'University of Sistan and Baluchestan' },
      { '@type': 'CollegeOrUniversity', name: 'École Centrale Paris' },
      { '@type': 'CollegeOrUniversity', name: 'Université de Technologie de Compiègne' },
      { '@type': 'CollegeOrUniversity', name: 'Université Paris Diderot (Paris 7 Medical School)' },
      { '@type': 'CollegeOrUniversity', name: "Centre d'Études Diplomatiques et Stratégiques (CEDS Paris)" },
    ],
    memberOf: [
      { '@type': 'Organization', name: 'League for the Defence of Human Rights in Iran (LDDHI / FIDH)' },
      { '@type': 'Organization', name: 'International Federation for Human Rights (FIDH)' },
      { '@type': 'Organization', name: 'Association of Iranian Psychotherapy Researchers in France' },
      { '@type': 'Organization', name: 'Psychoanalytic Association of the Limousin Region' },
    ],
    hasOccupation: [
      { '@type': 'Occupation', name: 'Clinical Lacanian Psychoanalyst' },
      { '@type': 'Occupation', name: 'Researcher in Cultural and Political Strategy' },
      { '@type': 'Occupation', name: 'Modern Persian Calligrapher and Painter' },
      { '@type': 'Occupation', name: 'Human Rights Defender' },
    ],
    affiliation: [
      { '@type': 'CollegeOrUniversity', name: 'Sorbonne University' },
      { '@type': 'Organization', name: 'League for the Defence of Human Rights in Iran (LDDHI / FIDH)' },
      { '@type': 'Organization', name: 'Association of Iranian Psychotherapy Researchers in France' },
      { '@type': 'Organization', name: 'Psychoanalytic Association of the Limousin Region' },
    ],
    spouse: [
      { '@type': 'Person', name: 'Mina Rad' },
      { '@type': 'Person', name: 'Fatemeh Zarei (1955-1988)' },
    ],
    children: [
      {
        '@type': 'Person',
        name: 'Chowra Makaremi',
        jobTitle: 'Tenured Research Scholar at CNRS (IRIS)',
        sameAs: 'https://booksandideas.net/_Makaremi-Chowra_',
      },
    ],
    sameAs: [
      'https://fa.wikipedia.org/wiki/%D8%AD%D8%B3%D9%86_%D9%85%DA%A9%D8%A7%D8%B1%D9%85%DB%8C',
      'http://www.makaremi.net',
      'https://www.flickr.com/photos/makaremi/',
      'https://t.me/hassan_makaremi',
      'https://booksandideas.net/_Makaremi-Chowra_',
    ],
  };
}

// -----------------------------------------------------------------------------
// WebSite Node with SearchAction
// -----------------------------------------------------------------------------
export function buildWebSiteNode(locale: Locale = 'fa') {
  return {
    '@type': 'WebSite',
    '@id': 'https://makaremi.com/#website',
    url: 'https://makaremi.com',
    name: 'Dr. Hassan Makaremi | دکتر حسن مکارمی',
    description: 'Official Digital Archive, Museum and Research Corpus of Dr. Hassan Makaremi',
    publisher: { '@id': 'https://makaremi.com/#hassan-makaremi' },
    inLanguage: ['fa', 'fr', 'en'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `https://makaremi.com/${locale}/books?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// -----------------------------------------------------------------------------
// Book Schema Node (Special workTranslation for Jacques Lacan's Seminar III)
// -----------------------------------------------------------------------------
export function buildBookNode(book: Book, locale: Locale = 'fa') {
  const trans =
    book.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    book.translations?.[0];

  const bookUrl = `https://makaremi.com/${locale}/books/${book.slug}`;
  const isLacanSeminar3 = book.slug === 'lacan-seminar-3-psychoses';

  const baseNode: Record<string, unknown> = {
    '@type': 'Book',
    '@id': `${bookUrl}#book`,
    url: bookUrl,
    name: trans?.title || book.slug,
    alternateName: trans?.subtitle || undefined,
    isbn: book.isbn_13 || undefined,
    numberOfPages: book.page_count || undefined,
    datePublished: book.publication_year ? String(book.publication_year) : undefined,
    publisher: {
      '@type': 'Organization',
      name: trans?.publisher_name || 'Publisher',
    },
    inLanguage: locale,
    genre: book.pillar,
    description: trans?.synopsis || undefined,
    isPartOf: { '@id': 'https://makaremi.com/#website' },
  };

  if (isLacanSeminar3) {
    baseNode.workTranslation = {
      '@type': 'Book',
      name: 'Le Séminaire, Livre III : Les Psychoses',
      author: {
        '@type': 'Person',
        name: 'Jacques Lacan',
      },
      inLanguage: 'fr',
    };
    baseNode.translator = { '@id': 'https://makaremi.com/#hassan-makaremi' };
  } else {
    baseNode.author = { '@id': 'https://makaremi.com/#hassan-makaremi' };
  }

  return baseNode;
}

// -----------------------------------------------------------------------------
// ScholarlyArticle Node (With Cryptographic SHA-256 Digest & CNRS Citation)
// -----------------------------------------------------------------------------
export function buildArticleNode(article: Article, locale: Locale = 'fa') {
  const trans =
    article.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    article.translations?.[0];

  const pillarSlug = article.pillar === 'psychoanalysis'
    ? (locale === 'fr' ? 'psychanalyse' : 'psychoanalysis')
    : article.pillar === 'art_calligraphy'
    ? 'art'
    : article.pillar === 'cultural_strategy'
    ? 'strategy'
    : 'human-rights';

  const articleUrl = `https://makaremi.com/${locale}/${pillarSlug}/articles/${article.slug}`;

  return {
    '@type': 'ScholarlyArticle',
    '@id': `${articleUrl}#article`,
    url: articleUrl,
    headline: trans?.title || article.slug,
    alternativeHeadline: trans?.executive_summary || undefined,
    abstract: trans?.executive_summary || undefined,
    author: { '@id': 'https://makaremi.com/#hassan-makaremi' },
    publisher: { '@id': 'https://makaremi.com/#hassan-makaremi' },
    datePublished: article.published_at || article.created_at,
    dateModified: article.updated_at || article.published_at || article.created_at,
    inLanguage: locale,
    articleSection: article.pillar,
    identifier: {
      '@type': 'PropertyValue',
      propertyID: 'SHA-256',
      value: article.content_sha256,
    },
    about: [
      { '@type': 'Thing', name: 'Lacanian Psychoanalysis' },
      { '@type': 'Thing', name: 'The Unconscious' },
      { '@type': 'Organization', name: 'CNRS' },
    ],
    isPartOf: { '@id': 'https://makaremi.com/#website' },
  };
}

// -----------------------------------------------------------------------------
// VisualArtwork Node (Calligraphy & Painting)
// -----------------------------------------------------------------------------
export function buildVisualArtworkNode(artwork: Artwork, locale: Locale = 'fa') {
  const trans =
    artwork.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    artwork.translations?.[0];

  const artUrl = `https://makaremi.com/${locale}/gallery/${artwork.slug}`;

  return {
    '@type': 'VisualArtwork',
    '@id': `${artUrl}#artwork`,
    name: trans?.title || artwork.slug,
    creator: { '@id': 'https://makaremi.com/#hassan-makaremi' },
    artMedium: artwork.medium || 'Ink and Acrylic on Canvas',
    artform: artwork.artform || 'Modern Persian Calligraphy',
    dateCreated: String(artwork.year || 2002),
    description: trans?.description_markdown?.slice(0, 200) || undefined,
    isPartOf: { '@id': 'https://makaremi.com/#website' },
  };
}

// -----------------------------------------------------------------------------
// ExhibitionEvent Node (Galleries & Museums)
// -----------------------------------------------------------------------------
export function buildExhibitionNode(exhibition: Exhibition, locale: Locale = 'fa') {
  const trans =
    exhibition.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    exhibition.translations?.[0];

  const expoUrl = `https://makaremi.com/${locale}/art/exhibitions/${exhibition.slug}`;

  return {
    '@type': 'ExhibitionEvent',
    '@id': `${expoUrl}#event`,
    name: trans?.title || exhibition.slug,
    organizer: { '@id': 'https://makaremi.com/#hassan-makaremi' },
    startDate: exhibition.start_date,
    endDate: exhibition.end_date || undefined,
    location: {
      '@type': 'Place',
      name: `${exhibition.venue_name}, ${exhibition.venue_city}`,
    },
    description: trans?.curatorial_statement_markdown?.slice(0, 200) || undefined,
    isPartOf: { '@id': 'https://makaremi.com/#website' },
  };
}

// -----------------------------------------------------------------------------
// DefinedTermSet Node (Trilingual Lacanian & Strategic Controlled Vocabulary)
// -----------------------------------------------------------------------------
export function buildDefinedTermSetNode(terms: LacanianGlossaryTerm[], locale: Locale = 'fa') {
  const termsUrl = `https://makaremi.com/${locale}/glossary`;

  return {
    '@type': 'DefinedTermSet',
    '@id': `${termsUrl}#terms`,
    name: 'Lacanian & Strategic Controlled Vocabulary (اصطلاح‌نامه تخصصی لکانی و راهبردی)',
    description:
      'Official controlled philosophical, clinical psychoanalytic, and cultural strategic vocabulary developed and translated by Dr. Hassan Makaremi.',
    url: termsUrl,
    hasDefinedTerm: terms.map((t) => {
      const isFa = locale === 'fa';
      const isFr = locale === 'fr';
      const name = isFa ? t.term_fa : isFr ? t.term_fr : t.term_en;
      const def = isFa
        ? t.conceptual_definition_fa
        : isFr
        ? (t.conceptual_definition_fr || t.conceptual_definition_fa)
        : (t.conceptual_definition_en || t.conceptual_definition_fa);

      const slugifiedCode = t.term_fr
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      return {
        '@type': 'DefinedTerm',
        '@id': `${termsUrl}#${slugifiedCode}`,
        termCode: slugifiedCode,
        identifier: t.id,
        name,
        alternateName: [t.term_fa, t.term_fr, t.term_en].filter((x) => x !== name),
        description: def,
        inDefinedTermSet: `${termsUrl}#terms`,
      };
    }),
  };
}

// -----------------------------------------------------------------------------
// BreadcrumbList Node
// -----------------------------------------------------------------------------
export function buildBreadcrumbNode(
  items: Array<{ name: string; url?: string; item?: string }>
) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url || crumb.item,
    })),
  };
}

// -----------------------------------------------------------------------------
// Complete Integrated @graph Generator
// -----------------------------------------------------------------------------
export function buildFullGraph(params: {
  locale: Locale;
  items?: unknown[];
}) {
  const { locale, items = [] } = params;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildWebSiteNode(locale),
      buildPersonNode(locale),
      ...items,
    ],
  };
}
