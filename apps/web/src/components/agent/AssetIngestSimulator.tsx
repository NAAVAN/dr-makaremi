'use client';

import React, { useState } from 'react';
import type { ArtworkIngestResult } from '@/lib/agents/orchestrator';

export default function AssetIngestSimulator() {
  const [imageUrl, setImageUrl] = useState('https://makaremi.com/images/art/calligraphy-sample.jpg');
  const [voiceDesc, setVoiceDesc] = useState('تابلوی خوشنویسی جدید: هو الحق با خط نستعلیق و تکنیک مرکب روی کاغذ دست‌ساز');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ArtworkIngestResult | null>(null);

  const handleIngest = async () => {
    setIsProcessing(true);
    setResult(null);
    try {
      const res = await fetch('/api/webhooks/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Bot-Api-Secret-Token': 'makaremi-tg-secret-2026',
        },
        body: JSON.stringify({
          update_id: Date.now(),
          message: {
            message_id: Math.floor(Math.random() * 100000),
            date: Math.floor(Date.now() / 1000),
            from: { id: 19501329, username: 'hassan_makaremi' },
            photo: [{ file_id: 'preset_calligraphy_art', width: 4096, height: 4096 }],
            caption: voiceDesc,
          },
        }),
      });

      const data = await res.json();
      if (data.ok && data.asset) {
        setResult(data.asset);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
      <div className="pb-4 border-b border-slate-800">
        <span className="text-xs uppercase tracking-wider font-mono text-amber-400 font-semibold">
          IIIF & Deep-Zoom Asset Processing
        </span>
        <h3 className="text-lg font-bold text-white mt-1">
          شبیه‌ساز ثبت آثار هنری و کتب جدید با عکس و ویس
        </h3>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            آدرس عکس تابلوی خط یا جلد کتاب (باید در دامنه مجاز باشد):
          </label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            توضیح صوتی پیاده‌شده استاد درباره اثر:
          </label>
          <textarea
            value={voiceDesc}
            onChange={(e) => setVoiceDesc(e.target.value)}
            className="w-full h-18 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <button
          onClick={handleIngest}
          disabled={isProcessing}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg hover:brightness-110 transition-all disabled:opacity-50"
        >
          {isProcessing ? 'در حال تحلیل عکس و تولید کاشی‌های IIIF...' : 'ارسال تصویر و پردازش خودکار اثر'}
        </button>

        {result && (
          <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-emerald-500/30">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                ✓ IIIF Asset Manifest Ready ({result.type})
              </span>
              <span className="text-[11px] text-slate-400">{result.assetId}</span>
            </div>

            <div className="text-xs text-slate-300 mt-3 space-y-1.5 font-mono">
              <div>
                <span className="text-slate-500">عنوان اثر:</span>{' '}
                <span className="text-white font-sans">{result.title}</span>
              </div>
              <div>
                <span className="text-slate-500">مشخصات هرم زوم عمیق:</span>{' '}
                <span className="text-amber-400">
                  {result.tileSpecs.width}x{result.tileSpecs.height} px (Tiles: 512px, Scales: 1, 2, 4, 8, 16)
                </span>
              </div>
              <div>
                <span className="text-slate-500">نسخه فشرده بهینه لبه:</span>{' '}
                <span className="text-sky-400 underline">{result.avifOptimizedUrl}</span>
              </div>
              <div>
                <span className="text-slate-500">مانیفست استاندارد:</span>{' '}
                <span className="text-emerald-400 underline">{result.iiifManifestUrl}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
