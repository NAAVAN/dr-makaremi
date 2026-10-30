'use client';

import React, { useState, useEffect } from 'react';
import { X, Globe, Radio, ExternalLink, ShieldCheck, Download, CheckCircle2 } from 'lucide-react';
import type { Locale } from '@makaremi/shared';
import { VERIFIED_MIRROR_CHANNELS, type MirrorChannel } from '@/lib/censorship-bypass';

interface MirrorSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  locale: Locale;
}

export function MirrorSwitcher({ isOpen, onClose, locale }: MirrorSwitcherProps) {
  const [mirrors, setMirrors] = useState<MirrorChannel[]>(VERIFIED_MIRROR_CHANNELS);
  const isFa = locale === 'fa';

  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/mirrors')
      .then((res) => res.json())
      .then((data) => {
        if (data.mirrors) setMirrors(data.mirrors);
      })
      .catch(() => {});

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mirror-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Radio size={22} className="animate-pulse" />
            </div>
            <div>
              <h3 id="mirror-modal-title" className="font-bold text-base md:text-lg">
                {isFa ? 'مسیرهای دسترسی آزاد و آینه‌های ضدسانسور' : 'Miroirs et Canaux Anti-Censure'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isFa ? 'راه‌های جایگزین برای دسترسی بدون فیلترشکن از داخل ایران' : 'Accès résilient en cas de censure'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن پنجره"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mirror Channel List */}
        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          {mirrors.map((mirror, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 bg-slate-50/60 dark:bg-slate-800/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span className="font-semibold text-sm">{mirror.name}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isFa ? mirror.description_fa : locale === 'fr' ? mirror.description_fr : mirror.description_en}
                </p>
              </div>
              <a
                href={mirror.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors shrink-0 shadow-sm"
              >
                <span>{isFa ? 'ورود' : 'Accéder'}</span>
                <ExternalLink size={13} />
              </a>
            </div>
          ))}

          {/* Offline Survival Tip */}
          <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs leading-relaxed space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
              <ShieldCheck size={16} />
              <span>{isFa ? 'راهکار شرایط قطعی کامل اینترنت' : 'Mode coupure totale d’Internet'}</span>
            </div>
            <p>
              {isFa
                ? 'در زمان قطع کامل دسترسی، دکمه «دانلود بسته آفلاین» در انتهای هر مقاله را بزنید. فایل دانلودشده با تمام استایل‌ها و فونت‌ها به صورت محلی باز شده و بدون نیاز به اینترنت قابل مطالعه و ارسال در پیام‌رسان‌هاست.'
                : 'En cas de coupure du réseau, téléchargez les bundles hors-ligne disponibles sur chaque article pour une consultation locale complète.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            {isFa ? 'بستن' : 'Fermer'}
          </button>
        </div>
      </div>
    </div>
  );
}
