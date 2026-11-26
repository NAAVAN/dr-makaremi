import type { AiClinicalBoundaryPolicy, Locale } from '@makaremi/shared';
import { detectPromptInjection } from '@/lib/etl/enrichment-pipeline';

export interface QuerySafetyAssessment {
  allowed: boolean;
  isPromptInjection: boolean;
  injectionPattern?: string;
  isPersonalCrisis: boolean;
  needsClinicalDisclaimer: boolean;
  crisisResponse?: string;
  clinicalDisclaimer?: string;
}

const DEFAULT_CLINICAL_POLICY: AiClinicalBoundaryPolicy = {
  enableCrisisDetection: true,
  blockMedicalDiagnosis: true,
  appendDisclaimerOnClinicalQueries: true,
  helplineFrance: '3114 (Numéro national de prévention du suicide — 24h/24, 7j/7, gratuit) · Urgences : 15 / 112',
  helplineIran: '۱۴۸۰ (صدای مشاور بهزیستی) · ۱۲۳ (اورژانس اجتماعی) · ۱۱۵ (اورژانس پزشکی)',
  helplineInternationalUrl: 'https://findahelpline.com',
};

// Academic framing cues: a researcher asking about Dr. Makaremi's lecture on suicide
const ACADEMIC_FRAMING_RE =
  /(?:دکتر\s*مکارمی|سخنرانی|مقاله|کتاب|نظریه|دیدگاه|لکان|فروید|آرشیو|نگاهی\s+دیگر\s+بر\s+خودکشی|conférence|article|selon\s+le\s+dr|dr\s+makaremi|theory|lecture|research|psychoanalytic\s+view)/i;

// First-person acute self-harm / crisis indicators (FA / FR / EN)
const PERSONAL_CRISIS_PATTERNS: RegExp[] = [
  /(?:می[\u200c\s]?خواهم|می[\u200c\s]?خوام|تصمیم\s+دارم|قصد\s+دارم|دارم)\s+(?:خودکشی\s+کنم|خودم\s+را\s+بکشم|به\s+زندگی[\u200c\s]?ام\s+پایان\s+دهم|به\s+زندگی\s+خودم\s+پایان\s+دهم)/i,
  /(?:دیگر\s+نمی[\u200c\s]?خواهم\s+زنده\s+بمانم|نمی[\u200c\s]?خوام\s+زنده\s+بمونم|چطور\s+خودکشی\s+کنم|روش\s+خودکشی)/i,
  /(?:je\s+veux\s+(?:me\s+suicider|mourir|en\s+finir|mettre\s+fin\s+à\s+mes\s+jours)|comment\s+me\s+suicider|idées\s+suicidaires\s+maintenant)/i,
  /(?:i\s+want\s+to\s+(?:kill\s+myself|end\s+my\s+life|commit\s+suicide|die\s+right\s+now)|how\s+to\s+commit\s+suicide|i\s+am\s+going\s+to\s+kill\s+myself)/i,
];

// Personal clinical diagnosis / medication / psychotherapy solicitation
const CLINICAL_ADVICE_PATTERNS: RegExp[] = [
  /(?:برای\s+(?:من|افسردگی\s+من|اضطراب\s+من)\s+(?:دارو|قرص|نسخه|درمان)\s+(?:تجویز|بنویس|معرفی)|تشخیص\s+بده\s+من\s+چه\s+بیماری|من\s+را\s+درمان\s+کن)/i,
  /(?:diagnostique(?:-moi|\s+moi)|prescri(?:s|re)\s+(?:un\s+médicament|des\s+antidépresseurs)|fais-moi\s+une\s+thérapie)/i,
  /(?:diagnose\s+me|prescribe\s+(?:me|medication)|be\s+my\s+therapist|treat\s+my\s+(?:depression|psychosis|anxiety))/i,
];

export function buildCrisisResponse(
  locale: Locale,
  policy: AiClinicalBoundaryPolicy = DEFAULT_CLINICAL_POLICY
): string {
  if (locale === 'fr') {
    return [
      'Si vous traversez en ce moment une détresse psychique intense ou des pensées suicidaires, vous n’êtes pas seul(e) et une aide immédiate, gratuite et confidentielle est disponible :',
      '',
      `- **France :** ${policy.helplineFrance}`,
      `- **Iran :** ${policy.helplineIran}`,
      `- **International :** ${policy.helplineInternationalUrl}`,
      '',
      'Cet espace est un assistant d’archive académique dédié aux écrits et conférences du Dr Hassan Makaremi et ne peut en aucun cas remplacer une prise en charge clinique ou d’urgence. Veuillez contacter dès maintenant un service d’écoute ou un professionnel de santé.',
    ].join('\n');
  }
  if (locale === 'en') {
    return [
      'If you are experiencing acute distress or thoughts of self-harm right now, you are not alone and immediate, free, confidential support is available:',
      '',
      `- **France / Europe:** ${policy.helplineFrance}`,
      `- **Iran:** ${policy.helplineIran}`,
      `- **Worldwide directory:** ${policy.helplineInternationalUrl}`,
      '',
      'This platform is an academic archival research assistant for Dr. Hassan Makaremi’s published works and cannot provide clinical therapy or emergency crisis intervention. Please reach out to a crisis helpline or healthcare professional immediately.',
    ].join('\n');
  }
  return [
    'اگر در این لحظه در رنج شدید روانی هستید یا به آسیب‌زدن به خود می‌اندیشید، شما تنها نیستید و کمک فوری، محرمانه و تخصصی در دسترس است:',
    '',
    `- **ایران:** ${policy.helplineIran}`,
    `- **فرانسه و اروپا:** ${policy.helplineFrance}`,
    `- **فهرست خطوط کمک‌رسانی بین‌المللی:** ${policy.helplineInternationalUrl}`,
    '',
    'این سامانه صرفاً «دستیار پژوهشی آرشیو آثار دکتر حسن مکارمی» است و جایگزین روان‌درمانی، تشخیص پزشکی یا مداخلهٔ اورژانس بحران نیست. خواهشمندیم هم‌اکنون با یکی از خطوط کمک‌رسانی بالا یا نزدیک‌ترین مرکز درمانی تماس بگیرید.',
  ].join('\n');
}

export function buildClinicalBoundaryDisclaimer(locale: Locale): string {
  if (locale === 'fr') {
    return 'Note déontologique : Cet assistant restitue uniquement les textes et conférences publiés du Dr Hassan Makaremi à des fins de recherche et ne constitue ni un diagnostic médical ni une psychothérapie personnalisée.';
  }
  if (locale === 'en') {
    return 'Clinical ethics notice: This research assistant draws exclusively on Dr. Hassan Makaremi’s published archival works and does not provide personal medical diagnosis, prescriptions, or clinical psychotherapy.';
  }
  return 'یادآوری اخلاق بالینی: این دستیار صرفاً بر پایهٔ آثار و سخنرانی‌های منتشرشدهٔ دکتر حسن مکارمی پاسخ پژوهشی ارائه می‌دهد و جایگزین تشخیص پزشکی، تجویز دارو یا جلسهٔ روان‌کاوی و روان‌درمانی فردی نیست.';
}

export function assessQuerySafety(
  query: string,
  locale: Locale,
  policy: AiClinicalBoundaryPolicy = DEFAULT_CLINICAL_POLICY
): QuerySafetyAssessment {
  const injection = detectPromptInjection(query);
  if (injection.isInjection) {
    return {
      allowed: false,
      isPromptInjection: true,
      injectionPattern: injection.pattern,
      isPersonalCrisis: false,
      needsClinicalDisclaimer: false,
    };
  }

  const trimmed = (query || '').trim();
  const hasAcademicCue = ACADEMIC_FRAMING_RE.test(trimmed);

  if (policy.enableCrisisDetection) {
    const matchesPersonalCrisis = PERSONAL_CRISIS_PATTERNS.some((re) => re.test(trimmed));
    if (matchesPersonalCrisis && !hasAcademicCue) {
      return {
        allowed: true,
        isPromptInjection: false,
        isPersonalCrisis: true,
        needsClinicalDisclaimer: true,
        crisisResponse: buildCrisisResponse(locale, policy),
      };
    }
  }

  const asksPersonalClinicalAdvice =
    policy.blockMedicalDiagnosis && CLINICAL_ADVICE_PATTERNS.some((re) => re.test(trimmed));

  return {
    allowed: true,
    isPromptInjection: false,
    isPersonalCrisis: false,
    needsClinicalDisclaimer: Boolean(asksPersonalClinicalAdvice),
    clinicalDisclaimer: asksPersonalClinicalAdvice ? buildClinicalBoundaryDisclaimer(locale) : undefined,
  };
}

/**
 * CNIL / RGPD Privacy Hygiene: strips accidental emails, phone numbers, and IBANs
 * before storing anonymized query telemetry for knowledge-gap analysis.
 */
export function sanitizePiiFromQuery(rawQuery: string): string {
  return (rawQuery || '')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email-redacted]')
    .replace(/\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g, '[iban-redacted]')
    .replace(/(?:\+?\d[\d\s\-().]{8,18}\d)/g, '[phone-redacted]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 400);
}

// Strict White-Label Vendor/Model Leak Guard
const VENDOR_LEAK_PATTERNS: RegExp[] = [
  /\b(?:Anthropic|Claude(?:\s+(?:Opus|Sonnet|Haiku|\d[\d.]*))?)\b/gi,
  /\b(?:OpenAI|ChatGPT|GPT-[345o][\w.-]*)\b/gi,
  /\b(?:Groq|Llama[\s-]?\d[\w.-]*|Mixtral|DeepSeek|Mistral\s+AI)\b/gi,
  /\b(?:Google\s+Gemini|Gemini\s+\d[\w.-]*)\b/gi,
  /(?:ساخته\s+شده\s+توسط\s+(?:آنتروپیک|اوپن[\u200c\s]?ای[\u200c\s]?آی|گوگل|گراک)|مدل\s+(?:کلود|چت[\u200c\s]?جی[\u200c\s]?پی[\u200c\s]?تی|لاما|جمینای))/gi,
];

export function countWhiteLabelLeaks(text: string): number {
  if (!text) return 0;
  let hits = 0;
  for (const re of VENDOR_LEAK_PATTERNS) {
    re.lastIndex = 0;
    const m = text.match(re);
    if (m) hits += m.length;
  }
  return hits;
}

export function stripVendorBrandLeaks(text: string, locale: Locale): string {
  if (!text) return '';
  const replacement =
    locale === 'fa'
      ? 'دستیار پژوهشی رسمی آرشیو دکتر مکارمی'
      : locale === 'fr'
        ? "l'assistant de recherche officiel des archives du Dr Makaremi"
        : "Dr. Makaremi's official archival research assistant";

  let out = text;
  for (const re of VENDOR_LEAK_PATTERNS) {
    re.lastIndex = 0;
    out = out.replace(re, replacement);
  }
  return out;
}
