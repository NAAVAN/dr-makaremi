'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import type { Locale } from '@makaremi/shared';

interface ThemeToggleProps {
  locale?: Locale;
}

export function ThemeToggle({ locale = 'fa' }: ThemeToggleProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('makaremi_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = stored === 'dark' || (!stored && prefersDark) ? 'dark' : 'light';
    setTheme(initial);
    if (initial === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('makaremi_theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle Theme"
        className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--foreground-muted)] hover:bg-[var(--surface-sunken)] transition-colors"
      >
        <span className="w-4 h-4" />
      </button>
    );
  }

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const toDark = isFa ? 'تغییر به حالت تاریک' : isFr ? 'Activer le mode sombre' : 'Switch to dark mode';
  const toLight = isFa ? 'تغییر به حالت روشن' : isFr ? 'Activer le mode clair' : 'Switch to light mode';
  const titleDark = isFa ? 'حالت شب' : isFr ? 'Mode sombre' : 'Dark mode';
  const titleLight = isFa ? 'حالت روز' : isFr ? 'Mode clair' : 'Light mode';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'light' ? toDark : toLight}
      title={theme === 'light' ? titleDark : titleLight}
      className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-sunken)] transition-colors border border-[var(--border-subtle)] cursor-pointer"
    >
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
