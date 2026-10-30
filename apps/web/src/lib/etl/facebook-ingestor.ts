import { countWords, normalizePersianText } from './persian-normalizer';
import type {
  RawFacebookPost,
  EnrichedMigrationArticle,
  MigrationQueueStats,
} from './types';
import { enrichArticle } from './enrichment-pipeline';

/**
 * Calculates Jaccard similarity between two word token sets.
 */
export function calculateJaccardSimilarity(textA: string, textB: string): number {
  const tokensA = new Set(textA.toLowerCase().split(/\s+/).filter(Boolean));
  const tokensB = new Set(textB.toLowerCase().split(/\s+/).filter(Boolean));

  if (tokensA.size === 0 && tokensB.size === 0) return 1.0;
  if (tokensA.size === 0 || tokensB.size === 0) return 0.0;

  const intersection = new Set([...tokensA].filter((x) => tokensB.has(x)));
  const union = new Set([...tokensA, ...tokensB]);

  return intersection.size / union.size;
}

/**
 * Normalizes thread titles by removing serial markers like (بخش نخست), (قسمت دوم), etc.
 */
export function extractBaseThreadTitle(title: string): { baseTitle: string; partNumber: number | null } {
  const normalized = title.trim();

  const part1Regex = /[\(\[\{]?(?:بخش|قسمت)\s*(?:نخست|اول|۱|1)[\)\]\}]?/i;
  const part2Regex = /[\(\[\{]?(?:بخش|قسمت)\s*(?:دوم|۲|2)(?:\s*و\s*پایانی)?[\)\]\}]?/i;
  const part3Regex = /[\(\[\{]?(?:بخش|قسمت)\s*(?:سوم|۳|3)[\)\]\}]?/i;

  if (part1Regex.test(normalized)) {
    return {
      baseTitle: normalized.replace(part1Regex, '').trim().replace(/^[-–—:\s]+|[-–—:\s]+$/g, ''),
      partNumber: 1,
    };
  }

  if (part2Regex.test(normalized)) {
    return {
      baseTitle: normalized.replace(part2Regex, '').trim().replace(/^[-–—:\s]+|[-–—:\s]+$/g, ''),
      partNumber: 2,
    };
  }

  if (part3Regex.test(normalized)) {
    return {
      baseTitle: normalized.replace(part3Regex, '').trim().replace(/^[-–—:\s]+|[-–—:\s]+$/g, ''),
      partNumber: 3,
    };
  }

  return { baseTitle: normalized, partNumber: null };
}

/**
 * Realistic Pre-Seeded Facebook Archive of Dr. Hassan Makaremi
 */
export const PRE_SEEDED_FACEBOOK_POSTS: RawFacebookPost[] = [
  // 1. Thread Part 1: Lacanian psychoanalysis article (part 1 of 2)
  {
    id: 'fb_post_makaremi_101',
    timestamp: 1675200000, // 2023-02-01
    title: 'روان‌کاوی و بحران سوژه معاصر (بخش نخست)',
    post: `در جهان معاصر، سوژه با تزلزل در دال‌های بنیادین و گسست در پیوند با نظم نمادین مواجه است. ژاک لکان با بازگشت به زیگموند فروید بر این نکته تأکید ورزید که ناخودآگاه همچون یک زبان ساختاربندی شده است.

در روانکاوی بالینی، مفهوم استعاره پدری و عملیات نام پدر نقشی حیاتی در عبور سوژه از خیال‌بافی آغازین ایفا میکند. بدون کارکرد این دال، ساختار روانی به سمت آسیبشناسی ازهمگسستگی میل می‌نماید. پژوهشها نشان میدهند که بازخوانی تحلیلی نشانه‌ها در فضای گفتاری، امکان استقرار دوباره سوژه را فراهم می‌سازد. ما در کلینیک روان‌کاوی پاریس همواره بر اهمیت گوش فرادادن به طنین ناگفته‌ها تأکید ورزیده‌ایم. ادامه دارد...`,
  },

  // 2. Thread Part 2: Lacanian psychoanalysis article (part 2 of 2)
  {
    id: 'fb_post_makaremi_102',
    timestamp: 1675286400, // 2023-02-02 (within 24 hours of part 1)
    title: 'روان‌کاوی و بحران سوژه معاصر (بخش دوم و پایانی)',
    post: `در ادامه یادداشت پیشین، روش دگرشنیدن به عنوان افق بالینی بنیادین مطرح میگردد. دگرشنیدن بدین معناست که تحلیل‌گر نه تنها به لایه‌های ظاهری واژه‌ها، بلکه به شکاف‌ها، لغزش‌های زبانی و سکوت‌های بیمار توجه کند.

روانپریشی‌ها زمانی مجال ظهور می‌یابند که حلقه نام پدر از زنجیره نمادین گسسته شود. در چنین بزنگاهی، روانکاوی رسالتی رهایی‌بخش دارد تا صدای فروخورده را به ساحت زبان بازگرداند. این فرآیند بالینی در سمینارهای متوالی و نگارش مقالات تخصصی پیگیری شده است. پایان.`,
  },

  // 3. Cultural Strategy & Human Rights Note
  {
    id: 'fb_post_makaremi_103',
    timestamp: 1680000000, // 2023-03-28
    title: 'سرزمین فرهنگی ایران، دادخواهی و بازسازی پیوندهای مدنی',
    post: `سرزمین فرهنگی ایران واقعیتی تاریخی و فرامرزی است که هویت آن بر مدار مدارا، زبان پارسی و هم‌زیستی فرهنگ‌ها استوار گردیده است. آسیب‌های ساختاری استبداد و ترومای جمعی ناشی از سرکوب، جامعه ما را با فقدان فضای گفت‌وگوی ملی روبه‌رو ساخته است.

دادخواهی و گرامیداشت یاد خاوران و قربانیان کشتار ۶۷، انتقام‌جویی نیست بلکه گامی اساسی در راستای التیام زخم‌های تاریخی و سوگ سیاسی است. بدون روشن شدن حقیقت و عدالت انتقالی، هیچ گذار پایداری به سوی دموکراسی و جمهوری سکولار میسر نخواهد بود. جامعه مدنی باید بر حفظ کرامت انسانی و منشور جهانی حقوق بشر پای بفشارد.`,
  },

  // 4. Duplicate Post of Post 3 (Demonstrating Semantic Deduplication)
  {
    id: 'fb_post_makaremi_104',
    timestamp: 1680003600, // 1 hour after post 103
    title: 'سرزمین فرهنگی ایران، دادخواهی و بازسازی پیوندهای مدنی',
    post: `دوستان گرامی، متن کامل یادداشت امروز:
سرزمین فرهنگی ایران واقعیتی تاریخی و فرامرزی است که هویت آن بر مدار مدارا، زبان پارسی و هم‌زیستی فرهنگ‌ها استوار گردیده است. آسیب‌های ساختاری استبداد و ترومای جمعی ناشی از سرکوب، جامعه ما را با فقدان فضای گفت‌وگوی ملی روبه‌رو ساخته است.

دادخواهی و گرامیداشت یاد خاوران و قربانیان کشتار ۶۷، انتقام‌جویی نیست بلکه گامی اساسی در راستای التیام زخم‌های تاریخی و سوگ سیاسی است. بدون روشن شدن حقیقت و عدالت انتقالی، هیچ گذار پایداری به سوی دموکراسی و جمهوری سکولار میسر نخواهد بود. جامعه مدنی باید بر حفظ کرامت انسانی و منشور جهانی حقوق بشر پای بفشارد.`,
  },

  // 5. Short Micro-Post (< 80 words) to demonstrate automatic filtering
  {
    id: 'fb_post_makaremi_105',
    timestamp: 1685000000,
    title: 'نوروز پیروز',
    post: `فرارسیدن بهار طبیعت و نوروز باستانی را به تمامی هم‌میهنان در سراسر گیتی شادباش می‌گویم. با آرزوی آزادی و روزهای روشن برای ایران عزیز.`,
  },
];

/**
 * Facebook Archive Ingestion and Processing Pipeline
 */
export async function processFacebookArchive(
  rawPosts: RawFacebookPost[] = PRE_SEEDED_FACEBOOK_POSTS
): Promise<{
  stats: MigrationQueueStats;
  articles: EnrichedMigrationArticle[];
  filteredMicroPosts: Array<{ id: string; title?: string; wordCount: number }>;
  deduplicatedPosts: Array<{ id: string; duplicateOf: string }>;
}> {
  const filteredMicroPosts: Array<{ id: string; title?: string; wordCount: number }> = [];
  const deduplicatedPosts: Array<{ id: string; duplicateOf: string }> = [];
  const validPosts: RawFacebookPost[] = [];

  // Step 1: Filter out micro-posts (< 80 words)
  for (const p of rawPosts) {
    const rawContent = (p.post || '') + ' ' + (p.title || '');
    const wc = countWords(rawContent);

    if (wc < 80) {
      filteredMicroPosts.push({ id: p.id, title: p.title, wordCount: wc });
    } else {
      validPosts.push(p);
    }
  }

  // Step 2: Thread Merging (combine multi-part serialized posts)
  const threadMap = new Map<string, { part1?: RawFacebookPost; part2?: RawFacebookPost; others: RawFacebookPost[] }>();
  const standalonePosts: RawFacebookPost[] = [];

  for (const post of validPosts) {
    const title = post.title || '';
    const { baseTitle, partNumber } = extractBaseThreadTitle(title);

    if (partNumber !== null && baseTitle.length > 5) {
      const existing = threadMap.get(baseTitle) || { others: [] };
      if (partNumber === 1) existing.part1 = post;
      else if (partNumber === 2) existing.part2 = post;
      else existing.others.push(post);
      threadMap.set(baseTitle, existing);
    } else {
      standalonePosts.push(post);
    }
  }

  const postsToDeduplicate: Array<{ post: RawFacebookPost; isMerged: boolean; partCount?: number }> = [];

  // Process threads: Merge Part 1 and Part 2 if both present
  let threadsMergedCount = 0;
  for (const [baseTitle, parts] of threadMap.entries()) {
    if (parts.part1 && parts.part2) {
      threadsMergedCount++;
      const mergedContent = `${parts.part1.post || ''}\n\n---\n\n${parts.part2.post || ''}`;
      const mergedPost: RawFacebookPost = {
        id: `merged_${parts.part1.id}_${parts.part2.id}`,
        timestamp: parts.part1.timestamp,
        title: baseTitle,
        post: mergedContent,
      };
      postsToDeduplicate.push({ post: mergedPost, isMerged: true, partCount: 2 });
    } else {
      if (parts.part1) postsToDeduplicate.push({ post: parts.part1, isMerged: false });
      if (parts.part2) postsToDeduplicate.push({ post: parts.part2, isMerged: false });
      parts.others.forEach((p) => postsToDeduplicate.push({ post: p, isMerged: false }));
    }
  }

  // Add standalones
  standalonePosts.forEach((p) => postsToDeduplicate.push({ post: p, isMerged: false }));

  // Step 3: Semantic Deduplication (Jaccard similarity > 0.80)
  const uniquePosts: Array<{ post: RawFacebookPost; isMerged: boolean; partCount?: number }> = [];

  for (const candidate of postsToDeduplicate) {
    const candidateBody = normalizePersianText(candidate.post.post || '');
    let isDuplicate = false;

    for (const existing of uniquePosts) {
      const existingBody = normalizePersianText(existing.post.post || '');
      const similarity = calculateJaccardSimilarity(candidateBody, existingBody);

      if (similarity >= 0.75) {
        isDuplicate = true;
        deduplicatedPosts.push({ id: candidate.post.id, duplicateOf: existing.post.id });
        break;
      }
    }

    if (!isDuplicate) {
      uniquePosts.push(candidate);
    }
  }

  // Step 4: Enrich surviving posts with Lacanian taxonomy, 4 pillars, Ed25519 signatures
  const articles: EnrichedMigrationArticle[] = [];
  const pillarBreakdown = {
    psychoanalysis: 0,
    art_calligraphy: 0,
    cultural_strategy: 0,
    human_rights_dadkhahi: 0,
  };

  for (const item of uniquePosts) {
    const enriched = await enrichArticle({
      source: 'facebook',
      sourceId: item.post.id,
      timestamp: item.post.timestamp,
      rawTitle: item.post.title || 'یادداشت پژوهشی فیس‌بوک',
      rawContent: item.post.post || '',
      isMergedThread: item.isMerged,
      mergedPartCount: item.partCount,
    });

    articles.push(enriched);
    pillarBreakdown[enriched.pillar]++;
  }

  const stats: MigrationQueueStats = {
    total_raw_processed: rawPosts.length,
    filtered_micro_posts: filteredMicroPosts.length,
    threads_merged: threadsMergedCount,
    duplicates_eliminated: deduplicatedPosts.length,
    ready_for_review_count: articles.length,
    pillar_breakdown: pillarBreakdown,
  };

  return { stats, articles, filteredMicroPosts, deduplicatedPosts };
}
