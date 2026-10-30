'use client';

import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, Check, Bookmark, Radio } from 'lucide-react';
import { saveArticleOffline } from '@/lib/pwa';
import { MirrorSwitcher } from './MirrorSwitcher';
import type { Locale } from '@makaremi/shared';

interface PwaOfflineBarProps {
  locale: Locale;
}

export function PwaOfflineBar({ locale }: PwaOfflineBarProps) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [saved, setSaved] = useState<boolean>(false);
  const [mirrorOpen, setMirrorOpen] = useState<boolean>(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSavePage = async () => {
    try {
      const pageKey = window.location.pathname;
      const htmlContent = document.querySelector('main')?.innerHTML || '';
      await saveArticleOffline(pageKey, {
        url: window.location.href,
        title: document.title,
        content: htmlContent,
        savedAt: new Date().toISOString(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // Ignored if storage full
    }
  };

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';

  return (
    <>
      <aside
        aria-label="PWA Offline & Network Status"
        className="flex items-center justify-between px-6 py-2 text-xs bg-slate-900 text-slate-100 border-b border-slate-800 transition-colors"
      >
        <div className="w-full max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Wifi size={13} />
                <span>
                  {isFa ? 'ارتباط آنلاین پایدار' : isFr ? 'Connecté' : 'Online'}
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400 font-bold animate-pulse">
                <WifiOff size={13} />
                <span>
                  {isFa
                    ? 'حالت آفلاین (مقاوم در برابر اختلال شبکه)'
                    : isFr
                    ? 'Mode Hors Ligne'
                    : 'Offline Mode'}
                </span>
              </span>
            )}

            <button
              type="button"
              onClick={() => setMirrorOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 font-medium transition-colors border border-slate-700 cursor-pointer"
              title={isFa ? 'نمایش مسیرهای دسترسی ضدسانسور' : 'Canaux anti-censure'}
            >
              <Radio size={12} />
              <span>{isFa ? 'آینه‌های ضدسانسور' : 'Miroirs anti-censure'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSavePage}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors border border-slate-700 cursor-pointer font-medium"
            title={isFa ? 'ذخیره این صفحه در حافظه مرورگر' : 'Enregistrer hors-ligne'}
          >
            {saved ? (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <Check size={14} />
                {isFa ? 'ذخیره شد' : isFr ? 'Enregistré' : 'Saved'}
              </span>
            ) : (
              <>
                <Bookmark size={14} />
                <span>
                  {isFa
                    ? 'ذخیره برای مطالعه آفلاین'
                    : isFr
                    ? 'Lire hors-ligne'
                    : 'Save for offline reading'}
                </span>
              </>
            )}
          </button>
        </div>
      </aside>

      <MirrorSwitcher
        isOpen={mirrorOpen}
        onClose={() => setMirrorOpen(false)}
        locale={locale}
      />
    </>
  );
}
