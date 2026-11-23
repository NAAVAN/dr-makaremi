'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Bot,
  FilePlus2,
  FolderPlus,
  KeyRound,
  Languages,
  LayoutDashboard,
  Lock,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import type { AiProviderRuntimeStatus, Locale } from '@makaremi/shared';
import { StudioOverview, type StudioTabId } from './StudioOverview';
import { WorkCreatorWizard } from './WorkCreatorWizard';
import { ArchiveEnricherPanel } from './ArchiveEnricherPanel';
import { TranslationControlRoom } from './TranslationControlRoom';
import { AiAndApiSettingsPanel } from './AiAndApiSettingsPanel';
import { StudioSecurityPanel } from './StudioSecurityPanel';
import { StudioCommercePanel } from './StudioCommercePanel';

interface StudioDashboardShellProps {
  locale: Locale;
  routeMode: 'dashboard' | 'curation-studio';
  initialAiStatus: AiProviderRuntimeStatus;
}

export function StudioDashboardShell({
  locale,
  routeMode,
  initialAiStatus,
}: StudioDashboardShellProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<StudioTabId>('overview');
  const [fontScale, setFontScale] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [stats, setStats] = useState<{
    totalWorks: number;
    trilingualComplete: number;
    missingAnyLocale: number;
    enrichedWorks: number;
    byCollection: Record<string, number>;
  } | null>(null);
  const [manualQueueCount, setManualQueueCount] = useState(0);
  const [localDraftsCount, setLocalDraftsCount] = useState(0);
  const [aiStatus, setAiStatus] = useState<AiProviderRuntimeStatus | null>(initialAiStatus);

  const refreshOverviewStats = useCallback(async () => {
    try {
      const res = await fetch('/api/studio/works?page=1&pageSize=1');
      const data = await res.json();
      if (res.ok && data.ok) {
        setStats(data.stats || null);
        setManualQueueCount(data.manualQueueCount || 0);
      }
    } catch {
      // ignore transient errors
    }
  }, []);

  useEffect(() => {
    refreshOverviewStats();
  }, [refreshOverviewStats]);

  const handleLockWorkspace = async () => {
    await fetch('/api/studio/auth', { method: 'DELETE' }).catch(() => { });
    router.refresh();
  };

  const navItems: Array<{
    id: StudioTabId;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }> = [
      { id: 'overview', label: 'خانه پیشخوان', icon: LayoutDashboard },
      { id: 'create', label: 'ثبت اثر جدید', icon: FilePlus2 },
      { id: 'enrich', label: 'تکمیل آثار پیشین', icon: FolderPlus },
      { id: 'translations', label: 'کنترل و ویرایش ترجمه‌ها', icon: Languages },
      { id: 'commerce', label: 'فروشگاه و سفارش‌ها', icon: ShoppingBag },
      { id: 'ai_system', label: 'موتور هوشمند و صف ترجمه', icon: Bot },
      { id: 'security', label: 'تغییر پین و کلید', icon: KeyRound },
    ];

  const baseFontPx = fontScale === 'xlarge' ? '18px' : fontScale === 'large' ? '16px' : '15px';

  return (
    <div
      id="makaremi-atelier-dashboard"
      dir="rtl"
      style={{ fontSize: baseFontPx }}
      className="min-h-screen bg-[var(--surface-canvas)] text-[var(--foreground)] pb-16"
    >
      <style>{`
        header:not(#studio-shell-header),
        footer {
          display: none !important;
        }
        main {
          max-width: 100% !important;
          padding: 0 !important;
          margin: 0 !important;
        }
      `}</style>

      {/* Top Sticky Studio Bar */}
      <header
        id="studio-shell-header"
        className="sticky top-0 z-40 bg-[var(--surface-card)] border-b border-[var(--border-subtle)] shadow-[var(--shadow-sm)]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--primary)] font-bold">
              <ShieldCheck size={14} />
              <span>
                {routeMode === 'dashboard'
                  ? 'پیشخوان رسمی و دائمی استاد دکتر حسن مکارمی'
                  : 'آتلیه نشر و بازنگری آثار استاد دکتر حسن مکارمی'}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-[var(--foreground)] tracking-tight">
              پیشخوان هوشمند مدیریت محتوا، رسانه و کنترل ترجمه‌ها
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Eye Comfort Font Size Switcher */}
            <div
              role="group"
              aria-label="اندازه قلم"
              className="inline-flex items-center rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-1 text-xs font-bold"
            >
              {(
                [
                  { id: 'normal', label: 'عادی' },
                  { id: 'large', label: 'درشت' },
                  { id: 'xlarge', label: 'بسیار درشت' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFontScale(f.id)}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${fontScale === f.id
                      ? 'bg-[var(--surface-card)] text-[var(--foreground)] shadow-sm'
                      : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <Link
              href={`/${locale}`}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] hover:border-[var(--primary)] text-xs font-bold text-[var(--foreground)]"
            >
              <ArrowRight size={14} />
              <span>مشاهده سایت</span>
            </Link>

            <button
              type="button"
              onClick={handleLockWorkspace}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] hover:border-red-500 text-xs font-bold text-[var(--foreground)] hover:text-red-600 transition-colors"
            >
              <Lock size={14} />
              <span>قفل و خروج</span>
            </button>
          </div>
        </div>

        {/* Navigation Workspace Tabs */}
        <nav
          aria-label="بخش‌های پیشخوان استاد"
          className="max-w-7xl mx-auto px-4 sm:px-6 pb-3 flex items-center gap-2 overflow-x-auto"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`min-h-[42px] shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold border transition-colors ${active
                    ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'bg-[var(--surface-sunken)] border-[var(--border-subtle)] text-[var(--foreground)] hover:border-[var(--primary)]'
                  }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {activeTab === 'overview' && (
          <StudioOverview
            locale={locale}
            stats={stats}
            localDraftsCount={localDraftsCount}
            manualQueueCount={manualQueueCount}
            aiStatus={aiStatus}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'create' && (
          <WorkCreatorWizard
            aiStatus={aiStatus}
            onDraftsCountChange={setLocalDraftsCount}
            onPublishedSuccess={refreshOverviewStats}
          />
        )}

        {activeTab === 'enrich' && (
          <ArchiveEnricherPanel onEnrichedSuccess={refreshOverviewStats} />
        )}

        {activeTab === 'translations' && (
          <TranslationControlRoom onTranslationSaved={refreshOverviewStats} />
        )}

        {activeTab === 'commerce' && <StudioCommercePanel />}

        {activeTab === 'ai_system' && (
          <AiAndApiSettingsPanel onStatusUpdated={setAiStatus} />
        )}

        {activeTab === 'security' && <StudioSecurityPanel />}
      </div>
    </div>
  );
}
