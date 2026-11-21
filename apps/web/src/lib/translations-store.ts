import type { Locale } from '@makaremi/shared';

export type WorkCollection =
  | 'articles'
  | 'books'
  | 'poems'
  | 'videos'
  | 'exhibitions'
  | 'artworks'
  | 'pages';

export interface TranslatedPoemVerse {
  line_index: number;
  hemistich_a: string;
  hemistich_b?: string;
}

export interface StoredWorkTranslation {
  title: string;
  subtitle?: string;
  summary?: string;
  body_markdown?: string;
  commentary_markdown?: string;
  verses?: TranslatedPoemVerse[];
  provenance: 'editorial_verified' | 'glossary_locked_ai';
  updated_at: string;
}

export type WorkTranslationMap = Record<string, Partial<Record<Locale, StoredWorkTranslation>>>;

/**
 * Curated & Wave-Populated Static Pre-Translated Vault Store.
 * Keys follow `${collection}:${slug}`.
 * Dr. Makaremi's authentic original vault JSON files remain 100% read-only and untouched.
 * Waves 3–5 populate dedicated JSON shards merged cleanly here.
 */
export const STATIC_WORK_TRANSLATIONS: WorkTranslationMap = {
  // Flagship French-original psychoanalytic essay -> Persian & British English
  'articles:etat-limite-concept-psychanalytique': {
    fa: {
      title: 'حالت مرزی: مفهومی در روان‌کاوی؟',
      summary:
        'بررسی ساختاری «حالت مرزی» میان روان‌نژندی و روان‌پریشی با تکیه بر نظریه گره بورومه‌ای، عملیات نام پدر و رویکرد دگرشنیدن.',
      body_markdown:
        'حالت مرزی نه یک برچسب تشخیصی ایستا، بلکه وضعیتی ناپایدار در ساختار سوژه میان روان‌نژندی و روان‌پریشی است.\n\nدگرشنیدن شکاف‌های کلامی بیمار و فهم آسیب‌شناسی ازهم‌گسستگی و رانه مرگ، کلید مواجهه بالینی با این وضعیت در اتاق تحلیل به شمار می‌رود.',
      provenance: 'editorial_verified',
      updated_at: '2026-11-22',
    },
    en: {
      title: 'Borderline State: A Concept in Psychoanalysis?',
      summary:
        'A structural inquiry into the borderline state between neurosis and psychosis, drawing on Jacques Lacan’s Borromean knot and clinical listening.',
      body_markdown:
        'Rather than a static diagnostic label, the borderline state denotes an unstable structural position between neurosis and psychosis.\n\nListening differently to ruptures in the analysand’s speech, alongside clinical attention to fragmentation and the death drive, remains central to analytic practice.',
      provenance: 'editorial_verified',
      updated_at: '2026-11-22',
    },
  },
  'articles:topologie-des-lieux-saints': {
    fa: {
      title: 'توپولوژی فضاهای مقدس',
      summary:
        'کاربست چنبره (تورس) لکانی و هندسه نااقلیدسی در بازخوانی معماری فضاهای مقدس و پیوند درون و برون در روان جمعی.',
      body_markdown:
        'فضای زیارتی و اماکن مقدس از منطق توپولوژیک چنبره (تورس) پیروی می‌کنند؛ جایی که برون‌بودگی با درونی‌ترین ساحت روان سوژه گره می‌خورد.\n\nاین خوانش ساختاری نشان می‌دهد چگونه معماری آیینی، مرز میان امر نمادین و تجربه زیسته را صورت‌بندی می‌کند.',
      provenance: 'editorial_verified',
      updated_at: '2026-11-22',
    },
    en: {
      title: 'Topology of Sacred Spaces',
      summary:
        'Applying Lacanian torus topology and non-Euclidean spatial geometry to sacred architecture and collective psychic life.',
      body_markdown:
        'Sacred sites and pilgrimage architecture obey the topological logic of the torus, where exteriority folds directly into the subject’s innermost psychic space.\n\nThis structural reading examines how ritual spatial boundaries articulate the Symbolic order within lived cultural experience.',
      provenance: 'editorial_verified',
      updated_at: '2026-11-22',
    },
  },
  'articles:relation-cavalier-cheval': {
    fa: {
      title: 'نقش ناخودآگاه در رابطه سوار و اسب',
      summary:
        'پژوهشی در تصویر ناخودآگاه تن و گفت‌وگوی بی‌کلام میان سوار و اسب بر پایه آموزه‌های فروید و فرانسواز دولتو.',
      body_markdown:
        'سوارکاری بازتاب دیالکتیک ظریف میان تکانه‌های مهارناپذیر و سامان‌دهی منِ آگاه است.\n\nدر این پیوند، اسب به مثابه آینه‌ای زنده از کشاکش‌های ناخودآگاه سوار و تصویر ناخودآگاه تن عمل می‌کند.',
      provenance: 'editorial_verified',
      updated_at: '2026-11-22',
    },
    en: {
      title: 'The Role of the Unconscious in the Rider–Horse Relationship',
      summary:
        'A psychoanalytic study of the unconscious body image and non-verbal dialogue between rider and horse, grounded in Freud and Françoise Dolto.',
      body_markdown:
        'Equestrian practice reveals a delicate dialectic between untamed drives and conscious bodily mastery.\n\nWithin this encounter, the horse acts as a living mirror reflecting the rider’s unconscious tensions and bodily image.',
      provenance: 'editorial_verified',
      updated_at: '2026-11-22',
    },
  },
  // Flagship Persian-original poem -> French & British English (verse-aligned!)
  'poems:caress-me': {
    fr: {
      title: 'Caresse-moi',
      summary: 'Poème lyrique accompagné d’une œuvre calligraphique originale du Dr Hassan Makaremi.',
      verses: [
        {
          line_index: 1,
          hemistich_a: 'Caresse-moi de la main douce de la brise,',
          hemistich_b: 'Afin que l’encre de l’attente fleurisse sur le papier.',
        },
      ],
      provenance: 'editorial_verified',
      updated_at: '2026-11-22',
    },
    en: {
      title: 'Caress Me',
      summary: 'A lyrical Persian poem paired with original modern calligraphy by Dr Hassan Makaremi.',
      verses: [
        {
          line_index: 1,
          hemistich_a: 'Caress me with the gentle hand of the breeze,',
          hemistich_b: 'That the ink of longing may blossom upon the page.',
        },
      ],
      provenance: 'editorial_verified',
      updated_at: '2026-11-22',
    },
  },
  // Flagship Persian-original book -> British English & French
  'books:lacan-seminar-3-psychoses': {
    fr: {
      title: 'Le Séminaire, Livre III : Les Psychoses (Traduction persane de Jacques Lacan)',
      subtitle: 'Traduction commentée en persan par le Dr Hassan Makaremi',
      summary:
        'Première traduction rigoureuse en persan du Séminaire III de Jacques Lacan sur les psychoses, enrichie d’un appareil critique et du glossaire analytique lacanien.',
      provenance: 'editorial_verified',
      updated_at: '2026-11-22',
    },
    en: {
      title: 'The Seminar, Book III: The Psychoses (Persian Translation of Jacques Lacan)',
      subtitle: 'Annotated Persian translation and clinical commentary by Dr Hassan Makaremi',
      summary:
        'Authoritative Persian translation of Jacques Lacan’s Seminar III on the psychoses, accompanied by clinical notes and Dr Makaremi’s controlled Lacanian glossary.',
      provenance: 'editorial_verified',
      updated_at: '2026-11-22',
    },
  },
};

export function getStoredWorkTranslation(
  collection: WorkCollection,
  slug: string,
  targetLocale: Locale
): StoredWorkTranslation | null {
  const entry = STATIC_WORK_TRANSLATIONS[`${collection}:${slug}`];
  return entry?.[targetLocale] || null;
}
