'use client';

import React, { useState } from 'react';
import type { Locale } from '@makaremi/shared';
import { CitationCard } from './CitationCard';
import type { RagCitation, RagResponse } from '@/lib/rag/research-assistant';

interface ResearchAssistantChatProps {
  locale: Locale;
}

const PRESET_QUESTIONS: Record<Locale, string[]> = {
  fa: [
    'دیدگاه دکتر مکارمی درباره علم بودن روانکاوی چیست؟',
    'مفهوم «دگرشنیدن» چگونه در روانکاوی بالینی و بازخوانی حافظ به کار می‌رود؟',
    'استعاره پدری و «عملیات نام پدر» در روان‌پریشی‌ها چه نقشی دارد؟',
    'جایگاه دادخواهی، خاوران و کشتار ۱۳۶۷ در عدالت انتقالی چگونه تبیین شده است؟',
  ],
  fr: [
    "Quelle est la définition clinique de l'État Limite selon le Dr Makaremi ?",
    'Comment la psychanalyse lacanienne aborde-t-elle la question de la science ?',
    "Quelle est la démarche de la calligraphie contemporaine persane à Paris ?",
  ],
  en: [
    'What is the methodology of Listening Differently in clinical psychoanalysis?',
    'What are the 3,954 CNRS clinical psychoanalysis research projects cited?',
    'How does Dr. Makaremi formulate the concept of Cultural Territory of Iran?',
  ],
};

export const ResearchAssistantChat: React.FC<ResearchAssistantChatProps> = ({ locale }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<RagResponse | null>(null);

  const presets = PRESET_QUESTIONS[locale] || PRESET_QUESTIONS.fa;

  const handleSend = async (questionText: string) => {
    if (!questionText.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({ query: questionText, locale }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'خطایی در پردازش رخ داد.');
      }

      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطای ارتباط با سامانه دستیار');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(query);
  };

  const isRtl = locale === 'fa';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Preset Questions Chips */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {locale === 'fa' ? 'پرسش‌های پیشنهادی پژوهشگران:' : locale === 'fr' ? 'Questions suggérées :' : 'Suggested Research Questions:'}
        </span>
        <div className="flex flex-wrap gap-2">
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(p);
                handleSend(p);
              }}
              type="button"
              className="text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full px-3 py-1.5 transition-all text-start border border-zinc-200 dark:border-zinc-700"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Query Form */}
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            locale === 'fa'
              ? 'پرسش پژوهشی خود را درباره کتاب‌ها، مقالات روان‌کاوی یا دیدگاه‌های دکتر مکارمی مطرح فرمایید...'
              : locale === 'fr'
              ? "Posez votre question de recherche sur les écrits et séminaires du Dr Makaremi..."
              : "Ask your research question regarding Dr. Makaremi's publications..."
          }
          rows={3}
          maxLength={1000}
          className="w-full rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 p-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 backdrop-blur-md shadow-sm transition-all resize-none"
        />
        <div className="absolute end-3 bottom-3 flex items-center gap-2">
          <span className="text-[10px] text-zinc-400">{query.length}/1000</span>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 transition-all shadow-md"
          >
            {loading ? (
              <span>در حال جستجو...</span>
            ) : (
              <>
                <span>{locale === 'fa' ? 'پرسش' : locale === 'fr' ? 'Interroger' : 'Query'}</span>
                <span>←</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold">هشدار امنیتی یا خطا:</span>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-zinc-400 hover:text-zinc-600">✕</button>
        </div>
      )}

      {/* Answer & Citations Display */}
      {response && (
        <div className="space-y-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {locale === 'fa' ? 'پاسخ مستند پژوهشی (Zero-Hallucination)' : 'Grounded Research Response'}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {response.citations.length} منبع معتبر
              </span>
            </div>

            <div className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line font-serif">
              {response.answer}
            </div>

            {/* Citations Grid */}
            {response.citations.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {locale === 'fa' ? 'اسناد استنادشده با گواهی اصالت SHA-256:' : 'Grounded Citations with SHA-256:'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {response.citations.map((c, i) => (
                    <CitationCard key={c.id} citation={c} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Follow-up suggestions */}
            {response.suggestedFollowUps && response.suggestedFollowUps.length > 0 && (
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {locale === 'fa' ? 'پرسش‌های تکمیلی پیشنهادی:' : 'Suggested Follow-ups:'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {response.suggestedFollowUps.map((fu, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setQuery(fu);
                        handleSend(fu);
                      }}
                      className="text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg px-3 py-1.5 transition-all text-start"
                    >
                      {fu}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
