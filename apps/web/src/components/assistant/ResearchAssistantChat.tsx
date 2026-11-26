'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  HeartHandshake,
  Loader2,
  Mic,
  MicOff,
  RotateCcw,
  Send,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import type { ContentPillar, Locale, RagChatHistoryTurn, RagDocumentType } from '@makaremi/shared';
import { CitationCard } from './CitationCard';
import type { RagCitation, RagResponse } from '@/lib/rag/research-assistant';

interface ResearchAssistantChatProps {
  locale: Locale;
}

interface ChatThreadMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: RagCitation[];
  suggestedFollowUps?: string[];
  telemetryId?: string;
  groundingScore?: number;
  safetyMode?: RagResponse['safetyMode'];
  rewrittenQuery?: string;
  streaming?: boolean;
  feedbackSent?: 1 | -1 | null;
}

const PRESET_QUESTIONS: Record<Locale, string[]> = {
  fa: [
    'دیدگاه دکتر مکارمی درباره علم بودن روان‌کاوی و آمار CNRS چیست؟',
    'مفهوم «دگرشنیدن» چگونه در روان‌کاوی بالینی و بازخوانی حافظ به کار می‌رود؟',
    'در سخنرانی «روان ما و مرگ» (در روان‌پژوهی) چه نکاتی مطرح شده است؟',
    'جایگاه دادخواهی، خاوران و کشتار ۱۳۶۷ در عدالت انتقالی چگونه تبیین شده است؟',
    'نحوهٔ خرید آثار اصل خوشنویسی و استعلام گواهی اصالت Décret Marcus چگونه است؟',
  ],
  fr: [
    "Quelle est la définition clinique de l'État limite selon le Dr Makaremi ?",
    'Comment la psychanalyse lacanienne aborde-t-elle la science (3 954 projets CNRS) ?',
    "Que dit le Dr Makaremi sur la mort dans ses conférences Dar Ravanpajoohi ?",
    "Comment fonctionne le certificat d'authenticité Décret Marcus à Paris ?",
  ],
  en: [
    'What is the methodology of Listening Differently in clinical psychoanalysis?',
    'What are the 3,954 CNRS clinical psychoanalysis research projects cited?',
    'How does Dr. Makaremi formulate the Cultural Realm of Iran and democratic transition?',
    'What did Dr. Makaremi discuss on death and finitude in his Persian lectures?',
  ],
};

export const ResearchAssistantChat: React.FC<ResearchAssistantChatProps> = ({ locale }) => {
  const [query, setQuery] = useState('');
  const [pillarFilter, setPillarFilter] = useState<ContentPillar | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<RagDocumentType | 'all'>('all');
  const [messages, setMessages] = useState<ChatThreadMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [negativeNoteTarget, setNegativeNoteTarget] = useState<string | null>(null);
  const [negativeNoteText, setNegativeNoteText] = useState('');

  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const tx = (fa: string, fr: string, en: string) => (isFa ? fa : isFr ? fr : en);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const w = window as unknown as Record<string, unknown>;
      setSpeechSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
    }
  }, []);

  const toggleVoiceInput = () => {
    if (typeof window === 'undefined') return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const w = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onend: () => void;
        onerror: () => void;
        start: () => void;
        stop: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onend: () => void;
        onerror: () => void;
        start: () => void;
        stop: () => void;
      };
    };
    const Rec = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Rec) return;
    const rec = new Rec();
    rec.lang = isFa ? 'fa-IR' : isFr ? 'fr-FR' : 'en-GB';
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results?.[0]?.[0]?.transcript || '';
      if (transcript) setQuery((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  const handleSend = async (questionText: string) => {
    const cleanQ = questionText.trim();
    if (!cleanQ || loading) return;

    const historyPayload: RagChatHistoryTurn[] = messages
      .filter((m) => !m.streaming && m.content.trim())
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));

    const userMsgId = `u-${Date.now()}`;
    const assistantMsgId = `a-${Date.now() + 1}`;

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: cleanQ },
      { id: assistantMsgId, role: 'assistant', content: '', streaming: true, citations: [] },
    ]);
    setQuery('');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/rag/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          query: cleanQ,
          locale,
          history: historyPayload,
          pillar: pillarFilter,
          type: typeFilter,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || tx('خطایی در پردازش رخ داد.', 'Erreur de traitement.', 'Processing error.'));
      }

      if (!res.body) {
        throw new Error(tx('پاسخ جریانی در دسترس نیست.', 'Flux indisponible.', 'Stream unavailable.'));
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = 'message';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() || '';

        for (const block of blocks) {
          let evtName = currentEvent;
          let dataStr = '';
          for (const line of block.split('\n')) {
            if (line.startsWith('event:')) evtName = line.slice(6).trim();
            else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
          }
          if (!dataStr) continue;
          try {
            const payload = JSON.parse(dataStr);
            if (evtName === 'metadata') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        citations: payload.citations || [],
                        safetyMode: payload.safetyMode,
                        rewrittenQuery: payload.rewrittenQuery,
                      }
                    : m
                )
              );
            } else if (evtName === 'token') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: `${m.content}${payload.delta || ''}` }
                    : m
                )
              );
            } else if (evtName === 'done') {
              const doneResp = payload as RagResponse;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: doneResp.answer || m.content,
                        citations: doneResp.citations || m.citations,
                        suggestedFollowUps: doneResp.suggestedFollowUps || [],
                        telemetryId: doneResp.telemetryId,
                        groundingScore: doneResp.groundingScore,
                        safetyMode: doneResp.safetyMode || m.safetyMode,
                        rewrittenQuery: doneResp.rewrittenQuery || m.rewrittenQuery,
                        streaming: false,
                      }
                    : m
                )
              );
            } else if (evtName === 'error') {
              throw new Error(payload.message || 'Streaming error');
            }
          } catch (parseErr) {
            if (evtName === 'error') throw parseErr;
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : tx('خطای ارتباط با سامانه دستیار', 'Erreur de connexion', 'Assistant connection error');
      setError(msg);
      setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
    } finally {
      setLoading(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 120);
    }
  };

  const handleFeedback = async (msg: ChatThreadMessage, rating: 1 | -1, note?: string) => {
    const prevUserMsg = messages
      .slice(0, messages.findIndex((m) => m.id === msg.id))
      .reverse()
      .find((m) => m.role === 'user');

    await fetch('/api/rag/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telemetryId: msg.telemetryId || null,
        queryPreview: prevUserMsg?.content?.slice(0, 260),
        locale,
        rating,
        issueCategory: rating === -1 ? 'inaccurate' : undefined,
        userNote: note?.trim() || undefined,
      }),
    }).catch(() => {});

    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, feedbackSent: rating } : m))
    );
    setNegativeNoteTarget(null);
    setNegativeNoteText('');
  };

  const presets = PRESET_QUESTIONS[locale] || PRESET_QUESTIONS.fa;
  const isRtl = locale === 'fa';

  const pillarFilters: Array<{ id: ContentPillar | 'all'; label: string }> = [
    { id: 'all', label: tx('همه ارکان', 'Tous les axes', 'All Pillars') },
    { id: 'psychoanalysis', label: tx('روان‌کاوی', 'Psychanalyse', 'Psychoanalysis') },
    { id: 'art_calligraphy', label: tx('هنر و خوشنویسی', 'Art', 'Art') },
    { id: 'cultural_strategy', label: tx('راهبرد فرهنگی', 'Stratégie', 'Strategy') },
    { id: 'human_rights_dadkhahi', label: tx('دادخواهی', 'Droits humains', 'Human Rights') },
  ];

  const typeFilters: Array<{ id: RagDocumentType | 'all'; label: string }> = [
    { id: 'all', label: tx('همه منابع', 'Toutes sources', 'All Sources') },
    { id: 'speech', label: tx('سخنرانی‌ها', 'Conférences', 'Lectures') },
    { id: 'book', label: tx('کتاب‌ها', 'Livres', 'Books') },
    { id: 'article', label: tx('مقالات', 'Articles', 'Articles') },
    { id: 'poem', label: tx('اشعار', 'Poèmes', 'Poems') },
    { id: 'artwork', label: tx('خوشنویسی', 'Calligraphie', 'Artworks') },
    { id: 'commerce', label: tx('فروشگاه و اصالت', 'Atelier & Éditions', 'Shop & COA') },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Pre-Query Research Filters */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 p-3.5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {pillarFilters.map((pf) => (
              <button
                key={pf.id}
                type="button"
                onClick={() => setPillarFilter(pf.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                  pillarFilter === pf.id
                    ? 'bg-amber-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {pf.label}
              </button>
            ))}
          </div>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setMessages([]);
                setError(null);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-500 hover:text-amber-600"
            >
              <RotateCcw size={12} />
              <span>{tx('گفتگوی تازه', 'Nouvelle discussion', 'New thread')}</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800">
          {typeFilters.map((tf) => (
            <button
              key={tf.id}
              type="button"
              onClick={() => setTypeFilter(tf.id)}
              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border transition-colors ${
                typeFilter === tf.id
                  ? 'border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-300'
                  : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preset Questions (shown before first message) */}
      {messages.length === 0 && (
        <div className="space-y-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {tx('پرسش‌های پیشنهادی پژوهشگران:', 'Questions suggérées :', 'Suggested Research Questions:')}
          </span>
          <div className="flex flex-wrap gap-2">
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                type="button"
                className="text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full px-3 py-1.5 transition-all text-start border border-zinc-200 dark:border-zinc-700"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Multi-Turn Conversation Thread */}
      {messages.length > 0 && (
        <div className="space-y-4">
          {messages.map((msg) =>
            msg.role === 'user' ? (
              <div key={msg.id} className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl bg-amber-600 text-white px-4 py-3 text-sm leading-relaxed shadow-sm">
                  {msg.content}
                </div>
              </div>
            ) : (
              <div
                key={msg.id}
                className={`rounded-2xl border p-5 shadow-sm space-y-4 ${
                  msg.safetyMode === 'crisis_helpline'
                    ? 'border-rose-500/50 bg-rose-50/70 dark:bg-rose-950/30'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    {msg.safetyMode === 'crisis_helpline' ? (
                      <>
                        <HeartHandshake size={15} className="text-rose-600" />
                        <span className="text-rose-700 dark:text-rose-300">
                          {tx('پیام حمایتی و خطوط فوری کمک‌رسانی', 'Aide immédiate et lignes d’écoute', 'Immediate Support & Helplines')}
                        </span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={15} className="text-emerald-600" />
                        <span>
                          {tx(
                            'پاسخ مستند پژوهشی (Zero-Hallucination)',
                            'Réponse académique sourcée',
                            'Grounded Archival Response'
                          )}
                        </span>
                      </>
                    )}
                  </span>

                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
                    {msg.streaming ? (
                      <span className="inline-flex items-center gap-1 text-amber-600">
                        <Loader2 size={11} className="animate-spin" />
                        <span>{tx('در حال نگارش...', 'Rédaction...', 'Streaming...')}</span>
                      </span>
                    ) : (
                      <>
                        {typeof msg.groundingScore === 'number' && msg.citations && msg.citations.length > 0 && (
                          <span>
                            {tx('اطمینان استناد:', 'Ancrage:', 'Grounding:')} {Math.round(msg.groundingScore * 100)}%
                          </span>
                        )}
                        {msg.citations && msg.citations.length > 0 && (
                          <span>
                            • {msg.citations.length} {tx('منبع معتبر', 'sources', 'sources')}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {msg.rewrittenQuery && (
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg px-3 py-1.5">
                    {tx('پرسش جستجوشده در آرشیو:', 'Requête recherchée :', 'Searched query:')} «{msg.rewrittenQuery}»
                  </div>
                )}

                <div className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line font-serif">
                  {msg.content || (msg.streaming ? tx('در حال بازیابی اسناد آرشیو...', 'Recherche dans les archives...', 'Retrieving archival sources...') : '')}
                </div>

                {/* Citations Grid */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      {tx(
                        'اسناد استنادشده با گواهی اصالت SHA-256 و لینک مستقیم:',
                        'Sources authentifiées (SHA-256) :',
                        'Grounded Archival Citations (SHA-256):'
                      )}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {msg.citations.map((c, i) => (
                        <CitationCard key={c.id} citation={c} index={i} locale={locale} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Anonymous Feedback Controls */}
                {!msg.streaming && msg.safetyMode !== 'crisis_helpline' && (
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
                    <span>
                      {msg.feedbackSent
                        ? tx('سپاس از بازخورد شما؛ به بهبود آموزش دستیار کمک می‌کند.', 'Merci pour votre retour.', 'Thank you — your feedback improves archival accuracy.')
                        : tx('آیا این پاسخ دقیق و سودمند بود؟', 'Cette réponse vous a-t-elle été utile ?', 'Was this grounded response helpful?')}
                    </span>
                    {!msg.feedbackSent && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleFeedback(msg, 1)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
                        >
                          <ThumbsUp size={12} />
                          <span>{tx('دقیق بود', 'Utile', 'Helpful')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNegativeNoteTarget(msg.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-rose-500 hover:text-rose-600 transition-colors"
                        >
                          <ThumbsDown size={12} />
                          <span>{tx('نیازمند اصلاح', 'À améliorer', 'Needs improvement')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {negativeNoteTarget === msg.id && (
                  <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/70 p-3 flex flex-wrap items-center gap-2">
                    <input
                      value={negativeNoteText}
                      onChange={(e) => setNegativeNoteText(e.target.value)}
                      placeholder={tx('توضیح کوتاه برای بهبود آموزش دستیار (اختیاری)...', 'Précision facultative...', 'Optional note for editorial review...')}
                      className="flex-1 min-w-[200px] rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleFeedback(msg, -1, negativeNoteText)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold"
                    >
                      {tx('ثبت بازخورد', 'Envoyer', 'Submit')}
                    </button>
                  </div>
                )}

                {/* Follow-up suggestions */}
                {!msg.streaming && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {tx('ادامهٔ پژوهش (پرسش‌های تکمیلی):', 'Questions complémentaires :', 'Suggested Follow-ups:')}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {msg.suggestedFollowUps.map((fu, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSend(fu)}
                          className="text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg px-3 py-1.5 transition-all text-start"
                        >
                          {fu}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          )}
          <div ref={endRef} />
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} />
            <span className="font-bold">{tx('هشدار امنیتی یا خطا:', 'Alerte :', 'Notice:')}</span>
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="text-zinc-400 hover:text-zinc-600">
            ✕
          </button>
        </div>
      )}

      {/* Query Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(query);
        }}
        className="relative"
      >
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(query);
            }
          }}
          placeholder={tx(
            'پرسش پژوهشی خود را درباره کتاب‌ها، مقالات، سخنرانی‌های ویدیویی، اشعار یا تابلوهای دکتر مکارمی مطرح فرمایید...',
            'Posez votre question de recherche sur les écrits, conférences et œuvres du Dr Makaremi...',
            "Ask your research question across Dr. Makaremi's books, articles, lectures, poems, and calligraphy..."
          )}
          rows={3}
          maxLength={1000}
          className="w-full rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/90 p-4 pb-12 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 backdrop-blur-md shadow-sm transition-all resize-none"
        />
        <div className="absolute end-3 bottom-3 flex items-center gap-2">
          <span className="text-[10px] text-zinc-400 font-mono">{query.length}/1000</span>
          {speechSupported && (
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`min-h-[34px] min-w-[34px] inline-flex items-center justify-center rounded-xl border transition-colors ${
                listening
                  ? 'border-rose-500 bg-rose-500/15 text-rose-600'
                  : 'border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-amber-500'
              }`}
              title={tx('پرسش صوتی', 'Dictée vocale', 'Voice input')}
            >
              {listening ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="min-h-[34px] flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 transition-all shadow-md"
          >
            {loading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>{tx('در حال جستجو...', 'Recherche...', 'Searching...')}</span>
              </>
            ) : (
              <>
                <span>{tx('پرسش', 'Interroger', 'Query')}</span>
                <Send size={13} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
