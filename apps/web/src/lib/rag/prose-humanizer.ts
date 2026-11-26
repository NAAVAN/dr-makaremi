import type { Locale } from '@makaremi/shared';
import { normalizePersianText } from '@/lib/etl/persian-normalizer';

export interface HumanizeProseResult {
  text: string;
  tellsRemovedCount: number;
  removedPatterns: string[];
}

export interface DetectedAiTell {
  patternId: string;
  label: string;
  excerpt: string;
}

/**
 * Distilled Trilingual Humanizer v4.0 Directive (adapted from Wikipedia "Signs of AI writing" / MIT Humanizer)
 * Injected upstream into RAG synthesis prompts so responses sound like a refined Paris/Sorbonne
 * psychoanalyst & Persian literary scholar from the very first streamed token.
 */
export function buildHumanizerPromptDirective(locale: Locale): string {
  if (locale === 'fr') {
    return [
      'STYLE ÉDITORIAL HUMAIN (Humanizer académique) :',
      '- Allez droit au sujet dès la première phrase : aucun préambule de chatbot (« Excellente question », « Bien sûr », « Voici une analyse », « Plongeons dans ») ni formule de clôture (« J’espère que cela vous aide », « N’hésitez pas »).',
      '- Bannissez les tics artificiels : contrastes dramatiques « ce n’est pas seulement X, c’est Y », phrases-chutes théâtrales d’une ligne, énumérations forcées par trois, surabondance de tirets cadratins (—) et mots-valises (« kaléidoscope », « tapisserie », « témoigne de manière cruciale »).',
      '- Privilégiez une prose fluide, sobre et précise de psychanalyste parisien plutôt que des listes à puces décorées de libellés en gras ou d’émojis. Gardez les citations entre guillemets (« ... ») et les renvois [1], [2] rigoureusement exacts.',
    ].join('\n');
  }
  if (locale === 'en') {
    return [
      'HUMAN SCHOLARLY PROSE (Humanizer v4):',
      '- Begin directly with the answer: zero chatbot openers ("Great question!", "Certainly!", "Let\'s dive in", "Here is an overview") and zero sign-offs ("I hope this helps", "Let me know if you\'d like...").',
      '- Eliminate AI writing tells: avoid "not just X, but Y" staging, dramatic one-line closers, forced rule-of-three lists, em-dash crutches (—), bold-label bullet spam, decorative emojis, and inflated buzzwords (delve, tapestry, testament, pivotal, robust, vibrant, showcase, underscores the importance).',
      '- Write in calm, direct, varied British/UNESCO academic paragraphs that match Dr. Makaremi\'s scholarly register while keeping verbatim quotations and inline [1], [2] citations untouched.',
    ].join('\n');
  }
  return [
    'اصول نثر طبیعی، انسانی و فرهیخته (Humanizer علمی):',
    '- مستقیم وارد پاسخ شوید؛ از مقدمه‌چینی‌های رباتیک («سؤال بسیار خوبی پرسیدید»، «با کمال میل»، «در دنیای امروز»، «بیایید به بررسی بپردازیم») و جملات پایانی چت‌باتی («امیدوارم مفید بوده باشد»، «اگر سؤال دیگری دارید بپرسید») کاملاً پرهیز کنید.',
    '- از کلیشه‌های نوشتار ماشینی دوری کنید: ساختارهای تکراری «نه تنها X بلکه Y»، جملات پایانی شعارگونه، سه‌تایی‌سازی اجباری، تکرار بی‌مورد خط تیرهٔ بلند (—)، ایموجی تزئینی، و پرگویی‌های اداری مانند «شایان ذکر است که»، «لازم به ذکر است که» یا «به‌طور خلاصه می‌توان گفت».',
    '- پاسخ را با پاراگراف‌های روان، دقیق و به‌دور از فهرست‌سازی‌های پُر از برچسب توپر (Bold) بنویسید تا لحن یک پژوهشگر و روان‌کاو فرهیخته را داشته باشد؛ نقل‌قول‌های داخل «...»، ارجاعات [1] و اصطلاحات لکانی استاد (دگرشنیدن، عملیات نام‌پدر، حالت مرزی) را عیناً حفظ کنید.',
  ].join('\n');
}

// -----------------------------------------------------------------------------
// Strict Quote, Citation, Link & Hash Masking (Zero Distortion of Archival Evidence)
// -----------------------------------------------------------------------------
interface MaskContext {
  masked: string;
  tokens: string[];
}

function maskProtectedSpans(raw: string): MaskContext {
  const tokens: string[] = [];
  const stash = (match: string) => {
    const idx = tokens.length;
    tokens.push(match);
    return `__MK_KEEP_${idx}__`;
  };

  let out = raw || '';
  // 1. Protect code blocks & inline code
  out = out.replace(/```[\s\S]*?```/g, stash);
  out = out.replace(/`[^`\n]+`/g, stash);
  // 2. Protect verbatim Persian/French guillemet quotes «...» (Dr. Makaremi's exact words!)
  out = out.replace(/«[^»\n]{2,1200}»/g, stash);
  // 3. Protect verbatim double-quoted passages "..."
  out = out.replace(/"[^"\n]{4,1200}"/g, stash);
  // 4. Protect Markdown links [label](url) & raw URLs
  out = out.replace(/\[[^\]]+\]\(https?:\/\/[^\s)]+\)/g, stash);
  out = out.replace(/https?:\/\/[^\s)»"']+/g, stash);
  // 5. Protect 64-char SHA-256 hex digests
  out = out.replace(/\b[a-f0-9]{64}\b/gi, stash);
  // 6. Protect inline citation anchors [1], [2]... and video timestamp badges (⏱ 12:34)
  out = out.replace(/\[\d{1,2}\]/g, stash);
  out = out.replace(/⏱\s*\d{1,2}:\d{2}(?::\d{2})?/g, stash);

  return { masked: out, tokens };
}

function unmaskProtectedSpans(text: string, tokens: string[]): string {
  return text.replace(/__MK_KEEP_(\d+)__/g, (_, idxStr) => {
    const idx = Number(idxStr);
    return tokens[idx] ?? '';
  });
}

// -----------------------------------------------------------------------------
// Trilingual AI-Tell Cleanup Rules (Humanizer v4 §3, §4, §8, §12, §13, §18, §20, §22)
// -----------------------------------------------------------------------------
interface ProseRule {
  id: string;
  label: string;
  locales: Locale[];
  pattern: RegExp;
  replacement: string | ((match: string, ...args: string[]) => string);
}

const PROSE_RULES: ProseRule[] = [
  // §22 Chatbot openers (FA / FR / EN)
  {
    id: 'chatbot_opener_fa',
    label: 'مقدمهٔ رباتیک چت‌بات',
    locales: ['fa'],
    pattern:
      /^(?:سلام[!،.\s]*|با\s+سلام[!،.\s]*)?(?:پرسش|سؤال|سوال)\s+(?:بسیار\s+)?(?:خوب|ارزشمند|جالب|مهم|دقیق)(?:ی)?\s+(?:مطرح\s+کردید|پرسیدید)[!.:،\s]*/i,
    replacement: '',
  },
  {
    id: 'staged_opener_fa',
    label: 'مقدمه‌چینی کلیشه‌ای',
    locales: ['fa'],
    pattern:
      /^(?:البته|حتماً|با\s+کمال\s+میل)[!،.\s]+(?:در\s+ادامه\s+به\s+بررسی\s+این\s+موضوع\s+می[\u200c\s]?پردازیم[.:،\s]*)?/i,
    replacement: '',
  },
  {
    id: 'chatbot_closer_fa',
    label: 'پایان‌بندی چت‌باتی',
    locales: ['fa'],
    pattern:
      /\n*(?:امیدوارم\s+این\s+(?:پاسخ|توضیحات?)\s+(?:برایتان\s+)?مفید\s+(?:واقع\s+شده\s+)?(?:بوده\s+)?باشد[.!؟\s]*|اگر\s+(?:سؤال|سوال|پرسش)\s+دیگری\s+دارید[^.\n]*[.!؟\s]*|در\s+صورت\s+تمایل\s+می[\u200c\s]?توانم\s+بیشتر\s+توضیح\s+دهم[.!؟\s]*)+$/i,
    replacement: '',
  },
  {
    id: 'chatbot_opener_fr',
    label: 'Préambule de chatbot',
    locales: ['fr'],
    pattern:
      /^(?:Excellente\s+question|Très\s+bonne\s+question|Bien\s+sûr|Certainement|Avec\s+plaisir)[!.,:\s]+(?:Voici\s+(?:une\s+)?(?:réponse|analyse|synthèse|présentation)[^:\n]*[:.]\s*)?/i,
    replacement: '',
  },
  {
    id: 'chatbot_closer_fr',
    label: 'Clôture de chatbot',
    locales: ['fr'],
    pattern:
      /\n*(?:J['’]espère\s+que\s+(?:cela|cette\s+réponse)\s+vous\s+(?:a\s+aidé|aide|sera\s+utile)[.!?\s]*|N['’]hésitez\s+pas\s+(?:à\s+me\s+demander|si\s+vous\s+avez\s+d['’]autres\s+questions)[^.\n]*[.!?\s]*)+$/i,
    replacement: '',
  },
  {
    id: 'chatbot_opener_en',
    label: 'Chatbot opener',
    locales: ['en'],
    pattern:
      /^(?:Great\s+question|That['’]s\s+a\s+great\s+question|Certainly|Of\s+course|Sure|Absolutely)[!.,:\s]+(?:(?:Let['’]s\s+(?:dive\s+into|explore|break\s+down)|Here\s+is\s+(?:a\s+comprehensive\s+|an?\s+)?(?:overview|summary|breakdown))[^:\n]*[:.]\s*)?/i,
    replacement: '',
  },
  {
    id: 'staged_runup_en',
    label: 'Staged run-up',
    locales: ['en'],
    pattern: /^(?:Let['’]s\s+(?:dive\s+into|explore|unpack)|Without\s+further\s+ado|Here['’]s\s+what\s+you\s+need\s+to\s+know)[,:.\s]+/i,
    replacement: '',
  },
  {
    id: 'chatbot_closer_en',
    label: 'Chatbot sign-off',
    locales: ['en'],
    pattern:
      /\n*(?:I\s+hope\s+this\s+helps[!.\s]*|Let\s+me\s+know\s+if\s+you(?:'d|\s+would)\s+like[^.\n]*[.!?\s]*|Feel\s+free\s+to\s+ask\s+if\s+you\s+have\s+(?:any\s+)?(?:more|other)\s+questions[^.\n]*[.!?\s]*)+$/i,
    replacement: '',
  },

  // §3 / §12 / §13 Filler & Inflated Buzzwords (FA)
  {
    id: 'filler_shayad_zekr_fa',
    label: 'عبارت کلیشه‌ای اداری (شایان/لازم به ذکر)',
    locales: ['fa'],
    pattern: /(?:شایان\s+ذکر\s+است\s+که|لازم\s+به\s+ذکر\s+است\s+که|گفتنی\s+است\s+که)\s+/g,
    replacement: '',
  },
  {
    id: 'filler_dar_donyaye_emrooz_fa',
    label: 'شروع کلیشه‌ای (در دنیای امروز)',
    locales: ['fa'],
    pattern: /(?:در\s+دنیای\s+امروز|در\s+عصر\s+حاضر)[،,\s]+/g,
    replacement: '',
  },
  {
    id: 'filler_summary_fa',
    label: 'کلیشهٔ نتیجه‌گیری ماشینی',
    locales: ['fa'],
    pattern: /(?:به‌طور\s+خلاصه\s+می[\u200c\s]?توان\s+گفت\s+که|در\s+نهایت\s+می[\u200c\s]?توان\s+نتیجه\s+گرفت\s+که)\s+/g,
    replacement: '',
  },

  // §3 / §12 / §13 Filler & Buzzwords (FR)
  {
    id: 'filler_convient_fr',
    label: 'Tournure artificielle (Il convient de souligner)',
    locales: ['fr'],
    pattern: /\b(?:Il\s+convient\s+de\s+souligner\s+que|Il\s+est\s+important\s+de\s+noter\s+que|Force\s+est\s+de\s+constater\s+que)\s+/gi,
    replacement: '',
  },
  {
    id: 'buzzword_fr',
    label: 'Métaphore IA convenue',
    locales: ['fr'],
    pattern: /\b(?:un\s+véritable\s+kaléidoscope|une\s+tapisserie\s+complexe)\s+de\b/gi,
    replacement: 'un ensemble de',
  },

  // §3 / §12 / §13 / §18 Stock AI words & puffery (EN)
  {
    id: 'filler_worth_noting_en',
    label: 'Empty throat-clearing phrase',
    locales: ['en'],
    pattern: /\b(?:It\s+is\s+worth\s+noting\s+that|It\s+is\s+important\s+to\s+note\s+that|At\s+its\s+core,\s+|In\s+today['’]s\s+world,\s+)\s*/gi,
    replacement: '',
  },
  {
    id: 'stock_delve_en',
    label: 'Overused AI verb (delve)',
    locales: ['en'],
    pattern: /\bdelves?\s+into\b/gi,
    replacement: (m) => (m.toLowerCase().startsWith('delves') ? 'examines' : 'examine'),
  },
  {
    id: 'stock_testament_en',
    label: 'Inflated significance (testament)',
    locales: ['en'],
    pattern: /\b(?:stands|serves)\s+as\s+a\s+(?:lasting\s+|enduring\s+)?testament\s+to\b/gi,
    replacement: 'reflects',
  },
  {
    id: 'stock_pivotal_en',
    label: 'Inflated significance (pivotal role)',
    locales: ['en'],
    pattern: /\bplays?\s+a\s+(?:pivotal|crucial|vital)\s+role\s+in\b/gi,
    replacement: (m) => (m.toLowerCase().startsWith('plays') ? 'shapes' : 'shape'),
  },
  {
    id: 'stock_underscores_en',
    label: 'Inflated verb (underscores importance)',
    locales: ['en'],
    pattern: /\bunderscores?\s+the\s+importance\s+of\b/gi,
    replacement: (m) => (m.toLowerCase().startsWith('underscores') ? 'shows the significance of' : 'show the significance of'),
  },

  // §20 Decorative Chatbot Emojis in Scholarly Answers (keeps ⏱ timestamp symbol safe via mask!)
  {
    id: 'decorative_emoji',
    label: 'ایموجی تزئینی در متن پژوهشی',
    locales: ['fa', 'fr', 'en'],
    pattern: /[🚀💡✨🔥🌟🎯📌🧠🤖🎉👏✅⚡📖📝]+/gu,
    replacement: '',
  },
];

/**
 * Detects AI writing tells in a text without modifying it (for Pishkhan inspection & QA).
 */
export function detectAiProseTells(rawText: string, locale: Locale): DetectedAiTell[] {
  const { masked } = maskProtectedSpans(rawText || '');
  const found: DetectedAiTell[] = [];

  for (const rule of PROSE_RULES) {
    if (!rule.locales.includes(locale)) continue;
    rule.pattern.lastIndex = 0;
    const match = masked.match(rule.pattern);
    if (match?.[0]) {
      found.push({
        patternId: rule.id,
        label: rule.label,
        excerpt: match[0].trim().slice(0, 80),
      });
    }
  }

  // §8 Em-dash overuse check (more than 2 em-dashes in short scholarly prose)
  const emDashes = masked.match(/\s[—–]\s|\s--\s/g);
  if (emDashes && emDashes.length > 2) {
    found.push({
      patternId: 'em_dash_overuse',
      label: locale === 'fa' ? 'تکرار بیش‌ازحد خط تیرهٔ بلند (—)' : 'Excessive em-dash connectors',
      excerpt: `${emDashes.length} occurrences`,
    });
  }

  return found;
}

/**
 * Quote-safe, zero-latency Humanizer v4 processor for AI Research Assistant outputs
 * and Pishkhan editorial drafts. Guarantees 100% preservation of verbatim quotations,
 * citation anchors [1]..[n], timestamps, SHA-256 hashes, URLs, and locked Lacanian terms.
 */
export function humanizeScholarlyProse(rawText: string, locale: Locale): HumanizeProseResult {
  if (!rawText || !rawText.trim()) {
    return { text: rawText || '', tellsRemovedCount: 0, removedPatterns: [] };
  }

  const { masked, tokens } = maskProtectedSpans(rawText);
  let out = masked;
  const removedPatterns: string[] = [];

  for (const rule of PROSE_RULES) {
    if (!rule.locales.includes(locale)) continue;
    rule.pattern.lastIndex = 0;
    if (rule.pattern.test(out)) {
      rule.pattern.lastIndex = 0;
      const before = out;
      out =
        typeof rule.replacement === 'function'
          ? out.replace(rule.pattern, rule.replacement)
          : out.replace(rule.pattern, rule.replacement);
      if (out !== before) {
        removedPatterns.push(rule.id);
      }
    }
  }

  // §8 Replace em-dash / double-hyphen overuse inside paragraphs (keep at most 1 per paragraph)
  const paragraphs = out.split(/\n{2,}/);
  let dashCleaned = false;
  const commaSep = locale === 'fa' ? '، ' : ', ';
  const cleanedParagraphs = paragraphs.map((p) => {
    // Keep horizontal rules `---` untouched
    if (/^\s*---+\s*$/.test(p)) return p;
    const matches = p.match(/\s[—–]\s|\s--\s/g);
    if (matches && matches.length >= 2) {
      dashCleaned = true;
      return p.replace(/\s(?:—|–|--)\s/g, commaSep);
    }
    return p;
  });
  if (dashCleaned) {
    out = cleanedParagraphs.join('\n\n');
    removedPatterns.push('em_dash_overuse');
  }

  // Capitalize first letter in FR/EN if an opener was stripped cleanly
  if ((locale === 'fr' || locale === 'en') && removedPatterns.length > 0) {
    out = out.replace(/^(\s*)([a-zàâçéèêëîïôûùüÿœ])/, (_, ws: string, ch: string) => `${ws}${ch.toUpperCase()}`);
  }

  // Normalize Persian typography & ZWNJ on non-masked prose spans (preserves «دگرشنیدن»)
  if (locale === 'fa') {
    out = normalizePersianText(out, {
      enforceZwnj: true,
      normalizeQuotes: false,
      preserveEnglishDigits: true,
    });
  }

  // Restore exact verbatim quotes, citations, links, timestamps, and hashes
  let restored = unmaskProtectedSpans(out, tokens);
  restored = restored
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return {
    text: restored,
    tellsRemovedCount: removedPatterns.length,
    removedPatterns,
  };
}
