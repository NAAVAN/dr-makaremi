'use client';

import React, { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Locale } from '@makaremi/shared';

interface LanguageSwitcherProps {
  currentLocale: Locale;
}

const LOCALES: Array<{ code: Locale; label: string; dir: 'rtl' | 'ltr' }> = [
  { code: 'fa', label: 'فارسی', dir: 'rtl' },
  { code: 'fr', label: 'Français', dir: 'ltr' },
  { code: 'en', label: 'English', dir: 'ltr' },
];

function LanguageSwitcherInner({ currentLocale }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === currentLocale) return;

    const segments = pathname.split('/').filter(Boolean);

    if (
      segments.length > 0 &&
      (segments[0] === 'fa' || segments[0] === 'fr' || segments[0] === 'en')
    ) {
      segments[0] = newLocale;
    } else {
      segments.unshift(newLocale);
    }

    // Map localized psychoanalysis pillar slug cleanly across FA/EN <-> FR
    if (segments[1] === 'psychanalyse' && newLocale !== 'fr') {
      segments[1] = 'psychoanalysis';
    } else if (segments[1] === 'psychoanalysis' && newLocale === 'fr') {
      segments[1] = 'psychanalyse';
    }

    const qs = searchParams.toString();
    const newPath = '/' + segments.join('/') + (qs ? `?${qs}` : '');
    router.push(newPath);
  };

  return (
    <div
      dir="ltr"
      className="inline-flex items-center gap-1 rounded-xl border border-stone-300/90 dark:border-stone-700 bg-stone-200/75 dark:bg-stone-800/90 p-1 text-xs font-bold shrink-0 overflow-hidden shadow-inner"
      role="group"
      aria-label="انتخاب زبان سایت"
    >
      {LOCALES.map(({ code, label }) => {
        const isActive = code === currentLocale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => handleLocaleChange(code)}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0 transition-all cursor-pointer ${isActive
                ? 'bg-teal-800 text-white font-bold shadow-sm'
                : 'text-stone-700 dark:text-stone-300 hover:bg-stone-300/60 dark:hover:bg-stone-700/70 hover:text-stone-950 dark:hover:text-white'
              }`}
            aria-current={isActive ? 'true' : undefined}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function LanguageSwitcher(props: LanguageSwitcherProps) {
  return (
    <Suspense
      fallback={
        <div
          dir="ltr"
          className="inline-flex items-center gap-1 rounded-xl border border-stone-300/90 dark:border-stone-700 bg-stone-200/75 dark:bg-stone-800/90 p-1 text-xs font-bold shrink-0"
        >
          <span className="px-2.5 py-1">فارسی</span>
        </div>
      }
    >
      <LanguageSwitcherInner {...props} />
    </Suspense>
  );
}
