'use client';

import React, { useState, useEffect } from 'react';
import type { Locale } from '@makaremi/shared';
import type { MigrationQueueStats, EnrichedMigrationArticle } from '@/lib/etl/types';

interface FacebookEtlStudioProps {
  locale: Locale;
}

export const FacebookEtlStudio: React.FC<FacebookEtlStudioProps> = ({ locale }) => {
  const [stats, setStats] = useState<MigrationQueueStats | null>(null);
  const [articles, setArticles] = useState<EnrichedMigrationArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [liveInput, setLiveInput] = useState({
    id: `fb_test_${Date.now()}`,
    title: 'روانکاوی و سوژه در دنیای معاصر',
    post: 'در جهان معاصر، دگرشنیدن راهی نو برای بازخوانی ناخودآگاه است. پژوهشها نشان میدهند که استعاره پدری و عملیات نام پدر در درمان روانپریشی‌ها ساختاریافته است. این روند به آسیبشناسی ازهمگسستگی پاسخ میدهد.',
  });
  const [liveResult, setLiveResult] = useState<EnrichedMigrationArticle | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/etl/ingest');
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.stats);
        setArticles(data.articles || []);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleLiveIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLiveError(null);
    setLiveResult(null);

    try {
      const res = await fetch('/api/etl/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: liveInput.id,
          timestamp: Date.now(),
          title: liveInput.title,
          post: liveInput.post,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'خطا در پردازش');
      }

      setLiveResult(data.article);
      fetchQueue();
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : 'خطای پردازش');
    }
  };

  const isRtl = locale === 'fa';

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Overview Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 p-4">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">
              کل پست‌های خام
            </span>
            <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {stats.total_raw_processed}
            </span>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-1">
              فیلتر پست‌های کوتاه (&lt;80 کلمه)
            </span>
            <span className="text-xl font-bold text-amber-600 dark:text-amber-400 font-mono">
              {stats.filtered_micro_posts}
            </span>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <span className="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">
              ادغام رشته‌پست‌ها
            </span>
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400 font-mono">
              {stats.threads_merged}
            </span>
          </div>

          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
            <span className="text-[10px] text-rose-600 dark:text-rose-400 uppercase tracking-wider block mb-1">
              حذف داده‌های تکراری
            </span>
            <span className="text-xl font-bold text-rose-600 dark:text-rose-400 font-mono">
              {stats.duplicates_eliminated}
            </span>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
              در انتظار بازبینی (Signed)
            </span>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {stats.ready_for_review_count}
            </span>
          </div>
        </div>
      )}

      {/* Live Pipeline Interactive Tester */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <span>کارگاه زنده تبدیل پست فیس‌بوک به مقاله علمی</span>
          <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded">
            Live Normalizer & Enrichment
          </span>
        </h3>

        <form onSubmit={handleLiveIngest} className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">عنوان پست خام:</label>
            <input
              type="text"
              value={liveInput.title}
              onChange={(e) => setLiveInput({ ...liveInput, title: e.target.value })}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">متن پست خام فیس‌بوک (با حروف عربی، عدم نیم‌فاصله):</label>
            <textarea
              rows={4}
              value={liveInput.post}
              onChange={(e) => setLiveInput({ ...liveInput, post: e.target.value })}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500 leading-relaxed font-sans"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 transition-all shadow-sm"
          >
            اجرای پایپ‌لاین نرمال‌سازی و امضای رمزنگاری
          </button>
        </form>

        {liveError && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-500">
            {liveError}
          </div>
        )}

        {liveResult && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                نتیجه پالایش و غنی‌سازی هوشمند (موفق)
              </span>
              <span className="font-mono text-[10px] text-zinc-500">
                Pillar: {liveResult.pillar} | Words: {liveResult.word_count}
              </span>
            </div>

            <div>
              <span className="text-zinc-500 block mb-1">متن پالایش‌شده با نیم‌فاصله معیار (ZWNJ):</span>
              <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg text-zinc-800 dark:text-zinc-200 whitespace-pre-line leading-relaxed">
                {liveResult.body_markdown}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-zinc-500">اصطلاحات لکانی شناسایی‌شده:</span>{' '}
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {liveResult.lacanian_terms_detected.join('، ') || 'موردی یافت نشد'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500">وضعیت سند:</span>{' '}
                <span className="font-mono bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-[10px]">
                  {liveResult.status}
                </span>
              </div>
              <div className="col-span-2 font-mono text-[10px] text-zinc-500 truncate">
                <span>هش محتوا (SHA-256): </span>
                <span className="text-zinc-700 dark:text-zinc-300">{liveResult.content_sha256}</span>
              </div>
              <div className="col-span-2 font-mono text-[10px] text-zinc-500 truncate">
                <span>امضای دیجیتال Ed25519: </span>
                <span className="text-zinc-700 dark:text-zinc-300">{liveResult.signature_ed25519.slice(0, 48)}...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Migration Queue Items */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
          <span>صف بازبینی مقالات استخراج‌شده آرشیو فیس‌بوک ({articles.length} مورد)</span>
          <button
            onClick={fetchQueue}
            disabled={loading}
            className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
          >
            {loading ? 'در حال دریافت...' : 'بروزرسانی صف'}
          </button>
        </h3>

        <div className="space-y-3">
          {articles.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 p-4 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                    {item.title}
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    {item.pillar}
                  </span>
                  {item.is_merged_thread && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      رشته ادغام‌شده ({item.merged_part_count} بخش)
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                  {item.status}
                </span>
              </div>

              <p className="text-zinc-600 dark:text-zinc-300 line-clamp-2">
                {item.executive_summary}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400">
                <span className="font-mono">SHA-256: {item.content_sha256.slice(0, 16)}...</span>
                <span>تعداد کلمات: {item.word_count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
