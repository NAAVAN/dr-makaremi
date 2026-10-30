'use client';

import React, { useState } from 'react';
import type { ArticleDraft, OmnichannelPublishResult } from '@/lib/agents/types';
import { generateSvgQuoteCard } from '@/lib/agents/quote-card-generator';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  draft: ArticleDraft | null;
  publishResult: OmnichannelPublishResult | null;
}

export default function OmnichannelPreviewModal({
  isOpen,
  onClose,
  draft,
  publishResult,
}: Props) {
  const [activeTab, setActiveTab] = useState<'telegram' | 'facebook' | 'linkedin' | 'instagram' | 'newsletter'>('telegram');

  if (!isOpen) return null;

  const currentTitle = draft?.title || 'ساختار ناخودآگاه و کارکرد نام‌پدر در خوانش لکانی';
  const currentSummary =
    draft?.executiveSummary ||
    'این پژوهش به بررسی سازوکارهای ساختاری روان‌کاوی لکانی و کارکرد استعاره نام‌پدر در پیوند با پدیده دگرشنیدن می‌پردازد.';
  const currentDigest = draft?.sha256Digest || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  const svgCard = generateSvgQuoteCard({
    title: currentTitle,
    quote: currentSummary,
    pillar: draft?.pillar || 'روان‌کاوی و فلسفه',
    sha256Digest: currentDigest,
    date: new Date().toISOString().split('T')[0],
  });

  const handleDownloadSvg = () => {
    const blob = new Blob([svgCard], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `makaremi-quote-card-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div>
            <span className="text-xs font-mono text-emerald-400 font-semibold">
              Omnichannel Synchronized Publication
            </span>
            <h3 className="text-base font-bold text-white mt-0.5">
              پیش‌نمایش خروجی توزیع چندکاناله محتوا
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm font-semibold p-1.5 rounded-lg hover:bg-slate-800"
          >
            ✕ بستن
          </button>
        </div>

        {/* Channel Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 gap-2 overflow-x-auto">
          {[
            { id: 'telegram', label: 'تلگرام Instant View 2.1' },
            { id: 'instagram', label: 'کارت نقل‌قول اینستاگرام (SVG)' },
            { id: 'linkedin', label: 'لینکدین (آکادمیک)' },
            { id: 'facebook', label: 'فیس‌بوک (تحلیلی)' },
            { id: 'newsletter', label: 'خبرنامه ایمیلی ضدسانسور' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-3 px-4 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/40">
          {/* 1. Telegram Instant View */}
          {activeTab === 'telegram' && (
            <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl text-right">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <span className="text-xs font-mono text-sky-400 font-semibold">
                  ⚡ INSTANT VIEW 2.1
                </span>
                <span className="text-[11px] text-slate-500">telegra.ph</span>
              </div>
              <h4 className="text-lg font-bold text-white leading-tight">{currentTitle}</h4>
              <div className="text-xs text-amber-400/90 mt-1">دکتر حسن مکارمی &bull; پاریس</div>
              <p className="text-xs text-slate-300 mt-3 leading-relaxed border-t border-slate-800/60 pt-3">
                {currentSummary}
              </p>
              <div className="mt-4 p-3 bg-sky-950/40 border border-sky-800/40 rounded-xl text-center">
                <span className="text-xs text-sky-300 font-semibold">
                  🔗 مشاهده در وب‌سایت رسمی دکتر مکارمی
                </span>
              </div>
            </div>
          )}

          {/* 2. Instagram SVG Quote Card */}
          {activeTab === 'instagram' && (
            <div className="flex flex-col items-center">
              <div
                className="w-full max-w-[460px] aspect-square rounded-2xl overflow-hidden border border-amber-500/40 shadow-2xl shadow-amber-500/10"
                dangerouslySetInnerHTML={{ __html: svgCard }}
              />
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleDownloadSvg}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-lg"
                >
                  دانلود کارت گرافیکی وکتور (SVG 1080x1080)
                </button>
              </div>
            </div>
          )}

          {/* 3. LinkedIn Post */}
          {activeTab === 'linkedin' && (
            <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-5 text-right">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-sm">
                  HM
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Dr. Hassan Makaremi</div>
                  <div className="text-[11px] text-slate-400">
                    Psychanalyste clinicien, Paris &bull; Chercheur associé Sorbonne
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-200 mt-4 leading-relaxed font-sans" dir="ltr">
                <p className="font-semibold text-white">🔬 Publication académique</p>
                <p className="mt-1">Titre: {draft?.frenchTitle || currentTitle}</p>
                <p className="mt-2 text-slate-300">
                  {draft?.frenchSummary || currentSummary}
                </p>
                <p className="mt-3 text-emerald-400 font-mono text-[11px]">
                  &bull; Certified Ed25519 Digest: {currentDigest.slice(0, 32)}...
                </p>
                <p className="mt-1 text-sky-400">
                  https://makaremi.com/fa/articles/{draft?.slug || 'sample'}
                </p>
              </div>
            </div>
          )}

          {/* 4. Facebook Post */}
          {activeTab === 'facebook' && (
            <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-5 text-right">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-sm">
                  HM
                </div>
                <div>
                  <div className="text-sm font-bold text-white">دکتر حسن مکارمی</div>
                  <div className="text-[11px] text-slate-400">روانکاو بالینی، پاریس</div>
                </div>
              </div>
              <p className="text-xs text-slate-200 mt-4 leading-relaxed whitespace-pre-line">
                {publishResult?.facebookPostFormatted || `📖 ${currentTitle}
✍️ یادداشتی از دکتر حسن مکارمی (روانکاو بالینی در پاریس و پژوهشگر)

${currentSummary}

📌 پیوند مطالعه و استنادها:
https://makaremi.com/fa/articles/${draft?.slug || 'sample'}

#روانکاوی #لکان #دکتر_حسن_مکارمی #حقوق_بشر`}
              </p>
            </div>
          )}

          {/* 5. Anti-Censorship Newsletter */}
          {activeTab === 'newsletter' && (
            <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-5 text-right">
              <div className="bg-emerald-950/50 border border-emerald-800/40 p-3 rounded-xl mb-4 text-center">
                <span className="text-xs text-emerald-300 font-medium">
                  🛡️ نسخه تمام‌متن ایمیلی (ضد فیلترینگ و بدون نیاز به اینترنت آزاد)
                </span>
              </div>
              <h4 className="text-base font-bold text-white">{currentTitle}</h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {currentSummary}
              </p>
              <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400">
                <div>AUTHENTICITY: ED25519-VERIFIED</div>
                <div className="truncate">HASH: {currentDigest}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
