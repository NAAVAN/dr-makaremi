import type { Locale, ContentPillar } from '@makaremi/shared';

// =============================================================================
// 1. ACADEMIC CREDENTIALS & 6+ UNIVERSITIES (کارنامه دانشگاهی ایران و فرانسه)
// =============================================================================

export interface AcademicInstitution {
  id: string;
  country: 'IR' | 'FR';
  period: string;
  name: Record<Locale, string>;
  role: Record<Locale, string>;
  field: Record<Locale, string>;
}

export const ACADEMIC_INSTITUTIONS: AcademicInstitution[] = [
  {
    id: 'amirkabir-polytechnic',
    country: 'IR',
    period: '1968–1973',
    name: {
      fa: 'دانشگاه صنعتی امیرکبیر (پلی‌تکنیک تهران)',
      fr: 'Université Polytechnique de Téhéran (Amirkabir)',
      en: 'Amirkabir University of Technology (Tehran Polytechnic)',
    },
    role: {
      fa: 'دانش‌آموخته مهندسی و آغاز فعالیت‌های فرهنگی و هنری',
      fr: 'Diplômé en ingénierie & activités culturelles',
      en: 'Engineering Graduate & Cultural Activities',
    },
    field: {
      fa: 'مهندسی نساجی و سیستم‌ها',
      fr: 'Génie industriel et systèmes',
      en: 'Industrial & Systems Engineering',
    },
  },
  {
    id: 'shiraz-university',
    country: 'IR',
    period: '1975–1979',
    name: {
      fa: 'دانشگاه شیراز و دانشگاه سیستان و بلوچستان',
      fr: 'Université de Chiraz & Université du Baloutchistan',
      en: 'Shiraz University & University of Sistan and Baluchestan',
    },
    role: {
      fa: 'عضو هیئت علمی، تدریس دانشگاهی و مدیریت آموزشی',
      fr: 'Enseignant-chercheur et direction académique',
      en: 'Faculty Member, Lecturer & Academic Administration',
    },
    field: {
      fa: 'مدیریت توسعه، مهندسی و پژوهش‌های فرهنگی',
      fr: 'Développement, ingénierie et recherche culturelle',
      en: 'Development Management & Cultural Research',
    },
  },
  {
    id: 'utc-compiegne',
    country: 'FR',
    period: '1982–1985',
    name: {
      fa: 'دانشگاه تکنولوژی کومپین فرانسه (UTC)',
      fr: 'Université de Technologie de Compiègne (UTC)',
      en: 'Université de Technologie de Compiègne (UTC)',
    },
    role: {
      fa: 'پژوهشگر مقاطع عالی و سیستم‌های صنعتی',
      fr: 'Études supérieures et recherche technologique',
      en: 'Postgraduate Researcher in Technological Systems',
    },
    field: {
      fa: 'تکنولوژی و مدیریت سیستم‌ها',
      fr: 'Technologie et gestion des systèmes',
      en: 'Technology & Systems Management',
    },
  },
  {
    id: 'ecole-centrale-paris',
    country: 'FR',
    period: '1985–1989',
    name: {
      fa: 'مدرسه مرکزی پاریس (École Centrale Paris)',
      fr: 'École Centrale Paris',
      en: 'École Centrale Paris',
    },
    role: {
      fa: 'دکتری مهندسی و مدرنیزاسیون سیستم‌ها',
      fr: 'Doctorat & Recherche en modernisation des organisations',
      en: 'Doctorate & Organizational Modernization Research',
    },
    field: {
      fa: 'مهندسی سیستم‌ها و مدیریت استراتژیک',
      fr: 'Génie des systèmes et stratégie',
      en: 'Systems Engineering & Strategic Management',
    },
  },
  {
    id: 'paris-7-denis-diderot',
    country: 'FR',
    period: '1990–1996',
    name: {
      fa: 'دانشکده پزشکی دانشگاه پاریس ۷ (Denis Diderot)',
      fr: 'Faculté de Médecine — Université Paris VII (Denis Diderot)',
      en: 'Faculty of Medicine — Paris VII Denis Diderot University',
    },
    role: {
      fa: 'تحصیلات تخصصی روانکاوی بالینی و آسیب‌شناسی روانی',
      fr: 'Formation clinique en psychanalyse et psychopathologie',
      en: 'Clinical Psychoanalysis & Psychopathology Studies',
    },
    field: {
      fa: 'روانکاوی بالینی فرویدی و لکانی',
      fr: 'Psychanalyse clinique freudienne et lacanienne',
      en: 'Freudian & Lacanian Clinical Psychoanalysis',
    },
  },
  {
    id: 'sorbonne-iae-ceds',
    country: 'FR',
    period: '1996–Present',
    name: {
      fa: 'دانشگاه سوربن پاریس ۱ (IAE Paris) و مرکز مطالعات دیپلماتیک و راهبردی (CEDS)',
      fr: 'Université Paris 1 Panthéon-Sorbonne (IAE) & CEDS Paris',
      en: 'Paris 1 Panthéon-Sorbonne University (IAE) & CEDS Paris',
    },
    role: {
      fa: 'پژوهشگر، استاد مشاور و متخصص راهبردی در بخش فرهنگی و نوسازی سازمانی',
      fr: 'Chercheur, consultant stratégique du secteur culturel et diplomatique',
      en: 'Researcher & Senior Strategic Consultant in Cultural & Diplomatic Studies',
    },
    field: {
      fa: 'مدیریت راهبردی، دیپلماسی فرهنگی و ژئوپلیتیک',
      fr: 'Management stratégique, diplomatie et géopolitique',
      en: 'Strategic Management, Cultural Diplomacy & Geopolitics',
    },
  },
];

// =============================================================================
// 2. GLOBAL PRESENCE & CULTURAL AUTHORITIES («حضور من در هستی»)
// =============================================================================

export interface GlobalAuthorityBadge {
  id: string;
  title: Record<Locale, string>;
  subtitle: Record<Locale, string>;
  externalUrl: string;
  badgeText: Record<Locale, string>;
}

export const GLOBAL_AUTHORITY_BADGES: GlobalAuthorityBadge[] = [
  {
    id: 'moscow-calligraphy-museum',
    title: {
      fa: 'موزه مدرن خوشنویسی مسکو',
      fr: 'Musée Contemporain de la Calligraphie de Moscou',
      en: 'Contemporary Museum of Calligraphy, Moscow',
    },
    subtitle: {
      fa: 'نگهداری دائمی ۷ اثر شاخص از نقاشی‌خط‌های دکتر حسن مکارمی در گنجینه بین‌المللی موزه',
      fr: '7 œuvres calligraphiques conservées dans la collection permanente du musée',
      en: '7 calligraphic canvases preserved in the permanent museum collection',
    },
    externalUrl: 'https://www.calligraphy-museum.com/en/participants/hassan_makaremi',
    badgeText: {
      fa: '۷ اثر در گنجینه دائمی',
      fr: '7 Œuvres Permanentes',
      en: '7 Permanent Works',
    },
  },
  {
    id: 'unesco-paris',
    title: {
      fa: 'مقر یونسکو در پاریس (UNESCO)',
      fr: 'Siège de l’UNESCO à Paris',
      en: 'UNESCO Headquarters, Paris',
    },
    subtitle: {
      fa: 'نمایشگاه و کنفرانس بین‌المللی «گفتگوی خط و فرهنگ‌ها» (۲۰۰۹) به همراه استاد فن زنگ',
      fr: 'Exposition et conférence internationale sur le dialogue des écritures (2009)',
      en: 'International exhibition & symposium on dialogue of scripts (2009)',
    },
    externalUrl: '/fa/art/exhibitions/pompadour-2002-between-sign-and-symbol',
    badgeText: {
      fa: 'یونسکو پاریس ۲۰۰۹',
      fr: 'UNESCO Paris 2009',
      en: 'UNESCO Paris 2009',
    },
  },
  {
    id: 'toos-foundation',
    title: {
      fa: 'بنیاد توس لندن (فهرست نقاشان بزرگ ایران)',
      fr: 'Fondation Toos (Grands Peintres d’Iran)',
      en: 'Toos Foundation (List of Major Iranian Painters)',
    },
    subtitle: {
      fa: 'ثبت نام و آثار دکتر حسن مکارمی در تالار نقاشان و خوشنویسان نوگرای معاصر ایران',
      fr: 'Référencé parmi les maîtres de la peinture et calligraphie iranienne contemporaine',
      en: 'Recognized among contemporary masters of Iranian painting and calligraphy',
    },
    externalUrl: '/fa/gallery',
    badgeText: {
      fa: 'بنیاد توس',
      fr: 'Fondation Toos',
      en: 'Toos Foundation',
    },
  },
  {
    id: 'lddhi-fidh',
    title: {
      fa: 'جامعه دفاع از حقوق بشر در ایران (LDDHI / FIDH)',
      fr: 'Ligue pour la Défense des Droits de l’Homme en Iran (LDDHI)',
      en: 'League for the Defence of Human Rights in Iran (LDDHI)',
    },
    subtitle: {
      fa: 'خزانه‌دار، کنشگر مدنی و نویسنده ده‌ها بیانیه و گزارش مستند به سازمان ملل متحد',
      fr: 'Trésorier et défenseur actif des droits humains et de la justice transitionnelle',
      en: 'Treasurer & human rights advocate submitting reports to the UN',
    },
    externalUrl: '/fa/about?tab=references',
    badgeText: {
      fa: 'حقوق بشر و دادخواهی',
      fr: 'Droits Humains (LDDHI)',
      en: 'Human Rights (LDDHI)',
    },
  },
  {
    id: 'iranian-psycho-researchers-france',
    title: {
      fa: 'انجمن روان‌پژوهان ایران در فرانسه',
      fr: 'Association des Psycho-Chercheurs Iraniens en France',
      en: 'Association of Iranian Psycho-Researchers in France',
    },
    subtitle: {
      fa: 'روانکاو بالینی در پاریس و عضو هیئت مدیره انجمن روان‌پژوهان با بیش از ۱۴۰ برنامه آموزشی',
      fr: 'Psychanalyste clinicien à Paris et membre du conseil d’administration',
      en: 'Clinical Psychoanalyst in Paris & Board Member',
    },
    externalUrl: '/fa/psychoanalysis',
    badgeText: {
      fa: 'روانکاو بالینی پاریس',
      fr: 'Psychanalyste à Paris',
      en: 'Clinical Psychoanalyst',
    },
  },
];

// =============================================================================
// 3. BOOK STUDIO v8.0 CULTURAL SANCTUARY PROFILES (پروفایل‌های استودیوی کتاب)
// =============================================================================

export type BookGenreKey =
  | 'psychoanalysis'
  | 'hafez'
  | 'strategy'
  | 'culture'
  | 'art'
  | 'poetry'
  | 'novel'
  | 'memoir';

export interface BookInteriorSpreadPage {
  pageNumber: number;
  chapterTitle: string;
  heading: string;
  bodyParagraphs: string[];
  footnote?: string;
  calligraphyQuote?: string;
}

export interface BookStudioProfile {
  slug: string;
  direction: 'rtl' | 'ltr';
  genreKey: BookGenreKey;
  genreLabel: Record<Locale, string>;
  trimSizeLabel: Record<Locale, string>;
  widthMm: number;
  heightMm: number;
  paperLabel: Record<Locale, string>;
  paperGsm: number;
  bulkFactor: number;
  spineWidthMm: number;
  weightGrams: number;
  coverPalette: {
    frontBg: string;
    frontSecondary: string;
    spineBg: string;
    backBg: string;
    accentGold: string;
    borderFrame: string;
  };
  previewStartPage: number;
  previewEndPage: number;
  colophonText: Record<Locale, string>;
  dedicationText: Record<Locale, string>;
  previewPages: BookInteriorSpreadPage[];
}

export const BOOK_GENRE_LABELS: Record<BookGenreKey, Record<Locale, string>> = {
  psychoanalysis: {
    fa: 'روانکاوی لکانی و بالین',
    fr: 'Psychanalyse Lacanienne',
    en: 'Lacanian Psychoanalysis',
  },
  hafez: {
    fa: 'حافظ‌پژوهی و دیگرشنیدن حافظ',
    fr: 'Études Haféziennes (Hafez)',
    en: 'Hafezology & Hermeneutics',
  },
  strategy: {
    fa: 'مطالعات راهبردی و ایران آینده',
    fr: 'Études Stratégiques & Transition',
    en: 'Strategic & Transition Studies',
  },
  culture: {
    fa: 'فرهنگ و سرزمین فرهنگی ایران',
    fr: 'Culture & Civilisation Iranienne',
    en: 'Iranian Culture & Civilization',
  },
  art: {
    fa: 'خوشنویسی و هنر تجسمی',
    fr: 'Calligraphie & Arts Visuels',
    en: 'Calligraphy & Visual Arts',
  },
  poetry: {
    fa: 'شعر و سروده‌های دوزبانه',
    fr: 'Poésie Bilingue',
    en: 'Bilingual Poetry',
  },
  novel: {
    fa: 'رمان و ادبیات داستانی',
    fr: 'Roman & Fiction',
    en: 'Novels & Literary Fiction',
  },
  memoir: {
    fa: 'خاطرات، تاریخ شفاهی و دادخواهی',
    fr: 'Mémoires & Justice Transitionnelle',
    en: 'Memoirs & Transitional Justice',
  },
};

export const BOOK_STUDIO_PROFILES: Record<string, BookStudioProfile> = {
  'lacan-seminar-3-psychoses': {
    slug: 'lacan-seminar-3-psychoses',
    direction: 'rtl',
    genreKey: 'psychoanalysis',
    genreLabel: BOOK_GENRE_LABELS.psychoanalysis,
    trimSizeLabel: {
      fa: 'وزیری (۱۷×۲۴ سانتی‌متر)',
      fr: 'Format Royal (17×24 cm)',
      en: 'Royal Octavo (17×24 cm)',
    },
    widthMm: 170,
    heightMm: 240,
    paperLabel: {
      fa: 'بالکی نخودی ۷۰ گرم (ضریب پفکی ۱.۸)',
      fr: 'Papier Bouffant Ivoire 70g (Main 1.8)',
      en: 'Warm Cream Bulky 70gsm (Bulk 1.8)',
    },
    paperGsm: 70,
    bulkFactor: 1.8,
    spineWidthMm: 26.8,
    weightGrams: 640,
    coverPalette: {
      frontBg: '#122922',
      frontSecondary: '#1B3B32',
      spineBg: '#0E201B',
      backBg: '#142D25',
      accentGold: '#D4AF37',
      borderFrame: 'rgba(212, 175, 55, 0.45)',
    },
    previewStartPage: 108,
    previewEndPage: 150,
    colophonText: {
      fa: 'نخستین ترجمه مستقیم از فرانسه به فارسی • انتشارات آلیان (Éditions Alian)، پاریس • شابک: 978-2954890000 • حق نشر و امضای دیجیتال محفوظ است.',
      fr: 'Première traduction intégrale du français en persan • Éditions Alian, Paris • ISBN : 978-2954890000',
      en: 'First direct translation from French into Persian • Éditions Alian, Paris • ISBN: 978-2954890000',
    },
    dedicationText: {
      fa: 'تقدیم به جویندگان حقیقت در ساحت کلام و ناخودآگاه، و به تمامی روان‌پژوهانی که به «دگرشنیدن» رنج انسان دل سپرده‌اند.',
      fr: 'Dédié aux chercheurs de vérité dans le champ de la parole et du signifiant.',
      en: 'Dedicated to seekers of truth in the field of speech and the unconscious.',
    },
    previewPages: [
      {
        pageNumber: 108,
        chapterTitle: 'فصل هشتم: ساختار روان‌پریشی و طرد دال نام پدر',
        heading: 'گفتار در باب فورکلوژن (Forclusion) و گسست زنجیره دلالت',
        bodyParagraphs: [
          'ژاک لکان در این بخش از سمینار سوم، تفاوت ساختاری میان سرکوب (Refoulement) در روان‌نژندی و طرد بنیادی یا فورکلوژن (Forclusion) در روان‌پریشی را با دقت ریاضی‌وار صورت‌بندی می‌کند.',
          'هنگامی که دال بنیادین «نام پدر» (Nom-du-Père) در جایگاه دیگری بزرگ (Autre) ثبت نمی‌شود، سوژه در مواجهه با امر واقعی فاقد تکیه‌گاه استعاری می‌گردد. آنچه در نمادین طرد شده است، اینک از درون امر واقعی در قالب هذیان و توهم شنیداری بازمی‌گردد.',
        ],
        footnote: '۱. مقایسه کنید با یادداشت‌های بالینی پرونده دانیل پل شربر و تحلیل فروید (۱۹۱۱).',
        calligraphyQuote: '«آنچه در ساحت نمادین پذیرفته نشود، از درون امر واقعی بازمی‌گردد.»',
      },
      {
        pageNumber: 109,
        chapterTitle: 'فصل هشتم: ساختار روان‌پریشی و طرد دال نام پدر',
        heading: 'نقطه دوخت معنا (Point de capiton) و تجربه قاضی شربر',
        bodyParagraphs: [
          'در گفتار عادی، دال و مدلول همچون دو لایه لغزان بر روی یکدیگر حرکت می‌کنند و تنها در «نقاط دوخت معنا» (Points de capiton) به هم گره می‌خورند تا جمله معنایی پایدار بیابد.',
          'در تجربه روان‌پریشانه شربر، این گره‌گاه‌های نمادین از هم می‌گسلند؛ جملات ناتمام در ذهن او طنین می‌اندازند و سوژه ناگزیر است برای بقا، با ساختن یک منظومه هذیانی پیچیده، جهان فروریخته خویش را از نو ترمیم و بخیه کند.',
        ],
        footnote: '۲. اصطلاح Point de capiton برگرفته از دوخت تشک و مبلمان در زبان فرانسه است.',
      },
      {
        pageNumber: 110,
        chapterTitle: 'فصل نهم: از دگرشنیدن بالینی تا اخلاق روانکاوی',
        heading: 'جایگاه روانکاو به مثابه کاتب و شاهد روان‌پریش',
        bodyParagraphs: [
          'لکان هشدار می‌دهد که در مواجهه با سوژه روان‌پریش، توسل به تاویل‌های شتاب‌زده ادیپی نه تنها بی‌ثمر است، بلکه می‌تواند به فروپاشی کامل مرزهای شکننده سوژه بینجامد.',
          'وظیفه روانکاو در اینجا «دگرشنیدن» و قرار گرفتن در جایگاه «کاتب» (Secrétaire de l’aliéné) است؛ یعنی شنیدن دقیق گواهی بیمار بدون تحمیل معنای پیش‌ساخته از سوی درمانگر.',
        ],
        footnote: '۳. رجوع کنید به کتاب «دگر شنیدن در روانکاوی»، دکتر حسن مکارمی.',
      },
      {
        pageNumber: 111,
        chapterTitle: 'فصل نهم: از دگرشنیدن بالینی تا اخلاق روانکاوی',
        heading: 'زبان به مثابه مسکن سوژه',
        bodyParagraphs: [
          'انسان پیش از آنکه سخن بگوید، در دریای زبان غوطه‌ور است. نام ما، آرزوهای والدین و تاریخ ناگفته خانواده، پیش از تولد ما در زنجیره دال‌ها حک شده‌اند.',
          'شناخت این ساختار زبانی به ما امکان می‌دهد که در بالین، به جای سرکوب نشانه (Symptôme)، پیام رمزگذاری‌شده درون آن را بشنویم و راه را برای آفرینش و معناگشایی تازه بگشاییم.',
        ],
      },
    ],
  },
  'listening-differently-to-hafez': {
    slug: 'listening-differently-to-hafez',
    direction: 'rtl',
    genreKey: 'hafez',
    genreLabel: BOOK_GENRE_LABELS.hafez,
    trimSizeLabel: {
      fa: 'رقعی گالینگور (۱۴.۵×۲۱.۵ سانتی‌متر)',
      fr: 'Format Octavo (14.5×21.5 cm)',
      en: 'Octavo Hardcover (14.5×21.5 cm)',
    },
    widthMm: 145,
    heightMm: 215,
    paperLabel: {
      fa: 'بالکی نخودی ۷۰ گرم',
      fr: 'Papier Ivoire 70g',
      en: 'Cream Book Paper 70gsm',
    },
    paperGsm: 70,
    bulkFactor: 1.75,
    spineWidthMm: 18.4,
    weightGrams: 390,
    coverPalette: {
      frontBg: '#16283E',
      frontSecondary: '#203A58',
      spineBg: '#0F1C2C',
      backBg: '#16283E',
      accentGold: '#E2B857',
      borderFrame: 'rgba(226, 184, 87, 0.45)',
    },
    previewStartPage: 48,
    previewEndPage: 86,
    colophonText: {
      fa: 'انتشارات آلیان و نشر فروغ • پاریس / کلن • شابک: 978-2954890017 • مجموعه پژوهش‌های حافظ‌پژوهی و روانکاوی ادبیات.',
      fr: 'Éditions Alian / Forough • Paris / Cologne • ISBN : 978-2954890017',
      en: 'Éditions Alian / Forough • Paris / Cologne • ISBN: 978-2954890017',
    },
    dedicationText: {
      fa: 'به شیراز، زادگاهم، و به روح بلند خواجه شمس‌الدین محمد حافظ شیرازی که آیینه ناخودآگاه سرزمین فرهنگی ایران است.',
      fr: 'À Chiraz, ma ville natale, et à Hafez, miroir de l’inconscient culturel persan.',
      en: 'To Shiraz, my birthplace, and to Hafez, mirror of the Persian cultural unconscious.',
    },
    previewPages: [
      {
        pageNumber: 48,
        chapterTitle: 'گفتار سوم: رند شیراز و شالوده‌شکنی از ریاکاری',
        heading: 'ایهام در کلام حافظ؛ بازی بی‌پایان دال‌ها',
        bodyParagraphs: [
          'چرا هر ایرانی هنگامی که دیوان حافظ را می‌گشاید، گویی صدای درونی‌ترین راز ناگفته خویش را از زبان خواجه می‌شنود؟ پاسخ را باید در ساختار چندلایه و ایهام‌گونه کلام حافظ جستجو کرد.',
          'حافظ واژه را از تک‌معنایی جزم‌اندیشانه رها می‌سازد. در غزل او، «می»، «پیر مغان»، «زلف» و «خرابات» دال‌هایی سیال هستند که میان ساحت زمینی و ساحت استعلایی در نوسان‌اند و ذهن خواننده را به «دیگرشنیدن» فرامی‌خوانند.',
        ],
        calligraphyQuote: '«غلام همت آنم که زیر چرخ کبود / ز هر چه رنگ تعلق پذیرد آزاد است»',
      },
      {
        pageNumber: 49,
        chapterTitle: 'گفتار سوم: رند شیراز و شالوده‌شکنی از ریاکاری',
        heading: 'تبارشناسی زهد ریاکارانه و آزادی سوژه',
        bodyParagraphs: [
          'در روزگاری که محتسب و زاهد ظاهرپرست، حقیقت را در قفس شریعت خشک زندانی کرده بودند، حافظ با ابداع مفهوم «رند»، جایگاهی نو برای سوژه آزاد خلق کرد.',
          'رند کسی است که نقاب تقوای دروغین را کنار می‌زند و کاستی و شکاف وجودی انسان را می‌پذیرد؛ و درست از دل همین پذیرش کاستی است که عشق و مدارا جوانه می‌زند.',
        ],
      },
    ],
  },
  'strategic-look-at-transition': {
    slug: 'strategic-look-at-transition',
    direction: 'rtl',
    genreKey: 'strategy',
    genreLabel: BOOK_GENRE_LABELS.strategy,
    trimSizeLabel: {
      fa: 'وزیری (۱۷×۲۴ سانتی‌متر)',
      fr: 'Format 17×24 cm',
      en: 'Royal Octavo (17×24 cm)',
    },
    widthMm: 170,
    heightMm: 240,
    paperLabel: {
      fa: 'بالکی سفید ۸۰ گرم',
      fr: 'Papier Blanc 80g',
      en: 'White Offset 80gsm',
    },
    paperGsm: 80,
    bulkFactor: 1.6,
    spineWidthMm: 20.5,
    weightGrams: 460,
    coverPalette: {
      frontBg: '#1F2430',
      frontSecondary: '#2C3344',
      spineBg: '#161A24',
      backBg: '#1F2430',
      accentGold: '#D4AF37',
      borderFrame: 'rgba(212, 175, 55, 0.4)',
    },
    previewStartPage: 72,
    previewEndPage: 112,
    colophonText: {
      fa: 'انتشارات اچ‌انداس مدیا (H&S Media) • لندن ۲۰۱۲ • شابک: 978-1780831022',
      fr: 'H&S Media • Londres 2012 • ISBN : 978-1780831022',
      en: 'H&S Media • London 2012 • ISBN: 978-1780831022',
    },
    dedicationText: {
      fa: 'به جوانان و شهروندان ایران که برای آزادی، دموکراسی سکولار و حقوق بشر می‌کوشند.',
      fr: 'Aux citoyens d’Iran œuvrant pour la démocratie laïque et les droits humains.',
      en: 'To the citizens of Iran striving for secular democracy and human rights.',
    },
    previewPages: [
      {
        pageNumber: 72,
        chapterTitle: 'فصل سوم: مدیریت بحران و عدالت انتقالی در دوران گذار',
        heading: 'پرهیز از چرخه خشونت و استقرار حاکمیت قانون',
        bodyParagraphs: [
          'تجربه تاریخی ملت‌ها نشان می‌دهد که گذار پایدار به دموکراسی، بدون برنامه‌ریزی دقیق برای صد روز نخست پس از تغییر، با خطر هرج‌ومرج یا بازتولید استبداد روبرو می‌شود.',
          'عدالت انتقالی و دادخواهی شفاف در دادگاه‌های صالحه و مستقل، تنها راه جایگزین کردن انتقام‌جویی فردی با حاکمیت قانون و آشتی ملی بر پایه حقیقت است.',
        ],
      },
      {
        pageNumber: 73,
        chapterTitle: 'فصل سوم: مدیریت بحران و عدالت انتقالی در دوران گذار',
        heading: 'تمرکززدایی اداری در چارچوب یکپارچگی سرزمینی',
        bodyParagraphs: [
          'سرزمین ایران با تنوع کم‌نظیر زبانی و اقلیمی خود، نیازمند الگویی مدرن از مدیریت محلی و استانی است تا شهروندان هر منطقه در تصمیم‌گیری‌های عمرانی، فرهنگی و اقتصادی خود مشارکت مستقیم داشته باشند.',
        ],
      },
    ],
  },
  'hafez-par-hafez': {
    slug: 'hafez-par-hafez',
    direction: 'ltr',
    genreKey: 'hafez',
    genreLabel: BOOK_GENRE_LABELS.hafez,
    trimSizeLabel: {
      fa: 'قطع فرانسوی لارماتان (۱۳.۵×۲۱.۵ سانتی‌متر)',
      fr: 'Format L’Harmattan (13.5×21.5 cm)',
      en: 'French Trade Paperback (13.5×21.5 cm)',
    },
    widthMm: 135,
    heightMm: 215,
    paperLabel: {
      fa: 'کاغذ تحریر فرانسوی ۸۰ گرم',
      fr: 'Papier Édition 80g',
      en: 'French Edition Paper 80gsm',
    },
    paperGsm: 80,
    bulkFactor: 1.65,
    spineWidthMm: 17.5,
    weightGrams: 350,
    coverPalette: {
      frontBg: '#2C1810',
      frontSecondary: '#46271B',
      spineBg: '#1E100A',
      backBg: '#2C1810',
      accentGold: '#E5C158',
      borderFrame: 'rgba(229, 193, 88, 0.45)',
    },
    previewStartPage: 34,
    previewEndPage: 68,
    colophonText: {
      fa: 'انتشارات لارماتان (Éditions L’Harmattan) • پاریس • به زبان فرانسه (چپ‌به‌راست LTR)',
      fr: 'Éditions L’Harmattan • Collection Iran en Transition • Paris',
      en: 'Éditions L’Harmattan • Paris (French LTR Edition)',
    },
    dedicationText: {
      fa: 'به خوانندگان فرانسوی‌زبان که جویای شناخت راز غزل حافظ و روح فرهنگ ایرانی هستند.',
      fr: 'Aux lecteurs francophones désireux d’écouter autrement la parole poétique de Hafez de Chiraz.',
      en: 'To Francophone readers seeking to listen differently to Hafez of Shiraz.',
    },
    previewPages: [
      {
        pageNumber: 34,
        chapterTitle: 'Chapitre II : Écouter autrement le Divân de Hafez',
        heading: 'La polysémie du Ghazal et l’inconscient structuré comme un langage',
        bodyParagraphs: [
          'Lire Hafez à travers sa propre terminologie (« Hafez par Hafez ») exige de dépasser les lectures purement mystiques ou littérales. Chaque distique fonctionne comme un prisme où le désir humain et la quête spirituelle se reflètent mutuellement.',
          'Dans la tradition persane, le poème n’est pas un simple ornement esthétique : il constitue le lieu même où la subjectivité résiste au dogmatisme et à l’hypocrisie sociale.',
        ],
      },
      {
        pageNumber: 35,
        chapterTitle: 'Chapitre II : Écouter autrement le Divân de Hafez',
        heading: 'La figure du Rend : éthique de la liberté intérieure',
        bodyParagraphs: [
          'Le « Rend » hafézien incarne une éthique radicale de la sincérité. En refusant les semblants de la vertu ostentatoire, il inaugure un espace de tolérance et de lucidité qui demeure d’une brûlante actualité.',
        ],
      },
    ],
  },
};

export function getBookStudioProfile(
  slug: string,
  pageCount: number = 240,
  pillar: ContentPillar = 'psychoanalysis'
): BookStudioProfile {
  if (BOOK_STUDIO_PROFILES[slug]) {
    return BOOK_STUDIO_PROFILES[slug];
  }

  const isFrenchLtr =
    slug.includes('regards-croises') ||
    slug.includes('mutation-culturelle') ||
    slug.includes('hafez-par-hafez');

  const genreMap: Record<ContentPillar, BookGenreKey> = {
    psychoanalysis: 'psychoanalysis',
    art_calligraphy: slug.includes('hafez') ? 'hafez' : slug.includes('piano') || slug.includes('garden') ? 'poetry' : 'art',
    cultural_strategy: slug.includes('cultural-land') ? 'culture' : slug.includes('bazaar') || slug.includes('diary') ? 'novel' : 'strategy',
    human_rights_dadkhahi: 'memoir',
  };

  const genreKey = genreMap[pillar] || 'psychoanalysis';
  const spineMm = Number(((pageCount / 2) * 0.07 * 1.8 + 3).toFixed(1));
  const startP = Math.min(40, Math.max(12, Math.floor(pageCount * 0.25)));
  const endP = Math.min(pageCount - 10, startP + 32);

  return {
    slug,
    direction: isFrenchLtr ? 'ltr' : 'rtl',
    genreKey,
    genreLabel: BOOK_GENRE_LABELS[genreKey],
    trimSizeLabel: {
      fa: 'وزیری (۱۷×۲۴ سانتی‌متر)',
      fr: 'Format 17×24 cm',
      en: 'Royal Octavo (17×24 cm)',
    },
    widthMm: 170,
    heightMm: 240,
    paperLabel: {
      fa: 'بالکی نخودی ۷۰ گرم (ضریب ۱.۸)',
      fr: 'Papier Ivoire 70g',
      en: 'Warm Cream 70gsm',
    },
    paperGsm: 70,
    bulkFactor: 1.8,
    spineWidthMm: spineMm,
    weightGrams: Math.round(pageCount * 2.1 + 95),
    coverPalette:
      genreKey === 'psychoanalysis'
        ? {
          frontBg: '#122922',
          frontSecondary: '#1B3B32',
          spineBg: '#0E201B',
          backBg: '#142D25',
          accentGold: '#D4AF37',
          borderFrame: 'rgba(212, 175, 55, 0.45)',
        }
        : genreKey === 'hafez' || genreKey === 'poetry'
          ? {
            frontBg: '#16283E',
            frontSecondary: '#213B5A',
            spineBg: '#0E1A2A',
            backBg: '#16283E',
            accentGold: '#E2B857',
            borderFrame: 'rgba(226, 184, 87, 0.45)',
          }
          : genreKey === 'memoir' || genreKey === 'novel'
            ? {
              frontBg: '#2E1A1E',
              frontSecondary: '#44262C',
              spineBg: '#201114',
              backBg: '#2E1A1E',
              accentGold: '#D8B467',
              borderFrame: 'rgba(216, 180, 103, 0.45)',
            }
            : {
              frontBg: '#1F2430',
              frontSecondary: '#2C3344',
              spineBg: '#151922',
              backBg: '#1F2430',
              accentGold: '#D4AF37',
              borderFrame: 'rgba(212, 175, 55, 0.45)',
            },
    previewStartPage: startP,
    previewEndPage: endP,
    colophonText: {
      fa: 'انتشارات آلیان / اچ‌انداس مدیا • پاریس و لندن • کلیه حقوق نشر و امضای دیجیتال برای دکتر حسن مکارمی محفوظ است.',
      fr: 'Éditions Alian / L’Harmattan • Paris • Tous droits réservés au Dr Hassan Makaremi.',
      en: 'Éditions Alian / L’Harmattan • Paris • All rights reserved by Dr. Hassan Makaremi.',
    },
    dedicationText: {
      fa: 'تقدیم به اهل اندیشه، فرهنگ و جویندگان راه آزادی و کرامت انسانی در سرزمین فرهنگی ایران.',
      fr: 'Dédié aux amoureux de la culture, de la liberté et de la dignité humaine.',
      en: 'Dedicated to seekers of culture, freedom, and human dignity.',
    },
    previewPages: [
      {
        pageNumber: startP,
        chapterTitle: isFrenchLtr ? 'Chapitre I : Introduction et Perspectives' : 'فصل برگزیده: درآمدی بر دیگرشنیدن و واکاوی متن',
        heading: isFrenchLtr ? 'Approche analytique et culturelle' : 'پیوند ناخودآگاه، زبان و حافظه تاریخی',
        bodyParagraphs: isFrenchLtr
          ? [
            'Dans cet ouvrage, le Dr Hassan Makaremi propose une lecture croisée où la clinique psychanalytique éclaire les mutations culturelles et artistiques.',
            'Chaque chapitre invite le lecteur à dépasser les évidences immédiates pour interroger la structure profonde du discours et de la mémoire.',
          ]
          : [
            'در این بخش از کتاب، دکتر حسن مکارمی با تکیه بر روش‌شناسی «دگرشنیدن»، لایه‌های پنهان زبان، فرهنگ و تجربه زیسته را از ورای عادت‌های روزمره واکاوی می‌کند.',
            'خواننده در این تورق با پیوند ظریف میان ساختار روان، تاریخ اجتماعی و آفرینش هنری روبرو می‌شود؛ جایی که واژگان به آیینه‌ای برای شناخت خویشتن بدل می‌گردند.',
          ],
      },
      {
        pageNumber: startP + 1,
        chapterTitle: isFrenchLtr ? 'Chapitre I : Suite' : 'ادامه فصل برگزیده: افق‌های نو در اندیشه و عمل',
        heading: isFrenchLtr ? 'Dialogue des cultures et subjectivité' : 'از آسیب‌شناسی گسست تا بازسازی پیوند نمادین',
        bodyParagraphs: isFrenchLtr
          ? [
            'La reconstruction du lien symbolique passe par la parole vraie, la création artistique et la reconnaissance mutuelle au sein de la cité.',
          ]
          : [
            'التیام زخم‌های تاریخی و فردی تنها زمانی ممکن می‌شود که رنج‌های ناگفته به ساحت کلام و قانون راه یابند و به جای تکرار خشونت، به آگاهی و همبستگی مدنی منتهی شوند.',
          ],
      },
    ],
  };
}

// =============================================================================
// 4. THEMATIC ART GALLERIES (/galleries-persan/ در سایت وردپرسی)
// =============================================================================

export interface ThematicGallerySeries {
  id: string;
  slug: string;
  year: number;
  dimensions: string;
  medium: Record<Locale, string>;
  title: Record<Locale, string>;
  inspiration: Record<Locale, string>;
  curatorStatement: Record<Locale, string>;
  critiqueAuthor?: Record<Locale, string>;
  artworkCount: number;
}

export const THEMATIC_GALLERIES: ThematicGallerySeries[] = [
  {
    id: 'gal-hafez-2015',
    slug: 'sabt-eghdamat-hafez-2015',
    year: 2015,
    dimensions: '100×100 cm & 120×90 cm',
    medium: {
      fa: 'مرکب، اکریلیک و ورق طلا روی بوم',
      fr: 'Encre, acrylique et feuille d’or sur toile',
      en: 'Ink, acrylic and gold leaf on canvas',
    },
    title: {
      fa: 'مجموعه «ثبت اقدامات / حافظ ۲۰۱۵»',
      fr: 'Série « Résonances de Hafez 2015 »',
      en: '“Hafez Resonances 2015” Series',
    },
    inspiration: {
      fa: 'الهام از غزلیات خواجه شمس‌الدین محمد حافظ شیرازی',
      fr: 'Inspirée des Ghazals de Hafez de Chiraz',
      en: 'Inspired by the Ghazals of Hafez of Shiraz',
    },
    curatorStatement: {
      fa: 'در این مجموعه، ابیات حافظ از قالب سطرهای افقی رها شده و به میدان ارتعاش رنگ و حرکت دایره‌ای قلم‌مو بدل شده‌اند تا «دیگرشنیدن حافظ» در ساحت بصری تجربه شود.',
      fr: 'Les vers de Hafez se libèrent de la ligne horizontale pour devenir vibration chromatique et mouvement circulaire.',
      en: 'Verses of Hafez break free from horizontal lines into chromatic vibration and circular calligraphic motion.',
    },
    artworkCount: 18,
  },
  {
    id: 'gal-in-bagh-ra-hava-toyi',
    slug: 'in-bagh-ra-hava-toyi',
    year: 2014,
    dimensions: '300×200 cm (بوم عظیم ۶ مترمربعی)',
    medium: {
      fa: 'اکریلیک و مرکب روی بوم یکپارچه',
      fr: 'Acrylique et encre sur toile monumentale (3×2 m)',
      en: 'Acrylic and ink on monumental canvas (3×2 m)',
    },
    title: {
      fa: 'مجموعه و تابلوی عظیم «این باغ را هوا تویی»',
      fr: 'Toile monumentale « Tu es le souffle de ce jardin »',
      en: 'Monumental Canvas “You Are the Breeze of This Garden”',
    },
    inspiration: {
      fa: 'گفتگوی شعر معاصر، طبیعت شیراز و خط شکسته نستعلیق',
      fr: 'Dialogue entre la poésie persane, les jardins de Chiraz et le Shekasteh',
      en: 'Dialogue between Persian poetry, gardens of Shiraz, and Shekasteh script',
    },
    curatorStatement: {
      fa: 'تابلوی ۳ در ۲ متری «این باغ را هوا تویی» یکی از شاخص‌ترین آثار موزه‌ای دکتر مکارمی است که در آن واژگان همچون برگ‌ها و نسیم صبحگاهی در سراسر بوم تنفس می‌کنند.',
      fr: 'Une œuvre muséale majeure de 3×2 mètres où la lettre respire comme le vent dans un jardin persan.',
      en: 'A major 3×2m museum work where calligraphic letters breathe across the canvas like wind through a Persian garden.',
    },
    artworkCount: 12,
  },
  {
    id: 'gal-man-na-manam',
    slug: 'man-na-manam-havana-paris',
    year: 2013,
    dimensions: '80×120 cm',
    medium: {
      fa: 'تکنیک ترکیبی روی بوم و کاغذ دست‌ساز',
      fr: 'Technique mixte sur toile et papier artisanal',
      en: 'Mixed media on canvas and handmade paper',
    },
    title: {
      fa: 'مجموعه «من نه منم» (نمایشگاه هاوانا کوبا و پاریس)',
      fr: 'Série « Je ne suis pas moi » (La Havane & Paris)',
      en: '“I Am Not Myself” Series (Havana & Paris)',
    },
    inspiration: {
      fa: 'الهام از مولانا و مفهوم سوژه شکافته در روانکاوی لکانی',
      fr: 'Inspirée de Rûmî et du sujet divisé dans la psychanalyse lacanienne',
      en: 'Inspired by Rumi and the divided subject in Lacanian psychoanalysis',
    },
    curatorStatement: {
      fa: 'مجموعه «من نه منم» با نقد تحلیلی فرهاد زمانی، کاوشی تجسمی در مفهوم «ایگو و ناخودآگاه» است که در هاوانا (کوبا) و پاریس به نمایش درآمد.',
      fr: 'Exploration visuelle du sujet de l’inconscient exposée à La Havane (Cuba) et à Paris, accompagnée de la critique de Farhad Zamani.',
      en: 'Visual exploration of the unconscious subject exhibited in Havana (Cuba) and Paris, with critical commentary by Farhad Zamani.',
    },
    critiqueAuthor: {
      fa: 'با نقد هنری فرهاد زمانی',
      fr: 'Critique d’art : Farhad Zamani',
      en: 'Art Critique by Farhad Zamani',
    },
    artworkCount: 22,
  },
  {
    id: 'gal-nezami-eshgh',
    slug: 'kaz-eshgh-be-ghayati-resanam',
    year: 2011,
    dimensions: '90×90 cm',
    medium: {
      fa: 'مرکب، رنگ‌دانه طبیعی و قلم نی روی بوم',
      fr: 'Encre, pigments naturels et calame sur toile',
      en: 'Ink, natural pigments, and reed pen on canvas',
    },
    title: {
      fa: 'مجموعه «کز عشق به غایتی رسانم»',
      fr: 'Série « Porter l’amour à son apogée » (Nizami)',
      en: '“Bringing Love to Its Zenith” Series (Nizami)',
    },
    inspiration: {
      fa: 'الهام از خمسه نظامی گنجوی و خسرو و شیرین',
      fr: 'Inspirée de Nizami Ganjavi',
      en: 'Inspired by Nizami Ganjavi’s Khosrow and Shirin',
    },
    curatorStatement: {
      fa: 'بازآفرینی شور عاشقانه و حماسی نظامی گنجوی در فرم‌های انتزاعی و ریتمیک خوشنویسی مدرن.',
      fr: 'Réinterprétation contemporaine de la poésie épique et amoureuse de Nizami.',
      en: 'Contemporary calligraphic reinterpretation of Nizami’s lyrical epic.',
    },
    artworkCount: 15,
  },
  {
    id: 'gal-sohrab-ghali',
    slug: 'man-che-sabzam-emrouz-sohrab',
    year: 2010,
    dimensions: '150×100 cm',
    medium: {
      fa: 'بافت فرش دست‌باف و طراحی نقاشی‌خط',
      fr: 'Tapisserie d’art et calligraphie picturale',
      en: 'Art tapestry and calligraphic design',
    },
    title: {
      fa: 'مجموعه و قالی هنری «من چه سبزم امروز»',
      fr: 'Série & Tapis d’Art « Que je suis verdoyant aujourd’hui »',
      en: 'Art Carpet & Series “How Green I Am Today”',
    },
    inspiration: {
      fa: 'الهام از اشعار سهراب سپهری و هنر قالی‌بافی ایرانی',
      fr: 'Inspirée de Sohrab Sepehri et de l’art du tapis persan',
      en: 'Inspired by Sohrab Sepehri and Persian carpet artistry',
    },
    curatorStatement: {
      fa: 'پیوند میان شعر نو سهراب سپهری، نقاشی‌خط معاصر و هنر دیرینه قالی ایرانی در همکاری با بافندگان چیره‌دست.',
      fr: 'Alliance entre la poésie moderne de Sohrab Sepehri, la calligraphie et le tissage d’art persan.',
      en: 'Synthesis of Sohrab Sepehri’s modern poetry, calligraphy, and traditional Persian weaving.',
    },
    artworkCount: 9,
  },
];

// =============================================================================
// 5. MEDIA & TV SERIES CATALOG (مجموعه‌های بزرگ ویدیویی سایت وردپرسی)
// =============================================================================

export interface VideoSeriesInfo {
  id: string;
  slug: string;
  episodeCount: number;
  pillar: ContentPillar;
  title: Record<Locale, string>;
  broadcaster: Record<Locale, string>;
  description: Record<Locale, string>;
  sampleTopics: Record<Locale, string[]>;
}

export const VIDEO_SERIES_CATALOG: VideoSeriesInfo[] = [
  {
    id: 'series-dar-ravanpajoohi',
    slug: 'dar-ravanpajoohi-ba-makaremi',
    episodeCount: 65,
    pillar: 'psychoanalysis',
    title: {
      fa: 'مجموعه «در روان‌‌پژوهی با دکتر حسن مکارمی» (۶۵+ قسمت)',
      fr: 'Série « Recherche Psychanalytique avec le Dr Makaremi » (65+ épisodes)',
      en: '“In Psycho-Research with Dr. Hassan Makaremi” Series (65+ Episodes)',
    },
    broadcaster: {
      fa: 'برنامه‌های آموزشی و تحلیلی تلویزیونی (پاریس)',
      fr: 'Émissions éducatives et cliniques (Paris)',
      en: 'Educational & Clinical Broadcast Series (Paris)',
    },
    description: {
      fa: 'مجموعه‌ای بالغ بر ۶۵ گفتار تخصصی پیرامون مفاهیم بنیادین روانکاوی فرویدی و لکانی، ساختارهای بالینی، تروما، اضطراب، عشق، زبان و روانکاوی فرهنگ ایرانی.',
      fr: 'Plus de 65 émissions consacrées aux concepts fondamentaux de Freud et Lacan, à la clinique du trauma et à la culture.',
      en: 'Over 65 in-depth episodes exploring Freudian and Lacanian psychoanalysis, clinical structures, trauma, and culture.',
    },
    sampleTopics: {
      fa: [
        'ساختار ناخودآگاه و زبان (بخش ۱ تا ۱۰)',
        'عقده ادیپ و استعاره نام پدر (بخش ۱۱ تا ۲۲)',
        'روانکاوی تروما، سوگواری و مهاجرت (بخش ۲۳ تا ۴۰)',
        'ما ایرانیان از نگاهی دیگر؛ روانکاوی فرهنگ (بخش ۴۱ تا ۶۵)',
      ],
      fr: [
        'L’inconscient structuré comme un langage',
        'La métaphore paternelle et le Nom-du-Père',
        'Clinique de l’exil, du deuil et du trauma collectif',
      ],
      en: [
        'The Unconscious Structured as a Language',
        'The Paternal Metaphor and Name-of-the-Father',
        'Clinical Psychoanalysis of Exile, Mourning, and Trauma',
      ],
    },
  },
  {
    id: 'series-negah-e-ravankav',
    slug: 'negah-e-ravankav',
    episodeCount: 81,
    pillar: 'psychoanalysis',
    title: {
      fa: 'مجموعه «نگاه روانکاو» (۸۱+ قسمت)',
      fr: 'Série « Le Regard du Psychanalyste » (81+ épisodes)',
      en: '“The Psychoanalyst’s Gaze” Series (81+ Episodes)',
    },
    broadcaster: {
      fa: 'تلویزیون و رسانه همگانی فارسی‌زبان',
      fr: 'Médias audiovisuels persanophones',
      en: 'Persian Broadcast Media',
    },
    description: {
      fa: 'بیش از ۸۱ برنامه گفتگو محور درباره مسائل روزمره روانی، خانواده، تربیت کودک، خشونت خانگی، اعتیاد، افسردگی و بهداشت روان جامعه با زبانی روشن و علمی.',
      fr: 'Plus de 81 épisodes analysant les enjeux psychologiques contemporains : famille, enfance, violence et santé mentale.',
      en: 'Over 81 episodes addressing everyday psychological challenges, family dynamics, child development, and social mental health.',
    },
    sampleTopics: {
      fa: [
        'تربیت کودک و شکل‌گیری تصویر تن (فرانسواز دولتو)',
        'ریشه‌های روانی خشونت در خانواده و جامعه',
        'روانکاوی اعتیاد، افسردگی و بحران هویت در تبعید',
        'گفتگو در خانواده و مهارت «دگرشنیدن»',
      ],
      fr: [
        'L’image inconsciente du corps chez l’enfant (Dolto)',
        'Racines psychiques de la violence sociale',
        'Identité, exil et écoute au sein de la famille',
      ],
      en: [
        'Unconscious Body Image in Childhood (Dolto)',
        'Psychological Roots of Social Violence',
        'Identity, Exile, and Listening within the Family',
      ],
    },
  },
  {
    id: 'series-sedaye-sokhan-eshgh',
    slug: 'sedaye-sokhan-eshgh-hafez',
    episodeCount: 14,
    pillar: 'art_calligraphy',
    title: {
      fa: 'مجموعه «صدای سخن عشق» — دیگرشنیدن حافظ (۱۴ قسمت)',
      fr: 'Série « La Voix de l’Amour : Écouter Hafez » (14 épisodes)',
      en: '“The Voice of Love: Listening Differently to Hafez” (14 Episodes)',
    },
    broadcaster: {
      fa: 'نشست‌های حافظ‌پژوهی پاریس و کلن',
      fr: 'Séminaires haféziens à Paris et Cologne',
      en: 'Hafezology Seminars in Paris & Cologne',
    },
    description: {
      fa: 'واکاوی غزل‌به‌غزل دیوان حافظ از منظر زبان‌شناسی، اسطوره‌شناسی و روانکاوی لکانی، همراه با خوانش و کالبدشکافی واژگان کلیدی خواجه شیراز.',
      fr: 'Analyse sémiotique et psychanalytique des Ghazals de Hafez de Chiraz.',
      en: 'Semiotic and psychoanalytic exploration of the Ghazals of Hafez of Shiraz.',
    },
    sampleTopics: {
      fa: [
        'مفهوم «دل» در فرهنگ پارسی و شعر حافظ',
        'رند، زاهد و محتسب؛ مثلث قدرت و آزادی در دیوان حافظ',
        'هستی‌شناسی عشق و پیوند خط و شعر',
      ],
      fr: [
        'Le concept de « Del » (Cœur) dans la poésie persane',
        'Le Rend face à l’hypocrisie du pouvoir',
      ],
      en: [
        'The Concept of “Del” (Heart) in Persian Poetry',
        'The Rend Confronting Hypocrisy and Power',
      ],
    },
  },
  {
    id: 'series-symbolism-to-nastaaliq',
    slug: 'az-namadpardazi-ta-nastaaliq',
    episodeCount: 4,
    pillar: 'art_calligraphy',
    title: {
      fa: 'مجموعه «از نمادپردازی تا خوشنویسی نستعلیق» (۴ بخش)',
      fr: 'Série « Du Symbolisme à la Calligraphie Nasta’liq » (4 parties)',
      en: '“From Symbolism to Nasta’liq Calligraphy” (4 Parts)',
    },
    broadcaster: {
      fa: 'مستند و کنفرانس تاریخ هنر خوشنویسی (پاریس / یونسکو)',
      fr: 'Conférences d’histoire de l’art calligraphique (Paris / UNESCO)',
      en: 'Calligraphic Art History Lectures (Paris / UNESCO)',
    },
    description: {
      fa: 'تبارشناسی پیدایش خط در فلات ایران، گذار از تصویرنگاری به حروف، تکامل نستعلیق و شکسته نستعلیق و ورود به نقاشی‌خط مدرن.',
      fr: 'Généalogie de l’écriture en Iran, naissance du Nasta’liq et émergence de la calligraphie picturale moderne.',
      en: 'Genealogy of script on the Iranian plateau, evolution of Nasta’liq, and modern calligraphic painting.',
    },
    sampleTopics: {
      fa: [
        'بخش اول: از نقش‌مایه‌های سفال شوش تا پیدایش خط',
        'بخش دوم: هندسه روحانی در خط تعلیق و نستعلیق',
        'بخش سوم: شکسته نستعلیق؛ رقص قلم و رهایی فرم',
        'بخش چهارم: نقاشی‌خط معاصر در گفتگوی شرق و غرب',
      ],
      fr: [
        'Des poteries de Suse à la naissance de l’écriture',
        'Géométrie spirituelle du Nasta’liq et du Shekasteh',
      ],
      en: [
        'From Susa Pottery Motifs to the Birth of Script',
        'Spiritual Geometry of Nasta’liq and Shekasteh',
      ],
    },
  },
  {
    id: 'series-60-years-biography',
    slug: 'morouri-bar-60-sal-zendegi',
    episodeCount: 4,
    pillar: 'cultural_strategy',
    title: {
      fa: 'مستند ۴ قسمتی «مروری بر شصت سال زندگی» (با سپاس از مینا راد)',
      fr: 'Documentaire en 4 parties « Soixante ans d’itinéraire intellectuel et artistique »',
      en: '4-Part Biographical Documentary “Sixty Years of Life, Art & Thought”',
    },
    broadcaster: {
      fa: 'فیلم مستند زندگی‌نامه به کارگردانی و همراهی مینا راد',
      fr: 'Film biographique réalisé avec Mina Rad',
      en: 'Biographical Documentary produced with Mina Rad',
    },
    description: {
      fa: 'روایت تصویری کودکی و نوجوانی در شیراز، تحصیل در پلی‌تکنیک تهران، مهاجرت به فرانسه، تحصیل در اکول سانترال، پزشکی پاریس ۷ و سوربن، و دهه‌ها آفرینش هنری و تلاش مدنی.',
      fr: 'Récit visuel de Chiraz à Paris : études, psychanalyse, calligraphie et engagement pour les droits humains.',
      en: 'Visual chronicle from Shiraz to Paris: academia, psychoanalysis, calligraphy, and human rights advocacy.',
    },
    sampleTopics: {
      fa: [
        'قسمت اول: شیراز، بازار وکیل و نخستین مشق‌های خوشنویسی',
        'قسمت دوم: پلی‌تکنیک تهران، دانشگاه شیراز و سال‌های پرالتهاب',
        'قسمت سوم: پاریس، اکول سانترال، سوربن و بالین روانکاوی',
        'قسمت چهارم: نمایشگاه‌های جهانی، موزه مسکو و سفرهای زندگی',
      ],
      fr: [
        'Partie 1 : Chiraz et l’initiation calligraphique',
        'Partie 2 : Polytechnique de Téhéran et l’enseignement',
        'Partie 3 : Paris, École Centrale, Sorbonne et psychanalyse',
        'Partie 4 : Expositions internationales et droits humains',
      ],
      en: [
        'Part 1: Shiraz & Early Calligraphic Apprenticeship',
        'Part 2: Tehran Polytechnic & University Teaching',
        'Part 3: Paris, École Centrale, Sorbonne & Clinical Practice',
        'Part 4: World Exhibitions & Human Rights Advocacy',
      ],
    },
  },
];

// =============================================================================
// 6. INTERVIEWS ARCHIVE (/entretiens-fa/ — 34+ Media Interviews)
// =============================================================================

export interface MediaInterviewItem {
  id: string;
  date: string;
  outlet: Record<Locale, string>;
  interviewer?: Record<Locale, string>;
  topicCategory: 'psychoanalysis' | 'human_rights' | 'hafez_culture' | 'strategy' | 'art';
  title: Record<Locale, string>;
  summary: Record<Locale, string>;
}

export const MEDIA_INTERVIEWS_ARCHIVE: MediaInterviewItem[] = [
  {
    id: 'int-rfi-white-torture',
    date: '2016-05-18',
    outlet: {
      fa: 'رادیو بین‌المللی فرانسه (RFI فارسی)',
      fr: 'RFI Persan (Radio France Internationale)',
      en: 'Radio France Internationale (RFI Persian)',
    },
    topicCategory: 'psychoanalysis',
    title: {
      fa: 'پیامدهای روان‌شناختی سلول انفرادی و «شکنجه سفید» بر ساختار سوژه',
      fr: 'Conséquences psychiques de l’isolement cellulaire et de la « torture blanche »',
      en: 'Psychological Impact of Solitary Confinement and “White Torture”',
    },
    summary: {
      fa: 'تحلیل بالینی محرومیت حسی در سلول انفرادی، فروپاشی مرزهای تصویر تن و چگونگی بازسازی روانی زندانیان سیاسی پس از آزادی.',
      fr: 'Analyse clinique de la privation sensorielle et de la reconstruction subjective après l’incarcération.',
      en: 'Clinical analysis of sensory deprivation and psychological recovery of political prisoners.',
    },
  },
  {
    id: 'int-zamaneh-collective-trauma',
    date: '2017-08-24',
    outlet: {
      fa: 'رادیو زمانه (آمستردام)',
      fr: 'Radio Zamaneh (Amsterdam)',
      en: 'Radio Zamaneh (Amsterdam)',
    },
    topicCategory: 'human_rights',
    title: {
      fa: 'سوگواری ممنوع، تروماهای بین‌نسلی و ضرورت روان‌شناختی دادخواهی خاوران',
      fr: 'Deuil interdit, traumatisme transgénérationnel et nécessité de la justice',
      en: 'Forbidden Mourning, Intergenerational Trauma, and Transitional Justice',
    },
    summary: {
      fa: 'بررسی انتقال ناخودآگاه زخم‌های تاریخی دهه ۶۰ به نسل‌های بعدی و نقش حقیقت‌یابی در درمان افسردگی و خشم جمعی جامعه ایران.',
      fr: 'Comment les traumatismes historiques non parlés se transmettent aux nouvelles générations.',
      en: 'How unspoken historical traumas are transmitted across generations and healed through truth-telling.',
    },
  },
  {
    id: 'int-rfi-hafez-secret',
    date: '2015-10-12',
    outlet: {
      fa: 'رادیو بین‌المللی فرانسه (بخش فرهنگ و ادب)',
      fr: 'RFI Culture',
      en: 'RFI Cultural Program',
    },
    topicCategory: 'hafez_culture',
    title: {
      fa: 'چگونه حافظ را «دگرگونه» بشنویم؟ درباره کتاب «نگرشی دیگر بر راز حافظ»',
      fr: 'Comment écouter Hafez autrement ? Autour du secret de Hafez',
      en: 'How to Listen Differently to Hafez? On “Another Look at the Secret of Hafez”',
    },
    summary: {
      fa: 'گفتگو درباره پیوند رندی حافظ با مفهوم سوژه در روانکاوی مدرن و چرایی ماندگاری غزل حافظ در حافظه ایرانیان.',
      fr: 'Entretien sur la modernité radicale du Ghazal de Hafez lu au prisme de la psychanalyse.',
      en: 'Conversation on the radical modernity of Hafez’s Ghazals through a psychoanalytic lens.',
    },
  },
  {
    id: 'int-child-rights-dolto',
    date: '2018-11-20',
    outlet: {
      fa: 'تلویزیون کانال جدید و رادیو فرهنگ',
      fr: 'Kanal Jadid & Radio Farhang',
      en: 'Kanal Jadid & Radio Farhang',
    },
    topicCategory: 'psychoanalysis',
    title: {
      fa: 'حقوق کودک، زبان راستین با نوزاد و آموزه‌های فرانسواز دولتو برای خانواده‌های ایرانی',
      fr: 'Droits de l’enfant, parler vrai au nourrisson et l’héritage de Françoise Dolto',
      en: 'Children’s Rights, Speaking Truthfully to Infants, and Françoise Dolto’s Legacy',
    },
    summary: {
      fa: 'تبیین اهمیت «گفتن حقیقت به کودک از بدو تولد» و نقد خشونت کلامی و تنبیه در نظام تربیتی سنتی.',
      fr: 'L’importance de la parole vraie adressée à l’enfant dès la naissance selon Françoise Dolto.',
      en: 'The clinical importance of speaking truthfully to children from birth according to Françoise Dolto.',
    },
  },
  {
    id: 'int-moscow-museum-art',
    date: '2014-04-09',
    outlet: {
      fa: 'مجله هنر و موزه خوشنویسی مسکو',
      fr: 'Revue du Musée de la Calligraphie de Moscou',
      en: 'Moscow Museum of Calligraphy Review',
    },
    topicCategory: 'art',
    title: {
      fa: 'رقص مرکب بر بوم؛ از خط شکسته نستعلیق سنتی تا نقاشی‌خط آوانگارد در اروپا',
      fr: 'La danse de l’encre : du Shekasteh traditionnel à l’abstraction contemporaine',
      en: 'Dance of Ink: From Traditional Shekasteh to Contemporary Abstraction in Europe',
    },
    summary: {
      fa: 'گفتگو پیرامون تکنیک رهاسازی قلم‌مو، تنفس فضای خالی (خلوت بوم) و چگونگی درک مخاطب غربی از موسیقی بصری حروف فارسی.',
      fr: 'Entretien sur la respiration du vide, le geste spontané et la réception européenne de la calligraphie persane.',
      en: 'Interview on negative space, spontaneous brushwork, and European reception of Persian calligraphy.',
    },
  },
  {
    id: 'int-strategic-iran-future',
    date: '2019-03-15',
    outlet: {
      fa: 'میزگرد مطالعات راهبردی پاریس',
      fr: 'Table Ronde d’Études Stratégiques (Paris)',
      en: 'Paris Strategic Studies Roundtable',
    },
    topicCategory: 'strategy',
    title: {
      fa: 'الزامات نوسازی سازمانی، جامعه مدنی و سکولاریسم در ایران فردا',
      fr: 'Modernisation institutionnelle, société civile et laïcité dans l’Iran de demain',
      en: 'Institutional Modernization, Civil Society, and Secularism in Future Iran',
    },
    summary: {
      fa: 'بررسی نقش نهادهای مدنی، سندیکاها، کانون‌های وکلا و انجمن‌های صنفی به عنوان ستون‌های پایداری دموکراسی در دوران گذار.',
      fr: 'Le rôle crucial des corps intermédiaires et syndicats dans la transition démocratique.',
      en: 'The vital role of civil society institutions and trade unions in democratic transition.',
    },
  },
];

// =============================================================================
// 7. HUMAN RIGHTS REFERENCES & OPEN LETTERS (/references-fa/ — 27+ Documents)
// =============================================================================

export interface HumanRightsReferenceDoc {
  id: string;
  date: string;
  recipient: Record<Locale, string>;
  location: string;
  title: Record<Locale, string>;
  summary: Record<Locale, string>;
  documentType: 'un_letter' | 'lddhi_statement' | 'paris_rally' | 'tribunal_report';
}

export const HUMAN_RIGHTS_REFERENCES_ARCHIVE: HumanRightsReferenceDoc[] = [
  {
    id: 'ref-un-secretary-general-executions',
    date: '2014-10-10',
    recipient: {
      fa: 'دبیرکل سازمان ملل متحد و کمیسر عالی حقوق بشر (ژنو / نیویورک)',
      fr: 'Secrétaire général de l’ONU & Haut-Commissaire aux droits de l’homme',
      en: 'UN Secretary-General & High Commissioner for Human Rights',
    },
    location: 'Paris / Geneva',
    documentType: 'un_letter',
    title: {
      fa: 'نامه سرگشاده و گزارش مستند به دبیرکل سازمان ملل در روز جهانی مبارزه با اعدام',
      fr: 'Lettre ouverte au Secrétaire général de l’ONU contre la peine de mort en Iran',
      en: 'Open Letter to the UN Secretary-General on World Day Against the Death Penalty',
    },
    summary: {
      fa: 'گزارش آماری و حقوقی جامعه دفاع از حقوق بشر در ایران (LDDHI) درباره موج اعدام‌ها، اعدام نوجوانان و فقدان دادرسی عادلانه.',
      fr: 'Rapport documenté de la LDDHI sur les exécutions et l’absence de procès équitable.',
      en: 'Documented LDDHI report on executions, juvenile death penalty, and lack of fair trials.',
    },
  },
  {
    id: 'ref-trocadero-paris-rally',
    date: '2015-06-20',
    recipient: {
      fa: 'افکار عمومی اروپا و نهادهای حقوق بشری فرانسه (میدان حقوق بشر تروکادرو پاریس)',
      fr: 'Parvis des Droits de l’Homme du Trocadéro, Paris',
      en: 'Place du Trocadéro Human Rights Esplanade, Paris',
    },
    location: 'Paris (Trocadéro)',
    documentType: 'paris_rally',
    title: {
      fa: 'بیانیه و سخنرانی در تجمع دفاع از زندانیان عقیدتی، وکلا و کنشگران مدنی در پاریس',
      fr: 'Déclaration au rassemblement du Trocadéro pour la libération des prisonniers d’opinion',
      en: 'Statement at the Trocadéro Rally for Prisoners of Conscience and Human Rights Lawyers',
    },
    summary: {
      fa: 'فراخوان مشترک فدراسیون بین‌المللی جامعه‌های حقوق بشر (FIDH) و LDDHI برای آزادی فوری وکلای دربند، معلمان و فعالان کارگری.',
      fr: 'Appel conjoint de la FIDH et de la LDDHI pour la libération des avocats, enseignants et syndicalistes.',
      en: 'Joint FIDH and LDDHI call for the immediate release of imprisoned lawyers, teachers, and labor activists.',
    },
  },
  {
    id: 'ref-khavaran-1988-tribunal',
    date: '2013-09-01',
    recipient: {
      fa: 'گزارشگر ویژه حقوق بشر سازمان ملل در امور ایران و خانواده‌های خاوران',
      fr: 'Rapporteur spécial des Nations Unies sur la situation des droits de l’homme en Iran',
      en: 'UN Special Rapporteur on the Situation of Human Rights in Iran',
    },
    location: 'Paris / London / The Hague',
    documentType: 'tribunal_report',
    title: {
      fa: 'سند ثبت حقیقت و دادخواهی کشتار زندانیان سیاسی تابستان ۱۳۶۷ و حفاظت از گورستان خاوران',
      fr: 'Mémoire pour la vérité et la justice concernant le massacre de l’été 1988 et Khavaran',
      en: 'Memorial for Truth and Justice on the 1988 Political Prisoners Massacre and Khavaran',
    },
    summary: {
      fa: 'تاکید بر حق خانواده‌ها برای دانستن محل دفن عزیزان، توقف تخریب خاوران و پیگرد آمران جنایت علیه بشریت در مراجع بین‌المللی.',
      fr: 'Défense du droit imprescriptible des familles à la vérité et protection du site de Khavaran.',
      en: 'Defending families’ inalienable right to truth and protection of the Khavaran mass graves.',
    },
  },
  {
    id: 'ref-cultural-heritage-unesco',
    date: '2016-02-14',
    recipient: {
      fa: 'مدیرکل یونسکو (UNESCO) — پاریس',
      fr: 'Direction générale de l’UNESCO — Paris',
      en: 'Director-General of UNESCO — Paris',
    },
    location: 'Paris',
    documentType: 'lddhi_statement',
    title: {
      fa: 'بیانیه صیانت از میراث باستانی پاسارگاد، شوش و محیط زیست سرزمین فرهنگی ایران',
      fr: 'Appel à l’UNESCO pour la sauvegarde du patrimoine archéologique et écologique d’Iran',
      en: 'Appeal to UNESCO for the Protection of Iran’s Archaeological and Ecological Heritage',
    },
    summary: {
      fa: 'هشدار مستند پیرامون خطرات زیست‌محیطی، خشکیدن تالاب‌ها و لزوم حفاظت بین‌المللی از محوطه‌های تاریخی ثبت‌شده در میراث جهانی.',
      fr: 'Alerte documentée sur la préservation des sites historiques et des ressources hydriques.',
      en: 'Documented alert on preserving World Heritage sites and critical water resources in Iran.',
    },
  },
];

