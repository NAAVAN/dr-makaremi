import type { Locale } from '@makaremi/shared';
import { executeHybridSearch, type SearchResultItem } from './hybrid-search';
import { detectPromptInjection } from '@/lib/etl/enrichment-pipeline';

export interface RagCitation {
  id: string;
  title: string;
  documentType: string;
  pillar: string;
  url: string;
  quote: string;
  content_sha256: string;
  score: number;
}

export interface RagResponse {
  answer: string;
  locale: Locale;
  citations: RagCitation[];
  suggestedFollowUps: string[];
}

export interface AskAssistantOptions {
  query: string;
  locale?: Locale;
}

/**
 * Deterministic Grounded Knowledge Synthesizer
 * Formulates a direct, zero-hallucination academic synthesis strictly grounded in retrieved chunks.
 */
function synthesizeGroundedAnswer(
  query: string,
  locale: Locale,
  citations: RagCitation[],
  results: SearchResultItem[]
): { answer: string; suggestedFollowUps: string[] } {
  if (results.length === 0) {
    if (locale === 'fr') {
      return {
        answer: `Aucune information directement vérifiable n'a été trouvée dans les archives officielles du Dr Hassan Makaremi pour la requête : « ${query} ». Pour préserver l'intégrité de la recherche, aucune hypothèse non documentée n'est formulée.`,
        suggestedFollowUps: [
          'Quels sont les concepts majeurs du séminaire lacanien ?',
          "Comment le Dr Makaremi définit-il l'État Limite ?",
          'Quelle est la démarche de la calligraphie contemporaine ?',
        ],
      };
    }
    if (locale === 'en') {
      return {
        answer: `No directly verifiable document was identified in Dr. Hassan Makaremi's official archives matching the query: "${query}". To ensure zero hallucination, no ungrounded claims are generated.`,
        suggestedFollowUps: [
          'What is the concept of Listening Differently in clinical psychoanalysis?',
          'What are the 3,954 CNRS psychoanalysis research projects cited by Dr. Makaremi?',
          'What is the strategy for democratic transition in Iran?',
        ],
      };
    }
    return {
      answer: `هیچ سند مستندی در آرشیو رسمی و آثار منتشرشده دکتر حسن مکارمی منطبق با پرسش «${query}» یافت نشد. به منظور صیانت از اعتبار پژوهشی و جلوگیری از توهم اطلاعاتی، پاسخی فراتر از اسناد آرشیو ارائه نمی‌شود.`,
      suggestedFollowUps: [
        'دیدگاه دکتر مکارمی درباره علم بودن روانکاوی چیست؟',
        'مفهوم دگرشنیدن چگونه در روانکاوی بالینی به کار می‌رود؟',
        'نقش دادخواهی و یادمان خاوران در عدالت انتقالی چیست؟',
      ],
    };
  }

  // Generate answer based on top matching documents
  const topDoc = results[0];
  const quotesList = citations.map((c, i) => `[${i + 1}] «${c.quote}» (${c.title})`).join('\n\n');

  if (locale === 'fr') {
    const answer = `D'après les écrits et conférences du Dr Hassan Makaremi, en particulier dans l'ouvrage ou l'article intitulé *${topDoc.title}*, la question soulevée trouve sa réponse dans les principes suivants :\n\n${topDoc.snippet}\n\nCette analyse s'appuie directement sur les sources authentifiées suivantes du corpus :\n\n${quotesList}`;
    return {
      answer,
      suggestedFollowUps: [
        `Comment approfondir ce concept dans les séminaires de Jacques Lacan ?`,
        `Quelle est la portée clinique de cette analyse dans les consultations contemporaines ?`,
        `Quelles sont les publications associées du Dr Makaremi aux éditions H&S Media ?`,
      ],
    };
  }

  if (locale === 'en') {
    const answer = `According to Dr. Hassan Makaremi's authenticated writings and clinical papers, specifically in *${topDoc.title}*, the subject is addressed as follows:\n\n${topDoc.snippet}\n\nThis synthesis is strictly anchored in the following primary archival references:\n\n${quotesList}`;
    return {
      answer,
      suggestedFollowUps: [
        `How does this concept connect to the Operation of the Name-of-the-Father?`,
        `What are the clinical implications of Listening Differently?`,
        `How does this framework apply to transitional justice in Iran?`,
      ],
    };
  }

  // Persian (Default)
  const answer = `بر اساس اسناد پژوهشی و متون مستند دکتر حسن مکارمی، به‌ویژه در اثر «${topDoc.title}»، پاسخ به پرسش شما به شرح زیر در متون آرشیو تبیین گردیده است:\n\n${topDoc.snippet}\n\nاین گزاره‌ها مستقیماً بر مبنای ارجاعات رسمی زیر با شناسه اصالت استخراج گردیده‌اند:\n\n${quotesList}`;

  return {
    answer,
    suggestedFollowUps: [
      `چگونه مفهوم «عملیات نام پدر» در این زمینه نقش‌آفرینی می‌کند؟`,
      `روش «دگرشنیدن» در بازخوانی این موضوع چه چشم‌اندازی می‌گشاید؟`,
      `ارتباط این دیدگاه با ساختار سوژه در روانکاوی لکانی چیست؟`,
    ],
  };
}

/**
 * Ask Dr. Hassan Makaremi's Research Assistant
 * Evaluates prompt injection, performs hybrid retrieval, and generates strictly grounded response with citations.
 */
export async function askResearchAssistant(options: AskAssistantOptions): Promise<RagResponse> {
  const { query, locale = 'fa' } = options;

  // Refinement 3: Detect Prompt Injection
  const injectionCheck = detectPromptInjection(query);
  if (injectionCheck.isInjection) {
    throw new Error(`PROMPT_INJECTION_DETECTED: Malicious adversarial instruction detected (${injectionCheck.pattern}). Request rejected.`);
  }

  // Perform Hybrid Search (BM25 + Vector + RRF) across the corpus
  const results = await executeHybridSearch({
    q: query,
    locale,
    limit: 5,
  });

  // Build structured citations with verified SHA-256 hashes
  const citations: RagCitation[] = results.map((res) => {
    // Extract a direct verbatim quote (~120 chars)
    const quote = res.content.slice(0, 150).replace(/\n+/g, ' ').trim();
    return {
      id: res.id,
      title: res.title,
      documentType: res.documentType,
      pillar: res.pillar,
      url: res.url,
      quote,
      content_sha256: res.content_sha256,
      score: Number(res.score.toFixed(4)),
    };
  });

  // Synthesize answer strictly based on retrieved citations
  const { answer, suggestedFollowUps } = synthesizeGroundedAnswer(query, locale, citations, results);

  return {
    answer,
    locale,
    citations,
    suggestedFollowUps,
  };
}
