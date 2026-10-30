'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Star,
  Trash2,
  Edit3,
  PlusCircle,
  Search,
  Download,
  Send,
  BookOpen,
  Palette,
  Feather,
  Video,
  FileText,
  Archive,
  Bot,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Volume2,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import { VoiceRecorderWidget, type RecordedAudioAsset } from './VoiceRecorderWidget';
import { BookMediaAssetsUploader, type Book3DAssetsSpec } from './BookMediaAssetsUploader';
import { AddNewWorkModal, type CustomAddedWork, type NewWorkType } from './AddNewWorkModal';
import { AiAssistantDemoAndApproval, type AuthAndAiPolicyState } from './AiAssistantDemoAndApproval';

export type ItemDecisionStatus = 'keep' | 'featured' | 'edit' | 'delete';

export interface ItemCurationDecision {
  status: ItemDecisionStatus;
  customCategory?: string;
  comment?: string;
  editorialVoiceNote?: RecordedAudioAsset | null;
  siteIntroAudio?: RecordedAudioAsset | null;
  book3DSpec?: Book3DAssetsSpec;
}

export interface PersonalArchiveQuestionnaire {
  hasHighResArtworksOffline: 'yes_full' | 'yes_partial' | 'only_on_website' | 'need_to_check';
  highResArtworksLocationNote: string;
  hasOriginalBookPdfsOffline: 'yes_full' | 'yes_with_publishers' | 'only_on_website';
  originalBookFilesNote: string;
  hasArticlesAndPoemsOffline: 'yes_organized' | 'yes_scattered' | 'only_on_website';
  hasNewWorks2017To2026: boolean;
  newBooks2017To2026Note: string;
  newExhibitions2017To2026Note: string;
  newArticlesPoemsVideosNote: string;
  archiveDeliveryMethod: 'upload_here' | 'google_drive_link' | 'email_or_whatsapp' | 'coordinator_contact';
  sharedArchiveLinksOrContact: string;
  generalArchiveVoiceNote?: RecordedAudioAsset | null;
  // Macro Architecture Decisions
  approveSixPillarsMenu: boolean;
  separateNewsFromScholarlyArticles: boolean;
  preserveLegacyReaderComments: boolean;
  delete19TestJunkItems: boolean;
  macroArchitectureComment: string;
}

interface CatalogData {
  generatedAt: string;
  stats: {
    totalXmlItems: number;
    booksCount: number;
    galleriesCount: number;
    totalArtworksInGalleries: number;
    poemsCount: number;
    videosCount: number;
    postsCount: number;
    pagesCount: number;
    pdfsCount: number;
    imagesCount: number;
    commentsCount: number;
  };
  books: any[];
  galleries: any[];
  poems: any[];
  videos: any[];
  posts: any[];
  pages: any[];
  pdfs: any[];
}

const STORAGE_KEY = 'makaremi_curation_studio_v1';

export function CurationStudioClient({ catalog }: { catalog: CatalogData }) {
  const [activeTab, setActiveTab] = useState<
    'archive_macro' | 'ai_and_auth' | 'books' | 'art_exhibitions' | 'poems_videos' | 'articles_pdfs' | 'cleanup_submit'
  >('archive_macro');

  const [fontScale, setFontScale] = useState<'normal' | 'large' | 'xlarge'>('large');
  const [searchQuery, setSearchQuery] = useState('');
  const [langFilter, setLangFilter] = useState<'all' | 'fa' | 'fr' | 'en'>('all');
  const [subFilter, setSubFilter] = useState<string>('all');

  // Sub-tab toggles
  const [artSubTab, setArtSubTab] = useState<'galleries' | 'exhibitions'>('galleries');
  const [poemVideoSubTab, setPoemVideoSubTab] = useState<'poems' | 'videos'>('poems');
  const [articleSubTab, setArticleSubTab] = useState<'scholarly' | 'news' | 'conferences' | 'pdfs'>('scholarly');

  // Expanded item IDs for detailed panels
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  // Add New Work Modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalDefaultType, setAddModalDefaultType] = useState<NewWorkType>('book');

  // Persistent Curation State
  const [questionnaire, setQuestionnaire] = useState<PersonalArchiveQuestionnaire>({
    hasHighResArtworksOffline: 'yes_partial',
    highResArtworksLocationNote: '',
    hasOriginalBookPdfsOffline: 'yes_full',
    originalBookFilesNote: '',
    hasArticlesAndPoemsOffline: 'yes_organized',
    hasNewWorks2017To2026: true,
    newBooks2017To2026Note: '',
    newExhibitions2017To2026Note: '',
    newArticlesPoemsVideosNote: '',
    archiveDeliveryMethod: 'upload_here',
    sharedArchiveLinksOrContact: '',
    approveSixPillarsMenu: true,
    separateNewsFromScholarlyArticles: true,
    preserveLegacyReaderComments: true,
    delete19TestJunkItems: true,
    macroArchitectureComment: '',
  });

  const [authAndAiPolicy, setAuthAndAiPolicy] = useState<AuthAndAiPolicyState>({
    authMode: 'public_members',
    allowMemberBookmarks: true,
    allowModeratedComments: true,
    requireLoginForPdfDownload: false,
    allowEventRegistration: true,
    authComment: '',
    aiApprovalStatus: 'approved_full',
    aiCapabilities: {
      lacanianPsychoanalysis: true,
      hafezAndMythology: true,
      artAndCalligraphyCurator: true,
      trilingualScholarlyBridge: true,
      bookAndArchiveNavigator: true,
      strictCitationGuardrail: true,
    },
    aiPlacement: 'floating_everywhere',
    aiComment: '',
  });

  const [decisions, setDecisions] = useState<Record<string, ItemCurationDecision>>({});
  const [customAddedWorks, setCustomAddedWorks] = useState<CustomAddedWork[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<string>('');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Load saved state from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.questionnaire) setQuestionnaire(parsed.questionnaire);
        if (parsed.authAndAiPolicy) setAuthAndAiPolicy(parsed.authAndAiPolicy);
        if (parsed.decisions) setDecisions(parsed.decisions);
        if (parsed.customAddedWorks) setCustomAddedWorks(parsed.customAddedWorks);
      }
    } catch {
      // ignore
    }
  }, []);

  // Auto-save whenever state changes
  useEffect(() => {
    try {
      const payload = {
        updatedAt: new Date().toISOString(),
        questionnaire,
        authAndAiPolicy,
        decisions,
        customAddedWorks,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setLastSavedAt(new Date().toLocaleTimeString('fa-IR'));
    } catch {
      // ignore quota errors
    }
  }, [questionnaire, authAndAiPolicy, decisions, customAddedWorks]);

  const getDecision = (key: string, defaultStatus: ItemDecisionStatus = 'keep'): ItemCurationDecision => {
    return decisions[key] || { status: defaultStatus };
  };

  const updateDecision = (
    key: string,
    patch: Partial<ItemCurationDecision>,
    defaultStatus: ItemDecisionStatus = 'keep'
  ) => {
    setDecisions((prev) => {
      const current = prev[key] || { status: defaultStatus };
      return {
        ...prev,
        [key]: { ...current, ...patch },
      };
    });
  };

  const toggleExpand = (key: string) => {
    setExpandedIds((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openAddWorkModal = (type: NewWorkType) => {
    setAddModalDefaultType(type);
    setAddModalOpen(true);
  };

  const handleExportManifest = async () => {
    setSubmitStatus('saving');
    const manifest = {
      exportedAt: new Date().toISOString(),
      platform: 'Dr. Hassan Makaremi Official Curation & Archive Studio',
      summaryCounts: {
        customAddedWorksCount: customAddedWorks.length,
        modifiedDecisionsCount: Object.keys(decisions).length,
      },
      questionnaire,
      authAndAiPolicy,
      customAddedWorks,
      itemDecisions: decisions,
    };

    try {
      await fetch('/api/curation-manifest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manifest),
      });
    } catch {
      // continue to client download even if offline
    }

    const blob = new Blob([JSON.stringify(manifest, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `makaremi-curation-decisions-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSubmitStatus('saved');
  };

  // Filtered lists
  const filteredBooks = useMemo(() => {
    return catalog.books.filter((b) => {
      if (langFilter !== 'all' && b.lang !== langFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          b.title.toLowerCase().includes(q) ||
          (b.subtitle || '').toLowerCase().includes(q) ||
          (b.publisher || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [catalog.books, langFilter, searchQuery]);

  const filteredGalleries = useMemo(() => {
    return catalog.galleries.filter((g) => {
      if (g.isTest) return false;
      if (langFilter !== 'all' && g.lang !== langFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return g.title.toLowerCase().includes(q) || (g.statement || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [catalog.galleries, langFilter, searchQuery]);

  const exhibitionPages = useMemo(() => {
    return catalog.pages.filter((p) => {
      if (p.pageGroup !== 'exhibition' || p.isTest) return false;
      if (langFilter !== 'all' && p.lang !== langFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return p.title.toLowerCase().includes(q) || (p.excerpt || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [catalog.pages, langFilter, searchQuery]);

  const filteredPoems = useMemo(() => {
    return catalog.poems.filter((p) => {
      if (langFilter !== 'all' && p.lang !== langFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return p.title.toLowerCase().includes(q) || (p.excerpt || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [catalog.poems, langFilter, searchQuery]);

  const filteredVideos = useMemo(() => {
    return catalog.videos.filter((v) => {
      if (langFilter !== 'all' && v.lang !== langFilter) return false;
      if (subFilter !== 'all' && !v.themes.includes(subFilter)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          v.title.toLowerCase().includes(q) ||
          (v.description || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [catalog.videos, langFilter, subFilter, searchQuery]);

  const scholarlyPosts = useMemo(() => {
    return catalog.posts.filter((p) => {
      if (p.isTest || p.suggestedSection !== 'scholarly_article') return false;
      if (langFilter !== 'all' && p.lang !== langFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return p.title.toLowerCase().includes(q) || (p.excerpt || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [catalog.posts, langFilter, searchQuery]);

  const newsPosts = useMemo(() => {
    return catalog.posts.filter((p) => {
      if (p.isTest || p.suggestedSection !== 'news') return false;
      if (langFilter !== 'all' && p.lang !== langFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return p.title.toLowerCase().includes(q) || (p.excerpt || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [catalog.posts, langFilter, searchQuery]);

  const conferenceAndInterviewPages = useMemo(() => {
    return catalog.pages.filter((p) => {
      if (p.isTest || !['conference', 'interview_press', 'cv_biography'].includes(p.pageGroup))
        return false;
      if (langFilter !== 'all' && p.lang !== langFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return p.title.toLowerCase().includes(q) || (p.excerpt || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [catalog.pages, langFilter, searchQuery]);

  const testAndJunkItems = useMemo(() => {
    const jPosts = catalog.posts.filter((p) => p.isTest).map((p) => ({ ...p, entityType: 'post' }));
    const jPages = catalog.pages.filter((p) => p.isTest).map((p) => ({ ...p, entityType: 'page' }));
    const jGalleries = catalog.galleries
      .filter((g) => g.isTest)
      .map((g) => ({ ...g, entityType: 'mk_tabl' }));
    return [...jPosts, ...jPages, ...jGalleries];
  }, [catalog]);

  const fontSizeClass =
    fontScale === 'xlarge'
      ? 'text-lg leading-relaxed'
      : fontScale === 'large'
      ? 'text-base leading-relaxed'
      : 'text-sm leading-normal';

  const renderDecisionButtons = (
    itemKey: string,
    defaultStatus: ItemDecisionStatus = 'keep'
  ) => {
    const dec = getDecision(itemKey, defaultStatus);
    const buttons: { val: ItemDecisionStatus; label: string; icon: React.ReactNode; activeCls: string }[] = [
      {
        val: 'keep',
        label: '✅ حفظ و انتشار',
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        activeCls: 'bg-emerald-600 text-white border-emerald-700 shadow-sm',
      },
      {
        val: 'featured',
        label: '⭐ برگزیده (ویترین اول)',
        icon: <Star className="w-3.5 h-3.5" />,
        activeCls: 'bg-amber-600 text-white border-amber-700 shadow-sm',
      },
      {
        val: 'edit',
        label: '✏️ نیاز به اصلاح / بازبینی',
        icon: <Edit3 className="w-3.5 h-3.5" />,
        activeCls: 'bg-blue-600 text-white border-blue-700 shadow-sm',
      },
      {
        val: 'delete',
        label: '🗑️ حذف از سایت جدید',
        icon: <Trash2 className="w-3.5 h-3.5" />,
        activeCls: 'bg-red-600 text-white border-red-700 shadow-sm',
      },
    ];

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {buttons.map((b) => (
          <button
            key={b.val}
            type="button"
            onClick={() => updateDecision(itemKey, { status: b.val }, defaultStatus)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              dec.status === b.val
                ? b.activeCls
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div dir="rtl" className={`min-h-screen bg-[#FAF7F2] text-slate-900 pb-24 ${fontSizeClass}`}>
      {/* =====================================================================
          TOP STICKY HEADER FOR DR. MAKAREMI
         ===================================================================== */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-amber-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-amber-800">
                پورتال اختصاصی استاد دکتر حسن مکارمی • ذخیره خودکار فعال {lastSavedAt && `(${lastSavedAt})`}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
              میز کار تعاملی بازنگری محتوا، تکمیل آرشیو و تصمیم‌گیری سایت جدید
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Font size selector */}
            <div className="inline-flex items-center bg-slate-100 border border-slate-300 rounded-xl p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFontScale('normal')}
                className={`px-2 py-1 rounded-lg ${
                  fontScale === 'normal' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontScale('large')}
                className={`px-2 py-1 rounded-lg ${
                  fontScale === 'large' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => setFontScale('xlarge')}
                className={`px-2 py-1 rounded-lg ${
                  fontScale === 'xlarge' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                A++
              </button>
            </div>

            {/* Unlimited Add New Work Button */}
            <button
              type="button"
              onClick={() => openAddWorkModal('book')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-teal-700 hover:bg-teal-800 text-white shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>افزودن اثر جدید (نامحدود)</span>
            </button>

            {/* Export / Submit Manifest Button */}
            <button
              type="button"
              onClick={handleExportManifest}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-amber-600 hover:bg-amber-700 text-white shadow-md transition"
            >
              <Download className="w-4 h-4" />
              <span>
                {submitStatus === 'saved'
                  ? '✅ ثبت و دانلود شد (دانلود مجدد)'
                  : 'ثبت نهایی و دریافت فایل تصمیمات استاد'}
              </span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 pb-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            {[
              {
                id: 'archive_macro' as const,
                label: '۱. آرشیو شخصی و تصمیمات کلان',
                icon: <FolderOpen className="w-4 h-4" />,
                badge: 'شروع',
              },
              {
                id: 'ai_and_auth' as const,
                label: '۲. دستیار هوشمند (دموی زنده) و مجوز ورود',
                icon: <Bot className="w-4 h-4" />,
                badge: 'ویژه',
              },
              {
                id: 'books' as const,
                label: '۳. کتاب‌ها، جلد ۳بعدی و صدای استاد',
                icon: <BookOpen className="w-4 h-4" />,
                badge: `${catalog.stats.booksCount}`,
              },
              {
                id: 'art_exhibitions' as const,
                label: '۴. گالری‌ها (۱٬۳۹۰ تابلو) و ۲۷ نمایشگاه',
                icon: <Palette className="w-4 h-4" />,
                badge: `${catalog.stats.galleriesCount}`,
              },
              {
                id: 'poems_videos' as const,
                label: '۵. اشعار مصور (۳۰۱) و ویدئوها (۲۶۲)',
                icon: <Feather className="w-4 h-4" />,
                badge: `${catalog.stats.poemsCount + catalog.stats.videosCount}`,
              },
              {
                id: 'articles_pdfs' as const,
                label: '۶. مقالات، کنفرانس‌ها و ۵۱ سند PDF',
                icon: <FileText className="w-4 h-4" />,
                badge: `${catalog.stats.postsCount}`,
              },
              {
                id: 'cleanup_submit' as const,
                label: '۷. پالایش موارد تستی و ارسال نهایی',
                icon: <Send className="w-4 h-4" />,
                badge: `${customAddedWorks.length > 0 ? `+${customAddedWorks.length}` : 'نهایی'}`,
              },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setActiveTab(t.id);
                  setSearchQuery('');
                  setSubFilter('all');
                }}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition border ${
                  activeTab === t.id
                    ? 'bg-slate-900 text-amber-300 border-slate-900 shadow-sm'
                    : 'bg-stone-100 text-slate-700 border-stone-200 hover:bg-stone-200'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    activeTab === t.id
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-white text-slate-600'
                  }`}
                >
                  {t.badge}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* =====================================================================
          MAIN WORKSPACE CONTAINER
         ===================================================================== */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        {/* Welcome Banner & Approve-by-Default explanation */}
        <div className="rounded-3xl bg-gradient-to-l from-slate-900 via-slate-800 to-teal-950 text-white p-5 mb-6 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-300 bg-white/10 px-3 py-1 rounded-full mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>راهنمای سریع برای استاد دکتر حسن مکارمی</span>
              </div>
              <h2 className="text-lg font-extrabold text-white">
                تمامی ۳٬۱۷۲ رکورد سایت وردپرس شما استخراج و به صورت «تاییدشده پیش‌فرض» در این میز کار بارگذاری شده است.
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed">
                نیازی نیست تک‌تک ۱٬۱۰۰ اثر را تیک بزنید! همه آثار معتبر شما به صورت پیش‌فرض روی <strong>«✅ حفظ و انتشار»</strong> تنظیم شده‌اند. تنها کافی است سؤالات کلان را تیک بزنید، هر جا مایل بودید <strong>صدای خودتان را برای معرفی آثار ضبط کنید</strong>، <strong>تصاویر جلد رو/پشت/عطف و صفحات برگزیده کتاب‌ها</strong> را بارگذاری نمایید، و اگر اثر جدیدی دارید با دکمه <strong>«افزودن اثر جدید»</strong> اضافه فرمایید.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center shrink-0">
              <div className="bg-white/10 rounded-2xl px-3 py-2 border border-white/10">
                <div className="text-lg font-black text-amber-300">{catalog.stats.booksCount}</div>
                <div className="text-[11px] text-slate-300">کتاب و رساله</div>
              </div>
              <div className="bg-white/10 rounded-2xl px-3 py-2 border border-white/10">
                <div className="text-lg font-black text-amber-300">۱٬۳۹۰</div>
                <div className="text-[11px] text-slate-300">تابلو در ۵۵ گالری</div>
              </div>
              <div className="bg-white/10 rounded-2xl px-3 py-2 border border-white/10">
                <div className="text-lg font-black text-amber-300">{catalog.stats.poemsCount}</div>
                <div className="text-[11px] text-slate-300">شعر مصور</div>
              </div>
              <div className="bg-white/10 rounded-2xl px-3 py-2 border border-white/10">
                <div className="text-lg font-black text-amber-300">
                  {catalog.stats.postsCount + catalog.stats.videosCount}
                </div>
                <div className="text-[11px] text-slate-300">مقاله و ویدئو</div>
              </div>
            </div>
          </div>
        </div>

        {/* Newly Added Custom Works Banner (if any added by Dr. Makaremi) */}
        {customAddedWorks.length > 0 && (
          <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50/90 p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h3 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                آثار جدید اضافه‌شده توسط استاد در این میز کار ({customAddedWorks.length} اثر):
              </h3>
              <button
                type="button"
                onClick={() => openAddWorkModal('book')}
                className="text-xs font-bold bg-emerald-700 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-800"
              >
                + افزودن اثر جدید دیگر
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {customAddedWorks.map((cw) => (
                <div
                  key={cw.id}
                  className="bg-white rounded-xl border border-emerald-200 p-3 flex items-start justify-between gap-2"
                >
                  <div>
                    <span className="inline-block text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded mb-1">
                      {cw.workType.toUpperCase()} • {cw.year} • {cw.category}
                    </span>
                    <div className="text-xs font-extrabold text-slate-900">
                      {cw.titleFa || cw.titleFr}
                    </div>
                    {cw.authorSiteAudio && (
                      <div className="text-[11px] text-amber-700 font-bold mt-1">
                        🎙️ دارای صدای ضبط‌شده استاد
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setCustomAddedWorks((prev) => prev.filter((x) => x.id !== cw.id))
                    }
                    className="text-red-500 hover:text-red-700 p-1"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 1: PERSONAL ARCHIVE DISCOVERY & MACRO ARCHITECTURE DECISIONS
           =================================================================== */}
        {activeTab === 'archive_macro' && (
          <div className="space-y-6">
            {/* Module 1A: Personal Archive Discovery */}
            <div className="rounded-3xl border-2 border-amber-300 bg-white p-6 shadow-sm">
              <div className="border-b border-slate-200 pb-4 mb-5">
                <span className="inline-block text-xs font-bold bg-amber-100 text-amber-900 px-3 py-0.5 rounded-full mb-1">
                  بخش اول: وضعیت آرشیو شخصی استاد و آثار سال‌های ۲۰۱۷ تا ۲۰۲۶
                </span>
                <h2 className="text-xl font-extrabold text-slate-900">
                  آیا آثار فقط در سایت وردپرس ذخیره شده‌اند یا آرشیو شخصی هم دارید؟
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  پاسخ شما به این ۴ سؤال مشخص می‌کند که آیا برای ساخت سایت جدید فقط به فایل‌های داخل سایت قدیم تکیه کنیم یا فایل‌های باکیفیت‌تر و جدیدتری هم نزد شما موجود است.
                </p>
              </div>

              <div className="space-y-6">
                {/* Q1: High-res Artworks */}
                <div className="rounded-2xl bg-stone-50 border border-stone-200 p-4">
                  <h3 className="text-sm font-extrabold text-slate-900 mb-3">
                    ۱. وضعیت تصاویر اصلی تابلوهای خوشنویسی و نقاشی (۱٬۳۹۰ اثر):
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-3">
                    {[
                      {
                        val: 'yes_full',
                        label: '✅ بله، آرشیو کامل و باکیفیت (High-Res) عکس تابلوها را در کامپیوتر / هارد شخصی دارم',
                      },
                      {
                        val: 'yes_partial',
                        label: '📂 بخشی از تصاویر باکیفیت را در کامپیوتر یا حساب Flickr دارم و بقیه فقط در سایت است',
                      },
                      {
                        val: 'only_on_website',
                        label: '🌐 خیر، تصاویر فقط در همین سایت وردپرس ذخیره شده‌اند و همان‌ها مبنا باشد',
                      },
                      {
                        val: 'need_to_check',
                        label: '🔍 باید هارد شخصی و پوشه‌هایم را بررسی کنم و اطلاع دهم',
                      },
                    ].map((opt) => (
                      <label
                        key={opt.val}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer text-xs font-bold ${
                          questionnaire.hasHighResArtworksOffline === opt.val
                            ? 'border-amber-600 bg-amber-50 text-slate-900'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          checked={questionnaire.hasHighResArtworksOffline === opt.val}
                          onChange={() =>
                            setQuestionnaire({
                              ...questionnaire,
                              hasHighResArtworksOffline:
                                opt.val as PersonalArchiveQuestionnaire['hasHighResArtworksOffline'],
                            })
                          }
                          className="w-4 h-4 accent-amber-600"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={questionnaire.highResArtworksLocationNote}
                    onChange={(e) =>
                      setQuestionnaire({
                        ...questionnaire,
                        highResArtworksLocationNote: e.target.value,
                      })
                    }
                    placeholder="💬 توضیح تکمیلی استاد (مثلاً لینک فلیکر، گوگل‌درایو یا نام پوشه‌های آثار جدید)..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 bg-white"
                  />
                </div>

                {/* Q2: Original Book PDFs & Covers */}
                <div className="rounded-2xl bg-stone-50 border border-stone-200 p-4">
                  <h3 className="text-sm font-extrabold text-slate-900 mb-3">
                    ۲. وضعیت فایل‌های PDF/Word کتاب‌ها و طرح جلد (رو، پشت و عطف):
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-3">
                    {[
                      {
                        val: 'yes_full',
                        label: '✅ بله، فایل PDF/Word و طرح جلد کتاب‌ها را در آرشیو شخصی دارم',
                      },
                      {
                        val: 'yes_with_publishers',
                        label: '📚 بخشی را دارم و بخشی نزد ناشران (L’Harmattan, H&S, پردیس دانش و...) است',
                      },
                      {
                        val: 'only_on_website',
                        label: '🌐 فقط همان ۱۲ فایل PDF و تصاویر جلدی که در سایت قدیم هست موجود است',
                      },
                    ].map((opt) => (
                      <label
                        key={opt.val}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer text-xs font-bold ${
                          questionnaire.hasOriginalBookPdfsOffline === opt.val
                            ? 'border-amber-600 bg-amber-50 text-slate-900'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          checked={questionnaire.hasOriginalBookPdfsOffline === opt.val}
                          onChange={() =>
                            setQuestionnaire({
                              ...questionnaire,
                              hasOriginalBookPdfsOffline:
                                opt.val as PersonalArchiveQuestionnaire['hasOriginalBookPdfsOffline'],
                            })
                          }
                          className="w-4 h-4 accent-amber-600"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={questionnaire.originalBookFilesNote}
                    onChange={(e) =>
                      setQuestionnaire({
                        ...questionnaire,
                        originalBookFilesNote: e.target.value,
                      })
                    }
                    placeholder="💬 یادداشت استاد درباره فایل‌های کتاب‌ها یا کتاب‌های در دست چاپ..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 bg-white"
                  />
                </div>

                {/* Q3: Works from 2017 to 2026 missing from old WordPress */}
                <div className="rounded-2xl bg-amber-50/70 border-2 border-amber-300 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h3 className="text-sm font-extrabold text-slate-900">
                      ۳. آثار، کتاب‌ها، نمایشگاه‌ها و مقالات جدید سال‌های ۲۰۱۷ تا ۲۰۲۶ (که در سایت قدیم وارد نشده‌اند):
                    </h3>
                    <button
                      type="button"
                      onClick={() => openAddWorkModal('book')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-600 text-white hover:bg-amber-700 shadow-sm"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>افزودن مستقیم آثار جدید در همین اپ</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        📚 کتاب‌های منتشرشده پس از ۲۰۱۷:
                      </label>
                      <textarea
                        rows={3}
                        value={questionnaire.newBooks2017To2026Note}
                        onChange={(e) =>
                          setQuestionnaire({
                            ...questionnaire,
                            newBooks2017To2026Note: e.target.value,
                          })
                        }
                        placeholder="نام کتاب‌های جدیدی که پس از «آسیب‌شناسی ازهم‌گسستگی (۲۰۱۷)» منتشر کرده‌اید..."
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        🏛️ نمایشگاه‌های برگزارشده پس از ۲۰۱۶:
                      </label>
                      <textarea
                        rows={3}
                        value={questionnaire.newExhibitions2017To2026Note}
                        onChange={(e) =>
                          setQuestionnaire({
                            ...questionnaire,
                            newExhibitions2017To2026Note: e.target.value,
                          })
                        }
                        placeholder="نمایشگاه‌های پس از نمایشگاه ایروان ۲۰۱۶ (شهر، سال، عنوان)..."
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        🎬 مقالات، اشعار و ویدئوهای جدید:
                      </label>
                      <textarea
                        rows={3}
                        value={questionnaire.newArticlesPoemsVideosNote}
                        onChange={(e) =>
                          setQuestionnaire({
                            ...questionnaire,
                            newArticlesPoemsVideosNote: e.target.value,
                          })
                        }
                        placeholder="کانال یوتیوب، اینستاگرام، تلگرام یا پوشه مقالات سال‌های اخیر..."
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <VoiceRecorderWidget
                      itemId="archive-discovery"
                      itemTitle="توضیح صوتی استاد درباره آرشیو شخصی و آثار جدید"
                      mode="editorial_note"
                      existingAudio={questionnaire.generalArchiveVoiceNote}
                      onSaveAudio={(audio) =>
                        setQuestionnaire({ ...questionnaire, generalArchiveVoiceNote: audio })
                      }
                      onTranscriptAppended={(txt) =>
                        setQuestionnaire({
                          ...questionnaire,
                          newArticlesPoemsVideosNote: questionnaire.newArticlesPoemsVideosNote
                            ? `${questionnaire.newArticlesPoemsVideosNote}\n${txt}`
                            : txt,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Module 1B: Macro Architecture & Taxonomy Checkboxes */}
            <div className="rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm">
              <span className="inline-block text-xs font-bold bg-teal-100 text-teal-900 px-3 py-0.5 rounded-full mb-1">
                بخش دوم: تصمیم‌های کلان دسته‌بندی و ساختار سایت جدید
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mb-4">
                تایید ساختار منوها و دسته‌بندی کلان محتوا (فقط با تیک زدن)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <label className="flex items-start gap-3 p-4 rounded-2xl border-2 border-slate-200 bg-stone-50/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={questionnaire.approveSixPillarsMenu}
                    onChange={(e) =>
                      setQuestionnaire({
                        ...questionnaire,
                        approveSixPillarsMenu: e.target.checked,
                      })
                    }
                    className="mt-1 w-5 h-5 accent-teal-700 rounded shrink-0"
                  />
                  <div>
                    <div className="text-sm font-extrabold text-slate-900">
                      ۱. تایید ساختار محورهای اصلی منوی سایت (فارسی، فرانسوی و انگلیسی)
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      محورها شامل: <strong>روانکاوی لکانی</strong> • <strong>حافظ‌پژوهی</strong> • <strong>هنر (گالری‌ها و نمایشگاه‌ها)</strong> • <strong>شعر و ادبیات</strong> • <strong>پژوهش، جامعه و راهبرد</strong> • <strong>کتاب‌ها (با استودیوی ۳بعدی)</strong> • <strong>فیلم و رسانه</strong> • <strong>درباره استاد و تماس</strong>.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-2xl border-2 border-slate-200 bg-stone-50/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={questionnaire.separateNewsFromScholarlyArticles}
                    onChange={(e) =>
                      setQuestionnaire({
                        ...questionnaire,
                        separateNewsFromScholarlyArticles: e.target.checked,
                      })
                    }
                    className="mt-1 w-5 h-5 accent-teal-700 rounded shrink-0"
                  />
                  <div>
                    <div className="text-sm font-extrabold text-slate-900">
                      ۲. تفکیک «۲۸۴ خبر و گزارش رویداد» از «۲۰۳ مقاله علمی و پژوهشی»
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      در سایت قدیم خبرهای کوتاه نمایشگاهی با مقالات علمی در یک فهرست مخلوط می‌شدند. با این تیک، اخبار در بخش مستقل «اخبار و رویدادها» آرشیو می‌شوند تا تالار مقالات کاملاً علمی بماند.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-2xl border-2 border-slate-200 bg-stone-50/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={questionnaire.preserveLegacyReaderComments}
                    onChange={(e) =>
                      setQuestionnaire({
                        ...questionnaire,
                        preserveLegacyReaderComments: e.target.checked,
                      })
                    }
                    className="mt-1 w-5 h-5 accent-teal-700 rounded shrink-0"
                  />
                  <div>
                    <div className="text-sm font-extrabold text-slate-900">
                      ۳. حفظ و انتقال ۴۵ دیدگاه علمی مخاطبان و پاسخ‌های استاد از سایت قدیم
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      در پای مقالات حافظ، شاهنامه و ارزش‌ها، ۴۵ دیدگاه ارزشمند (شامل پاسخ‌های مستقیم استاد مکارمی) ثبت شده است که در انتهای همان مقالات در سایت جدید حفظ خواهند شد.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-2xl border-2 border-slate-200 bg-stone-50/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={questionnaire.delete19TestJunkItems}
                    onChange={(e) =>
                      setQuestionnaire({
                        ...questionnaire,
                        delete19TestJunkItems: e.target.checked,
                      })
                    }
                    className="mt-1 w-5 h-5 accent-teal-700 rounded shrink-0"
                  />
                  <div>
                    <div className="text-sm font-extrabold text-slate-900">
                      ۴. حذف خودکار ۱۹ صفحه و پست تستی/معیوب به‌جامانده در وردپرس قدیم
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      حذف صفحات آزمایشی قدیمی مثل <code>Page de test</code>، <code>Mon article</code>، <code>test -- fa -- lionel</code> و اصلاح ۴ لینک اشتباه در منوی بالای سایت قدیم.
                    </p>
                  </div>
                </label>
              </div>

              <input
                type="text"
                value={questionnaire.macroArchitectureComment}
                onChange={(e) =>
                  setQuestionnaire({
                    ...questionnaire,
                    macroArchitectureComment: e.target.value,
                  })
                }
                placeholder="💬 هرگونه نظر یا دستور کلان درباره منوها و دسته‌بندی‌های کلی سایت دارید اینجا بنویسید..."
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900"
              />
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 2: AI ASSISTANT LIVE DEMO & USER LOGIN PERMISSION
           =================================================================== */}
        {activeTab === 'ai_and_auth' && (
          <AiAssistantDemoAndApproval
            policy={authAndAiPolicy}
            onChange={setAuthAndAiPolicy}
          />
        )}

        {/* ===================================================================
            SHARED FILTER & SEARCH BAR FOR TABS 3, 4, 5, 6
           =================================================================== */}
        {['books', 'art_exhibitions', 'poems_videos', 'articles_pdfs'].includes(activeTab) && (
          <div className="rounded-2xl bg-white border border-slate-200 p-4 mb-5 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی فوری در عنوان یا متن آثار این بخش..."
                className="w-full rounded-xl border border-slate-300 pr-10 pl-4 py-2 text-xs sm:text-sm text-slate-900 focus:border-amber-600 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-600">فیلتر زبان:</span>
              {[
                { id: 'all' as const, label: 'همه زبان‌ها' },
                { id: 'fa' as const, label: '🇮🇷 فارسی' },
                { id: 'fr' as const, label: '🇫🇷 Français' },
                { id: 'en' as const, label: '🇬🇧 English' },
              ].map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLangFilter(l.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                    langFilter === l.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 3: BOOKS (26 BOOKS + FRONT/BACK/SPINE COVERS + SAMPLE PAGES + VOICE)
           =================================================================== */}
        {activeTab === 'books' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  📚 فهرست کامل ۲۶ کتاب و رساله استخراج‌شده از سایت ({filteredBooks.length} مورد در حال نمایش)
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  در زیر هر کتاب می‌توانید تصاویر <strong>روی جلد، پشت جلد، عطف، فایل صفحات برگزیده برای ورق‌زن سه‌بعدی</strong> و <strong>صدای خودتان برای معرفی کوتاه کتاب</strong> را اضافه کنید.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openAddWorkModal('book')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ افزودن کتاب جدید (به تعداد نامحدود)</span>
              </button>
            </div>

            {filteredBooks.map((book) => {
              const key = `book-${book.id}`;
              const dec = getDecision(key, 'keep');
              const isExpanded = expandedIds[key] ?? true; // Expanded by default on books so Dr. Makaremi immediately sees the cover/pages/voice uploader!

              return (
                <div
                  key={book.id}
                  className={`rounded-3xl border-2 bg-white p-5 shadow-sm transition ${
                    dec.status === 'delete'
                      ? 'border-red-300 opacity-60'
                      : dec.status === 'featured'
                      ? 'border-amber-500 ring-2 ring-amber-200'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      {book.coverUrl ? (
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          className="w-20 h-28 object-cover rounded-xl border border-slate-200 shadow-sm shrink-0 bg-slate-50"
                        />
                      ) : (
                        <div className="w-20 h-28 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-[11px] text-slate-400 text-center p-1 shrink-0">
                          بدون تصویر جلد در سایت قدیم
                        </div>
                      )}

                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800">
                            {book.lang === 'fr' ? '🇫🇷 کتاب فرانسوی' : '🇮🇷 کتاب فارسی'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900">
                            سال انتشار: {book.year || '—'}
                          </span>
                          {book.publisher && (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 text-teal-900 border border-teal-200">
                              ناشر: {book.publisher}
                            </span>
                          )}
                          {book.isbn && (
                            <span className="text-[11px] text-slate-500 font-mono">
                              ISBN: {book.isbn}
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-extrabold text-slate-900">
                          {book.title}
                          {book.subtitle && (
                            <span className="text-sm font-normal text-slate-600 mr-2">
                              — {book.subtitle}
                            </span>
                          )}
                        </h3>

                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                          {book.excerpt}
                        </p>

                        {/* Genre reassignment */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-xs font-bold text-slate-700">دسته‌بندی کتاب:</span>
                          <select
                            value={dec.customCategory || book.genres[0] || 'پژوهش'}
                            onChange={(e) =>
                              updateDecision(key, { customCategory: e.target.value })
                            }
                            className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-800"
                          >
                            <option value="روانکاوی">روانکاوی (Psychanalyse)</option>
                            <option value="حافظ‌پژوهی و عرفان">حافظ‌پژوهی و عرفان</option>
                            <option value="پژوهش و فرهنگ">پژوهش و فرهنگ (Recherche)</option>
                            <option value="راهبردی و مدیریت">راهبردی و مدیریت (Stratégie)</option>
                            <option value="شعر و ادبیات">شعر و ادبیات (Poésie)</option>
                            <option value="رمان و خاطرات">رمان و خاطرات</option>
                            <option value="هنر و خوشنویسی">هنر و خوشنویسی (Art)</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => toggleExpand(key)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:underline mr-2"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-3.5 h-3.5" /> بستن پنل جلد ۳بعدی و صدای استاد
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3.5 h-3.5" /> باز کردن پنل جلد رو/پشت/عطف، صفحات برگزیده و صدای استاد
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="shrink-0">{renderDecisionButtons(key, 'keep')}</div>
                  </div>

                  {/* Book 3D Cover (Front/Back/Spine), Sample Pages & Author Voice Recorder */}
                  {isExpanded && (
                    <BookMediaAssetsUploader
                      bookId={book.id}
                      bookTitle={book.title}
                      existingCoverUrl={book.coverUrl}
                      existingPdfs={book.pdfs}
                      spec={
                        dec.book3DSpec || {
                          showIn3DShowcase: true,
                          allowFullPdfDownload: book.pdfs.length > 0,
                        }
                      }
                      onChange={(newSpec) => updateDecision(key, { book3DSpec: newSpec })}
                    />
                  )}

                  {/* Comment input for this book */}
                  <div className="mt-3">
                    <input
                      type="text"
                      value={dec.comment || ''}
                      onChange={(e) => updateDecision(key, { comment: e.target.value })}
                      placeholder={`💬 یادداشت یا دستور اصلاحی استاد درباره کتاب «${book.title}»...`}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-amber-600 focus:outline-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===================================================================
            TAB 4: ART GALLERIES (55 GALLERIES / 1390 WORKS) & 27 EXHIBITIONS
           =================================================================== */}
        {activeTab === 'art_exhibitions' && (
          <div className="space-y-4">
            {/* Sub-tab switch */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setArtSubTab('galleries')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                    artSubTab === 'galleries'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  🎨 مجموعه‌گالری‌های نقاشی و خوشنویسی ({filteredGalleries.length} گالری / ۱٬۳۹۰ اثر)
                </button>
                <button
                  type="button"
                  onClick={() => setArtSubTab('exhibitions')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                    artSubTab === 'exhibitions'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  🏛️ تاریخچه نمایشگاه‌های بین‌المللی ({exhibitionPages.length} صفحه فارسی و فرانسوی)
                </button>
              </div>

              <button
                type="button"
                onClick={() =>
                  openAddWorkModal(artSubTab === 'galleries' ? 'gallery' : 'exhibition')
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-teal-700 hover:bg-teal-800 text-white shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>
                  {artSubTab === 'galleries'
                    ? '+ افزودن تابلوی جدید یا گالری جدید (نامحدود)'
                    : '+ افزودن نمایشگاه جدید پس از ۲۰۱۶ (نامحدود)'}
                </span>
              </button>
            </div>

            {artSubTab === 'galleries' ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredGalleries.map((gal) => {
                  const key = `gallery-${gal.id}`;
                  const dec = getDecision(key, 'keep');
                  const isOpen = expandedIds[key] ?? false;

                  return (
                    <div
                      key={gal.id}
                      className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          {gal.coverUrl && (
                            <img
                              src={gal.coverUrl}
                              alt={gal.title}
                              className="w-24 h-24 object-cover rounded-2xl border border-slate-200 shrink-0 bg-slate-50"
                            />
                          )}
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800">
                                {gal.lang === 'fr' ? '🇫🇷 گالری فرانسوی' : '🇮🇷 گالری فارسی'}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-amber-100 text-amber-900">
                                حاوی {gal.artworkCount} تابلوی هنری
                              </span>
                            </div>
                            <h3 className="text-base font-extrabold text-slate-900">{gal.title}</h3>
                            {gal.statement && (
                              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                                {gal.statement}
                              </p>
                            )}
                            <button
                              type="button"
                              onClick={() => toggleExpand(key)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 hover:underline pt-1"
                            >
                              {isOpen
                                ? 'بستن پیش‌نمایش تصاویر و ضبط صدای استاد'
                                : `مشاهده تصاویر داخل این گالری (${gal.artworkCount} اثر) + ضبط معرفی صوتی استاد`}
                            </button>
                          </div>
                        </div>
                        <div className="shrink-0">{renderDecisionButtons(key, 'keep')}</div>
                      </div>

                      {isOpen && (
                        <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                          {gal.artworks.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                              {gal.artworks.map((art: any) => (
                                <a
                                  key={art.id}
                                  href={art.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="group block rounded-xl border border-slate-200 p-1.5 bg-slate-50 hover:border-amber-500 transition"
                                >
                                  <img
                                    src={art.url}
                                    alt={art.title}
                                    className="w-full h-24 object-cover rounded-lg"
                                  />
                                  <div className="text-[10px] text-slate-600 truncate mt-1 text-center">
                                    {art.title}
                                  </div>
                                </a>
                              ))}
                            </div>
                          )}

                          <VoiceRecorderWidget
                            itemId={key}
                            itemTitle={`مجموعه‌گالری ${gal.title}`}
                            mode="site_intro"
                            existingAudio={dec.siteIntroAudio}
                            onSaveAudio={(audio) => updateDecision(key, { siteIntroAudio: audio })}
                          />
                        </div>
                      )}

                      <div className="mt-3">
                        <input
                          type="text"
                          value={dec.comment || ''}
                          onChange={(e) => updateDecision(key, { comment: e.target.value })}
                          placeholder={`💬 یادداشت استاد درباره مجموعه «${gal.title}» (تغییر نام، ادغام یا حذف تابلوی خاص)...`}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {exhibitionPages.map((ex) => {
                  const key = `exhibition-${ex.id}`;
                  const dec = getDecision(key, 'keep');
                  return (
                    <div
                      key={ex.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col gap-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                            {ex.lang === 'fr' ? '🇫🇷 Français' : '🇮🇷 فارسی'}
                          </span>
                          <h3 className="text-base font-extrabold text-slate-900">{ex.title}</h3>
                          <p className="text-xs text-slate-600 leading-relaxed">{ex.excerpt}</p>
                        </div>
                        {renderDecisionButtons(key, 'keep')}
                      </div>

                      <VoiceRecorderWidget
                        itemId={key}
                        itemTitle={ex.title}
                        mode="site_intro"
                        compact
                        existingAudio={dec.siteIntroAudio}
                        onSaveAudio={(audio) => updateDecision(key, { siteIntroAudio: audio })}
                      />

                      <input
                        type="text"
                        value={dec.comment || ''}
                        onChange={(e) => updateDecision(key, { comment: e.target.value })}
                        placeholder={`💬 یادداشت یا خاطره استاد درباره نمایشگاه «${ex.title}»...`}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            TAB 5: POEMS (301 ILLUSTRATED POEMS) & VIDEOS (262 VIDEOS)
           =================================================================== */}
        {activeTab === 'poems_videos' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPoemVideoSubTab('poems')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                    poemVideoSubTab === 'poems'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  📜 اشعار و کوتاه‌واره‌ها ({filteredPoems.length} شعر مصور)
                </button>
                <button
                  type="button"
                  onClick={() => setPoemVideoSubTab('videos')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                    poemVideoSubTab === 'videos'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  🎬 ویدئوها و سخنرانی‌ها ({filteredVideos.length} ویدئو در ۱۹ تم + ۸۵ متن پیاده‌شده)
                </button>
              </div>

              <button
                type="button"
                onClick={() =>
                  openAddWorkModal(poemVideoSubTab === 'poems' ? 'poem' : 'video')
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-teal-700 hover:bg-teal-800 text-white shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>
                  {poemVideoSubTab === 'poems'
                    ? '+ افزودن شعر جدید همراه با دکلمه صوتی (نامحدود)'
                    : '+ افزودن ویدئو یا سخنرانی جدید (نامحدود)'}
                </span>
              </button>
            </div>

            {poemVideoSubTab === 'poems' ? (
              <div className="space-y-3">
                {filteredPoems.slice(0, 60).map((poem) => {
                  const key = `poem-${poem.id}`;
                  const dec = getDecision(key, 'keep');
                  const isOpen = expandedIds[key] ?? false;

                  return (
                    <div
                      key={poem.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3.5 flex-1">
                          {poem.artworkUrl && (
                            <img
                              src={poem.artworkUrl}
                              alt={poem.title}
                              className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0"
                            />
                          )}
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                {poem.lang === 'fr' ? '🇫🇷 Poème' : '🇮🇷 شعر فارسی'}
                              </span>
                              {poem.signature && (
                                <span className="text-[11px] text-amber-800 font-semibold">
                                  {poem.signature}
                                </span>
                              )}
                            </div>
                            <h3 className="text-base font-extrabold text-slate-900">{poem.title}</h3>
                            <p className="text-xs text-slate-600 whitespace-pre-line line-clamp-2">
                              {poem.excerpt}
                            </p>
                            <button
                              type="button"
                              onClick={() => toggleExpand(key)}
                              className="text-xs font-bold text-teal-700 hover:underline pt-1 inline-block"
                            >
                              {isOpen
                                ? 'بستن متن کامل شعر و ضبط دکلمه استاد'
                                : 'مشاهده متن کامل شعر + 🎙️ ضبط دکلمه این شعر با صدای استاد'}
                            </button>
                          </div>
                        </div>
                        {renderDecisionButtons(key, 'keep')}
                      </div>

                      {isOpen && (
                        <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                          <div className="rounded-xl bg-stone-50 p-3.5 text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-7">
                            {poem.fullText}
                          </div>
                          <VoiceRecorderWidget
                            itemId={key}
                            itemTitle={`دکلمه شعر «${poem.title}» با صدای استاد`}
                            mode="site_intro"
                            existingAudio={dec.siteIntroAudio}
                            onSaveAudio={(audio) => updateDecision(key, { siteIntroAudio: audio })}
                          />
                        </div>
                      )}

                      <div className="mt-2">
                        <input
                          type="text"
                          value={dec.comment || ''}
                          onChange={(e) => updateDecision(key, { comment: e.target.value })}
                          placeholder={`💬 یادداشت استاد درباره شعر «${poem.title}»...`}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs"
                        />
                      </div>
                    </div>
                  );
                })}
                {filteredPoems.length > 60 && (
                  <p className="text-center text-xs text-slate-500 py-2">
                    ۶۰ شعر نخست نمایش داده شد؛ برای یافتن هر یک از {filteredPoems.length} شعر، نام یا بیتی از آن را در کادر جستجوی بالا وارد فرمایید.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredVideos.slice(0, 60).map((vid) => {
                  const key = `video-${vid.id}`;
                  const dec = getDecision(key, 'keep');
                  return (
                    <div
                      key={vid.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {vid.lang === 'fr' ? '🇫🇷 Vidéo FR' : '🇮🇷 ویدئوی فارسی'}
                            </span>
                            {vid.themes.map((th: string, i: number) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900"
                              >
                                تم: {th}
                              </span>
                            ))}
                            {vid.hasTranscript && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900">
                                دارای متن کامل پیاده‌شده (Transcript)
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-extrabold text-slate-900">{vid.title}</h3>
                          {vid.description && (
                            <p className="text-xs text-slate-600">{vid.description}</p>
                          )}
                          {vid.youtubeUrl && (
                            <a
                              href={vid.youtubeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> مشاهده ویدئو در یوتیوب
                            </a>
                          )}
                        </div>
                        {renderDecisionButtons(key, 'keep')}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <select
                          value={dec.customCategory || vid.themes[0] || 'روانکاوی'}
                          onChange={(e) =>
                            updateDecision(key, { customCategory: e.target.value })
                          }
                          className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-800"
                        >
                          <option value="روانکاوی">تم: روانکاوی</option>
                          <option value="حافظ">تم: حافظ‌پژوهی</option>
                          <option value="جامعه">تم: جامعه و فرهنگ</option>
                          <option value="هنر">تم: هنر و خوشنویسی</option>
                          <option value="یونسکو ۲۰۰۹">تم: یونسکو ۲۰۰۹</option>
                          <option value="پژوهش">تم: پژوهش</option>
                          <option value="شعر و تصویر">تم: شعر و تصویر</option>
                          <option value="در مورد استاد">تم: درباره استاد و مصاحبه‌ها</option>
                        </select>
                        <input
                          type="text"
                          value={dec.comment || ''}
                          onChange={(e) => updateDecision(key, { comment: e.target.value })}
                          placeholder="💬 یادداشت استاد درباره این ویدئو..."
                          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            TAB 6: ARTICLES (408), CONFERENCES/INTERVIEWS & 51 PDF DOCUMENTS
           =================================================================== */}
        {activeTab === 'articles_pdfs' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setArticleSubTab('scholarly')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                    articleSubTab === 'scholarly'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  🖋️ مقالات علمی روانکاوی، پژوهش و جامعه ({scholarlyPosts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setArticleSubTab('conferences')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                    articleSubTab === 'conferences'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  🎙️ کنفرانس‌های مکتوب و مصاحبه‌های رسانه‌ای ({conferenceAndInterviewPages.length})
                </button>
                <button
                  type="button"
                  onClick={() => setArticleSubTab('pdfs')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                    articleSubTab === 'pdfs'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  📄 کتابخانه اسناد PDF ({catalog.pdfs.length} فایل)
                </button>
                <button
                  type="button"
                  onClick={() => setArticleSubTab('news')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                    articleSubTab === 'news'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  📰 آرشیو اخبار و رویدادها ({newsPosts.length})
                </button>
              </div>

              <button
                type="button"
                onClick={() => openAddWorkModal('article')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-teal-700 hover:bg-teal-800 text-white shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ افزودن مقاله یا کنفرانس جدید (نامحدود)</span>
              </button>
            </div>

            {(articleSubTab === 'scholarly' || articleSubTab === 'news') && (
              <div className="space-y-3">
                {(articleSubTab === 'scholarly' ? scholarlyPosts : newsPosts)
                  .slice(0, 60)
                  .map((post) => {
                    const key = `post-${post.id}`;
                    const dec = getDecision(key, 'keep');
                    return (
                      <div
                        key={post.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                {post.lang === 'fr' ? '🇫🇷 Français' : '🇮🇷 فارسی'} • {post.date}
                              </span>
                              {post.categories.map((c: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-900 border border-teal-200"
                                >
                                  دسته فعلی: {c}
                                </span>
                              ))}
                              {post.pdfUrl && (
                                <a
                                  href={post.pdfUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 underline"
                                >
                                  📄 دارای فایل PDF پیوست
                                </a>
                              )}
                              {post.commentCount > 0 && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900">
                                  💬 {post.commentCount} دیدگاه مخاطب
                                </span>
                              )}
                            </div>
                            <h3 className="text-base font-extrabold text-slate-900">{post.title}</h3>
                            <p className="text-xs text-slate-600 line-clamp-2">{post.excerpt}</p>
                          </div>
                          {renderDecisionButtons(key, 'keep')}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-700">انتقال به دسته:</span>
                          <select
                            value={
                              dec.customCategory ||
                              post.categories[0] ||
                              (articleSubTab === 'news' ? 'اخبار و رویدادها' : 'روانکاوی')
                            }
                            onChange={(e) =>
                              updateDecision(key, { customCategory: e.target.value })
                            }
                            className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-800"
                          >
                            <option value="روانکاوی">مقالات تخصصی روانکاوی</option>
                            <option value="حافظ‌پژوهی و ادبیات">حافظ‌پژوهی، شاهنامه و ادبیات</option>
                            <option value="پژوهش">مقالات پژوهش</option>
                            <option value="جامعه و فرهنگ">مقالات جامعه و فرهنگ</option>
                            <option value="اخبار و رویدادها">آرشیو اخبار و رویدادها</option>
                          </select>
                          <input
                            type="text"
                            value={dec.comment || ''}
                            onChange={(e) => updateDecision(key, { comment: e.target.value })}
                            placeholder="💬 یادداشت استاد درباره این نوشته..."
                            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs"
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {articleSubTab === 'conferences' && (
              <div className="space-y-3">
                {conferenceAndInterviewPages.map((pg) => {
                  const key = `page-${pg.id}`;
                  const dec = getDecision(key, 'keep');
                  return (
                    <div
                      key={pg.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                            {pg.pageGroup === 'conference'
                              ? '🎙️ متن کامل سخنرانی / کنفرانس'
                              : pg.pageGroup === 'interview_press'
                              ? '📰 مصاحبه رسانه‌ای / مطبوعاتی'
                              : '📜 رزومه و منابع (CV & Références)'}
                          </span>
                          <h3 className="text-base font-extrabold text-slate-900">{pg.title}</h3>
                          <p className="text-xs text-slate-600">{pg.excerpt}</p>
                        </div>
                        {renderDecisionButtons(key, 'keep')}
                      </div>
                      <input
                        type="text"
                        value={dec.comment || ''}
                        onChange={(e) => updateDecision(key, { comment: e.target.value })}
                        placeholder="💬 یادداشت استاد..."
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {articleSubTab === 'pdfs' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {catalog.pdfs.map((pdf) => {
                  const key = `pdf-${pdf.id}`;
                  const dec = getDecision(key, 'keep');
                  return (
                    <div
                      key={pdf.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                            📄 سند PDF علمی
                          </span>
                          <a
                            href={pdf.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-amber-700 hover:underline inline-flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> مشاهده فایل PDF
                          </a>
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900">{pdf.title}</h4>
                        {pdf.parentTitle && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            متصل به: {pdf.parentTitle}
                          </p>
                        )}
                      </div>
                      {renderDecisionButtons(key, 'keep')}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            TAB 7: CLEANUP 19 TEST ITEMS & FINAL SUBMISSION MANIFEST
           =================================================================== */}
        {activeTab === 'cleanup_submit' && (
          <div className="space-y-6">
            <div className="rounded-3xl border-2 border-red-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-4">
                <AlertTriangle className="w-7 h-7 text-red-600 shrink-0" />
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    پالایش رکوردهای تستی، آزمایشی و پیش‌نویس‌های خالی وردپرس قدیم ({testAndJunkItems.length} مورد)
                  </h2>
                  <p className="text-xs text-slate-600">
                    این موارد توسط برنامه‌نویسان قبلی هنگام تست اولیه وردپرس ایجاد شده‌اند و به صورت پیش‌فرض روی <strong>«🗑️ حذف از سایت جدید»</strong> قرار گرفته‌اند. اگر موردی از آن‌ها را نیاز دارید می‌توانید وضعیتش را به «حفظ» تغییر دهید.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {testAndJunkItems.map((item: any) => {
                  const key = `junk-${item.entityType}-${item.id}`;
                  return (
                    <div
                      key={key}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <span className="text-[10px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded ml-2">
                          {item.entityType} #{item.id} ({item.status})
                        </span>
                        <span className="text-sm font-extrabold text-slate-900">{item.title}</span>
                        {item.excerpt && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {item.excerpt}
                          </p>
                        )}
                      </div>
                      {renderDecisionButtons(key, 'delete')}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Final Submission Box */}
            <div className="rounded-3xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 via-white to-teal-50 p-8 text-center shadow-lg">
              <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto mb-3" />
              <h2 className="text-2xl font-black text-slate-900 mb-2">
                ثبت نهایی و ارسال تصمیمات استاد دکتر حسن مکارمی
              </h2>
              <p className="text-sm text-slate-600 max-w-2xl mx-auto mb-6 leading-relaxed">
                با کلیک روی دکمه زیر، تمامی تیک‌ها، دسته‌بندی‌ها، آثار جدید اضافه‌شده، تصاویر جلد و صفحات برگزیده کتاب‌ها، صداهای ضبط‌شده استاد و تنظیمات دستیار هوشمند در قالب یک فایل جامع ذخیره و برای اعمال مستقیم در سایت جدید آماده می‌شود.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={handleExportManifest}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-black bg-amber-600 hover:bg-amber-700 text-white shadow-xl transition"
                >
                  <Download className="w-5 h-5" />
                  <span>ثبت نهایی و دانلود مانیفست کامل تصمیمات استاد</span>
                </button>

                <button
                  type="button"
                  onClick={() => openAddWorkModal('book')}
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-extrabold bg-teal-800 hover:bg-teal-900 text-white shadow-md transition"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>افزودن اثر جدید دیگر پیش از ثبت نهایی</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Unlimited Add New Work Modal */}
      <AddNewWorkModal
        defaultType={addModalDefaultType}
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAddWork={(work) => setCustomAddedWorks((prev) => [work, ...prev])}
      />
    </div>
  );
}

