'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  GraduationCap,
  Globe,
  Mic,
  FileCheck2,
  Film,
  Mail,
  BookOpen,
} from 'lucide-react';
import type { Locale } from '@makaremi/shared';

interface AboutTabNavigatorProps {
  locale: Locale;
  conferenceCount: number;
}

const TAB_TO_SECTION: Record<string, string> = {
  cv: 'cv-universities',
  global: 'global-presence',
  interviews: 'interviews-archive',
  references: 'human-rights-references',
  documentary: 'bio-documentary',
  conferences: 'conferences-archive',
  contact: 'contact-section',
};

function AboutTabNavigatorInner({ locale, conferenceCount }: AboutTabNavigatorProps) {
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>('cv');

  useEffect(() => {
    const tabParam = searchParams.get('tab')?.toLowerCase() || '';
    const sectionId = TAB_TO_SECTION[tabParam];
    if (sectionId) {
      setActiveTab(tabParam);
      const targetEl = document.getElementById(sectionId);
      if (targetEl) {
        setTimeout(() => {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
      }
    }
  }, [searchParams]);

  const items = [
    {
      key: 'cv',
      sectionId: 'cv-universities',
      icon: GraduationCap,
      iconColor: 'text-teal-600',
      label: isFa ? '۱. شرح حال و ۶ دانشگاه' : isFr ? '1. CV & 6 Universités' : '1. Biography & 6 Universities',
    },
    {
      key: 'global',
      sectionId: 'global-presence',
      icon: Globe,
      iconColor: 'text-amber-600',
      label: isFa ? '۲. حضور من در هستی' : isFr ? '2. Présence Mondiale' : '2. Global Presence',
    },
    {
      key: 'interviews',
      sectionId: 'interviews-archive',
      icon: Mic,
      iconColor: 'text-sky-600',
      label: isFa ? '۳. مصاحبه با استاد (۳۴+ گفتگو)' : isFr ? '3. Entretiens (34+)' : '3. Interviews (34+)',
    },
    {
      key: 'references',
      sectionId: 'human-rights-references',
      icon: FileCheck2,
      iconColor: 'text-rose-600',
      label: isFa ? '۴. منابع و اسناد حقوق بشری (۲۷+)' : isFr ? '4. Références (27+)' : '4. Human Rights References (27+)',
    },
    {
      key: 'documentary',
      sectionId: 'bio-documentary',
      icon: Film,
      iconColor: 'text-purple-600',
      label: isFa ? '۵. مستند زندگی‌نامه (۴ قسمت)' : isFr ? '5. Film Biographique' : '5. Biographical Documentary (4 Parts)',
    },
    {
      key: 'conferences',
      sectionId: 'conferences-archive',
      icon: BookOpen,
      iconColor: 'text-indigo-600',
      label: isFa
        ? `۶. کنفرانس‌ها و همایش‌ها (${conferenceCount})`
        : isFr
          ? `6. Conférences (${conferenceCount})`
          : `6. Conferences & Symposia (${conferenceCount})`,
    },
    {
      key: 'contact',
      sectionId: 'contact-section',
      icon: Mail,
      iconColor: 'text-emerald-600',
      label: isFa ? '۷. تماس با استاد' : isFr ? '7. Contact' : '7. Contact',
    },
  ];

  const handleJump = (tabKey: string, sectionId: string) => {
    setActiveTab(tabKey);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav
      aria-label="بخش‌های درباره استاد"
      className="flex flex-wrap items-center gap-2 pt-2"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.key;
        return (
          <a
            key={item.key}
            href={`#${item.sectionId}`}
            onClick={(e) => {
              e.preventDefault();
              handleJump(item.key, item.sectionId);
            }}
            aria-current={isActive ? 'location' : undefined}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
              isActive
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent shadow-xs'
                : 'bg-[var(--surface-sunken)] hover:bg-[var(--surface-card)] border-[var(--border-subtle)] text-[var(--foreground)]'
            }`}
          >
            <Icon size={14} className={isActive ? 'opacity-90' : item.iconColor} />
            <span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

export function AboutTabNavigator(props: AboutTabNavigatorProps) {
  return (
    <Suspense fallback={null}>
      <AboutTabNavigatorInner {...props} />
    </Suspense>
  );
}
