/**
 * Persian Typography and ZWNJ (Zero-Width Non-Joiner) Normalization Engine
 * Refinement 1: Complete protection of URLs, emails, Markdown links, and SHA-256 digests.
 */

export interface NormalizationOptions {
  preserveEnglishDigits?: boolean;
  normalizeQuotes?: boolean;
  enforceZwnj?: boolean;
}

/**
 * Extracts and protects technical tokens (URLs, emails, Markdown links, SHA-256 digests)
 * before Persian text transformation, returning the protected text and token registry.
 */
function protectTechnicalTokens(text: string): { protectedText: string; tokens: string[] } {
  const tokens: string[] = [];
  let tokenCounter = 0;

  // 1. Protect Markdown Links: [anchor text](https://url...)
  let protectedText = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_match) => {
    const placeholder = `___TECH_TOKEN_${tokenCounter++}___`;
    tokens.push(_match);
    return placeholder;
  });

  // 2. Protect Raw URLs: https://... or http://...
  protectedText = protectedText.replace(/https?:\/\/[^\s)\]>"'`]+/g, (_match) => {
    const placeholder = `___TECH_TOKEN_${tokenCounter++}___`;
    tokens.push(_match);
    return placeholder;
  });

  // 3. Protect Emails
  protectedText = protectedText.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, (_match) => {
    const placeholder = `___TECH_TOKEN_${tokenCounter++}___`;
    tokens.push(_match);
    return placeholder;
  });

  // 4. Protect SHA-256 Hex Hashes (64 hexadecimal characters)
  protectedText = protectedText.replace(/\b[a-fA-F0-9]{64}\b/g, (_match) => {
    const placeholder = `___TECH_TOKEN_${tokenCounter++}___`;
    tokens.push(_match);
    return placeholder;
  });

  return { protectedText, tokens };
}

/**
 * Restores original technical tokens from the token registry.
 */
function restoreTechnicalTokens(text: string, tokens: string[]): string {
  let restored = text;
  tokens.forEach((token, index) => {
    const placeholder = `___TECH_TOKEN_${index}___`;
    restored = restored.replace(placeholder, token);
  });
  return restored;
}

/**
 * Normalizes Persian characters and applies morphological ZWNJ rules.
 */
export function normalizePersianText(
  rawText: string,
  options: NormalizationOptions = {}
): string {
  if (!rawText) return '';

  const {
    normalizeQuotes = true,
    enforceZwnj = true,
  } = options;

  // Step 1: Protect technical tokens
  const { protectedText, tokens } = protectTechnicalTokens(rawText);
  let text = protectedText;

  // Step 2: Replace Arabic-specific characters with standard Persian equivalents
  text = text
    .replace(/[\u064A\u0649]/g, 'ی') // Arabic Yeh / Alef Maksura -> Persian Yeh (\u06CC)
    .replace(/\u0643/g, 'ک') // Arabic Kaf -> Persian Keheh (\u06A9)
    .replace(/\u06C0/g, 'هٔ') // Heh with Yeh above
    .replace(/\u0629/g, 'ه'); // Teh Marbuta -> Heh

  // Standardize Persian question and comma marks
  text = text
    .replace(/;/g, '؛')
    .replace(/\?/g, '؟')
    .replace(/,/g, '،');

  // Step 3: Morphological and Semantic ZWNJ Rules (\u200c)
  if (enforceZwnj) {
    const ZWNJ = '\u200c';

    // A. Specific Dr. Hassan Makaremi Clinical & Theoretical Terminology
    text = text
      .replace(/روان[\s\u200c]*کاوی/g, `روان${ZWNJ}کاوی`)
      .replace(/روان[\s\u200c]*پریشی(‌ها|ها)?/g, `روان${ZWNJ}پریشی$1`)
      .replace(/روان[\s\u200c]*نژندی(‌ها|ها)?/g, `روان${ZWNJ}نژندی$1`)
      .replace(/آسیب[\s\u200c]*شناسی/g, `آسیب${ZWNJ}شناسی`)
      .replace(/از\s*هم[\s\u200c]*گسستگی/g, `ازهم${ZWNJ}گسستگی`)
      .replace(/دگر[\s\u200c]+شنیدن/g, 'دگرشنیدن')
      .replace(/نام[\s\u200c]*پدر/g, `نام${ZWNJ}پدر`)
      .replace(/گذشته[\s\u200c]*باور/g, `گذشته${ZWNJ}باور`)
      .replace(/مطلوب[\s\u200c]*گرا/g, `مطلوب${ZWNJ}گرا`);

    // B. Prefix ZWNJ rules: می‌ and نمی‌ followed by verbs
    // 1. Separated: "می شود" -> "می‌شود", "نمی تواند" -> "نمی‌تواند"
    text = text.replace(
      /(?<=^|[\s\(\[\{«"'\n])(ن?می)\s+([^\s\d.،؛:!؟«»\n]+)/g,
      `$1${ZWNJ}$2`
    );

    // 2. Stuck without space: "میشود", "نمیتواند", "میگردد", etc.
    text = text.replace(
      /(?<=^|[\s\(\[\{«"'\n])(ن?می)(شود|تواند|توانست|توانند|گردد|گردند|رود|روند|آید|آیند|کند|کنند|خواند|خوانند|داند|دانند|گوید|گویند|بیند|بینند|گیرد|گیرند|یابد|یابند|پندارد|پندارند|آورد|آورند|رسد|رسند|خواست|خواهم|خواهی|خواهد|خواهیم|خواهید|خواهند)(?=[\s\d.،؛:!؟«»\n]|$)/g,
      `$1${ZWNJ}$2`
    );

    // C. Suffix ZWNJ rules: ها and های (plural nouns)
    // 1. Separated: "پژوهش ها" -> "پژوهش‌ها", "یافته های" -> "یافته‌های"
    text = text.replace(
      /([^\s\d.،؛:!؟«»\n]+)\s+(های?)(?=[\s\d.،؛:!؟«»\n]|$)/g,
      `$1${ZWNJ}$2`
    );

    // 2. Stuck: "پژوهشها" -> "پژوهش‌ها"
    text = text.replace(
      /(?<=^|[\s\(\[\{«"'\n])(پژوهش|یافته|کتاب|اثر|متن|آرشیو|مفهوم|دال|روانکاوی|تحلیل|پست|عکس|نامه|خوانش|پرسش|نشانه|ساختار)ها(?=[\s\d.،؛:!؟«»\n]|$)/g,
      `$1${ZWNJ}ها`
    );

    // D. Suffix ZWNJ rules: تر and ترین (comparative adjectives)
    // 1. Separated: "عمیق تر" -> "عمیق‌تر"
    text = text.replace(
      /([^\s\d.،؛:!؟«»\n]+)\s+(ترین?)(?=[\s\d.،؛:!؟«»\n]|$)/g,
      `$1${ZWNJ}$2`
    );

    // 2. Stuck: "عمیقتر" -> "عمیق‌تر"
    text = text.replace(
      /(?<=^|[\s\(\[\{«"'\n])(عمیق|بنیادین|بزرگ|مهم|دقیق|روشن|تاریک|کوچک|بالا|پایین)تر(ین)?(?=[\s\d.،؛:!؟«»\n]|$)/g,
      `$1${ZWNJ}تر$2`
    );

    // E. Possessive pronouns attached to words ending in Heh
    // "خانه ام" -> "خانه‌ام", "جامعه مان" -> "جامعه‌مان"
    text = text.replace(
      /([هة])\s+(ام|ات|اش|مان|تان|شان)\b/g,
      `$1${ZWNJ}$2`
    );
  }

  // Step 4: Persian Guillemets «...»
  if (normalizeQuotes) {
    // Convert Latin quotes "text" to «text»
    text = text.replace(/"([^"\n]+)"/g, '«$1»');
    // Convert English curved quotes “text” to «text»
    text = text.replace(/[“”]([^“”\n]+)[“”]/g, '«$1»');
  }

  // Step 5: Typography spacing around punctuation
  // Remove space before punctuation marks: . ، ؛ ! ؟ :
  text = text.replace(/\s+([.،؛!؟:])/g, '$1');
  // Ensure exactly one space after punctuation marks if followed by a character (excluding newlines and digits)
  text = text.replace(/([.،؛!؟:])([^\s\n.،؛!؟:0-9\d«»])/g, '$1 $2');

  // Collapse multiple horizontal spaces into a single space (preserve newlines)
  text = text.replace(/[^\S\r\n]+/g, ' ');

  // Clean trailing spaces on lines
  text = text.split('\n').map((line) => line.trim()).join('\n');

  // Step 6: Restore technical tokens untouched
  const finalResult = restoreTechnicalTokens(text, tokens);

  return finalResult;
}

/**
 * Calculates word count for Persian and multilingual texts.
 */
export function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}
