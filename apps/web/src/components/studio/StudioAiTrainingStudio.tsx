'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpLeft,
  BookMarked,
  Brain,
  CheckCircle2,
  Database,
  FileText,
  Loader2,
  Network,
  Play,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Upload,
} from 'lucide-react';
import type {
  AiConceptEdge,
  AiEvalRunSummary,
  AiGlossaryTermExtended,
  AiGoldenQaItem,
  AiPersonaVersion,
  AiTrainingDocument,
  AiTrainingTelemetryOverview,
  ConceptEdgeRelation,
  ContentPillar,
  Locale,
} from '@makaremi/shared';
import { AccessibleListbox, type ListboxOption } from './AccessibleListbox';

type TrainingSubTab = 'constitution' | 'golden_qa' | 'glossary' | 'documents' | 'telemetry_eval';

const PILLAR_OPTIONS: ListboxOption<ContentPillar>[] = [
  { value: 'psychoanalysis', label: 'روان‌کاوی بالینی و لکانی', badge: 'کلینیک' },
  { value: 'art_calligraphy', label: 'هنر، خوشنویسی معاصر و شعر', badge: 'هنر' },
  { value: 'cultural_strategy', label: 'سرزمین فرهنگی و راهبرد', badge: 'راهبرد' },
  { value: 'human_rights_dadkhahi', label: 'حقوق بشر، دادخواهی و خاوران', badge: 'دادخواهی' },
];

const LOCALE_OPTIONS: ListboxOption<Locale>[] = [
  { value: 'fa', label: 'فارسی (FA)', badge: 'RTL' },
  { value: 'fr', label: 'فرانسوی (FR)', badge: 'Paris' },
  { value: 'en', label: 'انگلیسی بریتانیایی (EN)', badge: 'UK' },
];

const DOC_FORMAT_OPTIONS: ListboxOption<AiTrainingDocument['sourceFormat']>[] = [
  { value: 'markdown', label: 'متن یا جزوه Markdown', badge: 'MD' },
  { value: 'pdf_text', label: 'متن استخراج‌شده از کتاب/PDF', badge: 'PDF' },
  { value: 'docx_text', label: 'متن یادداشت Word/DOCX', badge: 'DOCX' },
  { value: 'srt_vtt', label: 'زیرنویس یا پیاده‌سازی سخنرانی (SRT/VTT)', badge: 'VTT' },
  { value: 'voice_note', label: 'پیاده‌سازی یادداشت صوتی استاد', badge: 'صوت' },
  { value: 'facebook_thread', label: 'رشته‌یادداشت فیس‌بوک', badge: 'آرشیو' },
];

const EDGE_RELATION_OPTIONS: ListboxOption<ConceptEdgeRelation>[] = [
  { value: 'related', label: 'مرتبط مفهومی (Related)' },
  { value: 'clinical_application', label: 'کاربست بالینی (Clinical Application)' },
  { value: 'literary_echo', label: 'پژواک ادبی / حافظی (Literary Echo)' },
  { value: 'broader', label: 'مفهوم کلان‌تر (Broader)' },
  { value: 'narrower', label: 'زیرمفهوم (Narrower)' },
  { value: 'contrasts_with', label: 'تضاد و تقابل ساختاری (Contrasts)' },
];

export function StudioAiTrainingStudio() {
  const [subTab, setSubTab] = useState<TrainingSubTab>('telemetry_eval');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ ok: boolean; text: string } | null>(null);

  // Data states
  const [activePersona, setActivePersona] = useState<AiPersonaVersion | null>(null);
  const [personaVersions, setPersonaVersions] = useState<AiPersonaVersion[]>([]);
  const [goldenQaList, setGoldenQaList] = useState<AiGoldenQaItem[]>([]);
  const [glossaryTerms, setGlossaryTerms] = useState<AiGlossaryTermExtended[]>([]);
  const [conceptEdges, setConceptEdges] = useState<AiConceptEdge[]>([]);
  const [trainingDocs, setTrainingDocs] = useState<AiTrainingDocument[]>([]);
  const [telemetry, setTelemetry] = useState<AiTrainingTelemetryOverview | null>(null);
  const [evalSummary, setEvalSummary] = useState<AiEvalRunSummary | null>(null);

  // Form 1: Constitution
  const [personaLabel, setPersonaLabel] = useState('');
  const [constFa, setConstFa] = useState('');
  const [constFr, setConstFr] = useState('');
  const [constEn, setConstEn] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState('5000000');
  const [enableCrisis, setEnableCrisis] = useState(true);
  const [enableFastFallback, setEnableFastFallback] = useState(true);

  // Form 2: Golden Q&A
  const [gqaId, setGqaId] = useState<string | undefined>(undefined);
  const [gqaLocale, setGqaLocale] = useState<Locale>('fa');
  const [gqaPillar, setGqaPillar] = useState<ContentPillar>('psychoanalysis');
  const [gqaQuestion, setGqaQuestion] = useState('');
  const [gqaVariants, setGqaVariants] = useState('');
  const [gqaAnswer, setGqaAnswer] = useState('');
  const [gqaLinks, setGqaLinks] = useState('');
  const [gqaBoost, setGqaBoost] = useState('1.85');

  // Form 3: Glossary & Edges
  const [glossaryFilter, setGlossaryFilter] = useState('');
  const [termFa, setTermFa] = useState('');
  const [termFr, setTermFr] = useState('');
  const [termEn, setTermEn] = useState('');
  const [termAliases, setTermAliases] = useState('');
  const [termDefFa, setTermDefFa] = useState('');
  const [termDefFr, setTermDefFr] = useState('');
  const [termDefEn, setTermDefEn] = useState('');
  const [termPillar, setTermPillar] = useState<ContentPillar>('psychoanalysis');
  const [termLocked, setTermLocked] = useState(true);
  const [edgeSource, setEdgeSource] = useState('');
  const [edgeTarget, setEdgeTarget] = useState('');
  const [edgeRel, setEdgeRel] = useState<ConceptEdgeRelation>('related');
  const [edgeNote, setEdgeNote] = useState('');

  // Form 4: Training Document Ingestor
  const [docTitle, setDocTitle] = useState('');
  const [docFormat, setDocFormat] = useState<AiTrainingDocument['sourceFormat']>('markdown');
  const [docLocale, setDocLocale] = useState<Locale>('fa');
  const [docPillar, setDocPillar] = useState<ContentPillar>('psychoanalysis');
  const [docBody, setDocBody] = useState('');

  const loadAllTrainingData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, qRes, gRes, dRes, tRes] = await Promise.all([
        fetch('/api/studio/ai-training/persona'),
        fetch('/api/studio/ai-training/golden-qa'),
        fetch('/api/studio/ai-training/glossary'),
        fetch('/api/studio/ai-training/documents'),
        fetch('/api/studio/ai-training/telemetry'),
      ]);

      const [pData, qData, gData, dData, tData] = await Promise.all([
        pRes.json(),
        qRes.json(),
        gRes.json(),
        dRes.json(),
        tRes.json(),
      ]);

      if (pData.ok && pData.active) {
        setActivePersona(pData.active);
        setPersonaVersions(pData.versions || []);
        setPersonaLabel(`منشور معرفتی ویرایش ${(pData.versions?.length || 1) + 1}`);
        setConstFa(pData.active.systemConstitutionFa || '');
        setConstFr(pData.active.systemConstitutionFr || '');
        setConstEn(pData.active.systemConstitutionEn || '');
        setMonthlyBudget(String(pData.active.monthlyTokenBudget || 5000000));
        setEnableCrisis(Boolean(pData.active.clinicalBoundaryPolicy?.enableCrisisDetection ?? true));
        setEnableFastFallback(Boolean(pData.active.providerRouting?.enableFastFallback ?? true));
      }
      if (qData.ok) setGoldenQaList(qData.items || []);
      if (gData.ok) {
        setGlossaryTerms(gData.terms || []);
        setConceptEdges(gData.edges || []);
        if (gData.terms?.length >= 2) {
          setEdgeSource((prev) => prev || gData.terms[0].id);
          setEdgeTarget((prev) => prev || gData.terms[1].id);
        }
      }
      if (dData.ok) setTrainingDocs(dData.documents || []);
      if (tData.ok && tData.overview) {
        setTelemetry(tData.overview);
        if (tData.overview.latestEvalRun) {
          setEvalSummary(tData.overview.latestEvalRun);
        }
      }
    } catch {
      setBanner({ ok: false, text: 'خطا در بارگذاری داده‌های مرکز آموزش دستیار هوشمند.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllTrainingData();
  }, [loadAllTrainingData]);

  const handleSavePersona = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch('/api/studio/ai-training/persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          label: personaLabel.trim() || 'منشور معرفتی جدید',
          systemConstitutionFa: constFa,
          systemConstitutionFr: constFr,
          systemConstitutionEn: constEn,
          monthlyTokenBudget: Math.max(100000, Number(monthlyBudget) || 5000000),
          clinicalBoundaryPolicy: { enableCrisisDetection: enableCrisis },
          providerRouting: { enableFastFallback },
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setActivePersona(data.active);
        setPersonaVersions(data.versions || []);
        setBanner({ ok: true, text: data.message });
      } else {
        setBanner({ ok: false, text: data.error || 'خطا در ذخیره منشور معرفتی.' });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleActivatePersonaVersion = async (versionId: number) => {
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch('/api/studio/ai-training/persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate', versionId }),
      });
      const data = await res.json();
      if (data.ok && data.active) {
        setActivePersona(data.active);
        setPersonaVersions(data.versions || []);
        setConstFa(data.active.systemConstitutionFa);
        setConstFr(data.active.systemConstitutionFr);
        setConstEn(data.active.systemConstitutionEn);
        setBanner({ ok: true, text: data.message });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSaveGoldenQa = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch('/api/studio/ai-training/golden-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: gqaId,
          locale: gqaLocale,
          pillar: gqaPillar,
          questionCanonical: gqaQuestion,
          questionVariants: gqaVariants
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean),
          answerMarkdown: gqaAnswer,
          linkedUrls: gqaLinks
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean),
          priorityBoost: Number(gqaBoost) || 1.85,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setGoldenQaList(data.items || []);
        setGqaId(undefined);
        setGqaQuestion('');
        setGqaVariants('');
        setGqaAnswer('');
        setGqaLinks('');
        setBanner({ ok: true, text: data.message });
      } else {
        setBanner({ ok: false, text: data.error || 'خطا در ذخیره پاسخ طلایی.' });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteGoldenQa = async (id: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/studio/ai-training/golden-qa?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.ok) {
        setGoldenQaList(data.items || []);
        setBanner({ ok: true, text: data.message });
      }
    } finally {
      setBusy(false);
    }
  };

  const handlePromoteGapToGoldenQa = (queryText: string, loc: Locale = 'fa') => {
    setGqaId(undefined);
    setGqaLocale(loc);
    setGqaQuestion(queryText);
    setGqaAnswer('');
    setSubTab('golden_qa');
    setBanner({
      ok: true,
      text: 'پرسش به فرم «پاسخ‌های طلایی استاد» منتقل شد؛ پاسخ مصوب خود را بنویسید و ذخیره کنید.',
    });
  };

  const handleSaveGlossaryTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch('/api/studio/ai-training/glossary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'term',
          term_fa: termFa,
          term_fr: termFr,
          term_en: termEn,
          aliases: termAliases
            .split(/[،,]/)
            .map((s) => s.trim())
            .filter(Boolean),
          conceptual_definition_fa: termDefFa,
          conceptual_definition_fr: termDefFr,
          conceptual_definition_en: termDefEn,
          pillar: termPillar,
          is_locked_translation: termLocked,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setGlossaryTerms(data.terms || []);
        setConceptEdges(data.edges || []);
        setTermFa('');
        setTermFr('');
        setTermEn('');
        setTermAliases('');
        setTermDefFa('');
        setTermDefFr('');
        setTermDefEn('');
        setBanner({ ok: true, text: data.message });
      } else {
        setBanner({ ok: false, text: data.error || 'خطا در ثبت اصطلاح.' });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleAddConceptEdge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edgeSource || !edgeTarget || edgeSource === edgeTarget) return;
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch('/api/studio/ai-training/glossary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'edge',
          sourceTermId: edgeSource,
          targetTermId: edgeTarget,
          relationType: edgeRel,
          noteFa: edgeNote.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setConceptEdges(data.edges || []);
        setEdgeNote('');
        setBanner({ ok: true, text: data.message });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleFileUploadForDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    if (!docTitle) setDocTitle(file.name.replace(/\.[^.]+$/, ''));
    setDocBody(text.slice(0, 75000));
    if (file.name.endsWith('.srt') || file.name.endsWith('.vtt')) setDocFormat('srt_vtt');
  };

  const handleIngestTrainingDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch('/api/studio/ai-training/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: docTitle,
          sourceFormat: docFormat,
          locale: docLocale,
          pillar: docPillar,
          bodyMarkdown: docBody,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setTrainingDocs(data.documents || []);
        setDocTitle('');
        setDocBody('');
        setBanner({ ok: true, text: data.message });
      } else {
        setBanner({ ok: false, text: data.error || 'خطا در نمایه‌سازی سند آموزشی.' });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteTrainingDoc = async (id: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/studio/ai-training/documents?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.ok) {
        setTrainingDocs(data.documents || []);
        setBanner({ ok: true, text: data.message });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRunGoldenEval = async () => {
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch('/api/studio/ai-training/eval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'deterministic' }),
      });
      const data = await res.json();
      if (data.ok && data.summary) {
        setEvalSummary(data.summary);
        setBanner({ ok: true, text: data.message });
      } else {
        setBanner({ ok: false, text: data.error || 'اجرای آزمون ناموفق بود.' });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleTriageFeedback = async (feedbackId: string, triagedStatus: 'converted_to_qa' | 'dismissed') => {
    const res = await fetch('/api/studio/ai-training/telemetry', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedbackId, triagedStatus }),
    });
    const data = await res.json();
    if (data.ok && data.overview) setTelemetry(data.overview);
  };

  const termOptions: ListboxOption<string>[] = glossaryTerms.map((t) => ({
    value: t.id,
    label: `${t.term_fa} (${t.term_fr})`,
    badge: t.pillar,
  }));

  const filteredGlossary = glossaryTerms.filter((t) => {
    if (!glossaryFilter.trim()) return true;
    const q = glossaryFilter.toLowerCase();
    return (
      t.term_fa.toLowerCase().includes(q) ||
      t.term_fr.toLowerCase().includes(q) ||
      t.term_en.toLowerCase().includes(q)
    );
  });

  const subTabs: Array<{
    id: TrainingSubTab;
    label: string;
    count?: number;
    icon: React.ComponentType<{ size?: number }>;
  }> = [
    { id: 'telemetry_eval', label: 'شکاف‌های دانش و آزمون ۶۰گانه', count: telemetry?.knowledgeGapCount, icon: Activity },
    { id: 'golden_qa', label: 'پاسخ‌های طلایی استاد', count: goldenQaList.length, icon: BookMarked },
    { id: 'glossary', label: 'واژه‌نامه و گراف مفاهیم', count: glossaryTerms.length, icon: Network },
    { id: 'documents', label: 'آموزش از جزوه‌ها و اسناد', count: trainingDocs.length, icon: FileText },
    { id: 'constitution', label: 'منشور معرفتی و لحن', count: personaVersions.length, icon: Brain },
  ];

  const liveWordEstimate = docBody.trim() ? docBody.trim().split(/\s+/).length : 0;

  return (
    <section className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-[var(--primary-light)] border border-[var(--border-subtle)] text-[var(--primary)] flex items-center justify-center shrink-0">
            <Brain size={22} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-[var(--foreground)]">
              مرکز آموزش، تربیت و ارزیابی علمی دستیار هوشمند
            </h2>
            <p className="text-xs text-[var(--foreground-muted)] mt-1 leading-relaxed">
              هدایت مستقیم لحن و منشور معرفتی استاد، ثبت پاسخ‌های طلایی با امضای Ed25519، گسترش واژه‌نامه و گراف مفاهیم سه‌زبانه، تزریق جزوه‌های تازه و رصد ناشناس شکاف‌های دانش بدون هیچ تغییر روی خزانهٔ اصلی.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--foreground)]">
            <Database size={13} className="text-[var(--primary)]" />
            <span>
              {telemetry?.storageMode === 'neon_postgres' ? 'Neon Postgres متصل' : 'حافظهٔ محلی فعال'}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--foreground-muted)]">
            <span>
              pgvector: {telemetry?.pgvectorAvailable ? `${telemetry.embeddedChunkCount} بردار` : 'آمادهٔ همگام‌سازی'}
            </span>
          </span>
        </div>
      </div>

      {/* 5 Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`min-h-[42px] shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-colors ${
                isActive
                  ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'bg-[var(--surface-sunken)] border-[var(--border-subtle)] text-[var(--foreground)] hover:border-[var(--primary)]'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                    isActive
                      ? 'bg-white/20 text-[var(--primary-foreground)]'
                      : 'bg-[var(--surface-card)] text-[var(--foreground-muted)]'
                  }`}
                >
                  {tab.count.toLocaleString('fa-IR')}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {banner && (
        <div
          className={`rounded-xl border p-3.5 text-xs font-bold flex items-center gap-2 ${
            banner.ok
              ? 'border-emerald-500/50 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
              : 'border-rose-500/50 bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200'
          }`}
        >
          {banner.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{banner.text}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 flex items-center justify-center gap-2 text-xs text-[var(--foreground-muted)]">
          <Loader2 size={18} className="animate-spin" />
          <span>در حال بارگذاری مرکز آموزش دستیار...</span>
        </div>
      ) : (
        <>
          {/* SUB-TAB 5: TELEMETRY, KNOWLEDGE GAPS & 60-CASE GOLDEN EVAL */}
          {subTab === 'telemetry_eval' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-4">
                  <div className="text-[11px] text-[var(--foreground-muted)]">کل پرسش‌های ثبت‌شده (ناشناس)</div>
                  <div className="text-xl font-black text-[var(--foreground)] mt-1">
                    {(telemetry?.totalQueries || 0).toLocaleString('fa-IR')}
                  </div>
                </div>
                <div className="rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-4">
                  <div className="text-[11px] text-[var(--foreground-muted)]">شکاف‌های دانش کشف‌شده</div>
                  <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                    {(telemetry?.knowledgeGapCount || 0).toLocaleString('fa-IR')}
                  </div>
                </div>
                <div className="rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-4">
                  <div className="text-[11px] text-[var(--foreground-muted)]">بازخورد پژوهشگران</div>
                  <div className="flex items-center gap-3 mt-1.5 text-sm font-black">
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      <ThumbsUp size={14} /> {(telemetry?.positiveFeedbackCount || 0).toLocaleString('fa-IR')}
                    </span>
                    <span className="inline-flex items-center gap-1 text-rose-600">
                      <ThumbsDown size={14} /> {(telemetry?.negativeFeedbackCount || 0).toLocaleString('fa-IR')}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-4">
                  <div className="text-[11px] text-[var(--foreground-muted)]">مصرف توکن ماهانه / سقف</div>
                  <div className="text-sm font-extrabold text-[var(--foreground)] mt-1.5" dir="ltr">
                    {(telemetry?.monthlyTokensUsed || 0).toLocaleString('en-US')} /{' '}
                    {(telemetry?.monthlyTokenBudget || 5000000).toLocaleString('en-US')}
                  </div>
                </div>
              </div>

              {/* 60-Case Golden Eval Runner */}
              <div className="rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-[var(--foreground)]">
                      کارنامهٔ آزمون خودکار ۶۰پرسشی دقت، ایمنی بالینی و عدم توهم (Golden Eval)
                    </h3>
                    <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                      سنجش هم‌زمان بازیابی (Recall@5)، میان‌زبانی، واژگان لکانی، امتناع از توهم، بحران بالینی و برچسب‌سفید مطلق.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleRunGoldenEval}
                    className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-bold text-xs disabled:opacity-50"
                  >
                    {busy ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
                    <span>اجرای آزمون ۶۰گانهٔ دقت دستیار</span>
                  </button>
                </div>

                {evalSummary && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
                    <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-3 text-center">
                      <div className="text-[10px] text-[var(--foreground-muted)]">قبولی کل</div>
                      <div className="text-base font-black text-emerald-600 mt-1" dir="ltr">
                        {evalSummary.passedCases}/{evalSummary.totalCases}
                      </div>
                    </div>
                    <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-3 text-center">
                      <div className="text-[10px] text-[var(--foreground-muted)]">Recall@5</div>
                      <div className="text-base font-black text-[var(--foreground)] mt-1" dir="ltr">
                        {(evalSummary.recallAt5 * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-3 text-center">
                      <div className="text-[10px] text-[var(--foreground-muted)]">وفاداری استناد</div>
                      <div className="text-base font-black text-[var(--foreground)] mt-1" dir="ltr">
                        {(evalSummary.citationFaithfulness * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-3 text-center">
                      <div className="text-[10px] text-[var(--foreground-muted)]">امتناع از توهم</div>
                      <div className="text-base font-black text-[var(--foreground)] mt-1" dir="ltr">
                        {(evalSummary.refusalAccuracy * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-3 text-center">
                      <div className="text-[10px] text-[var(--foreground-muted)]">ایمنی بالینی</div>
                      <div className="text-base font-black text-emerald-600 mt-1" dir="ltr">
                        {(evalSummary.crisisSafetyRate * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-3 text-center">
                      <div className="text-[10px] text-[var(--foreground-muted)]">نشت نام برند</div>
                      <div className="text-base font-black text-emerald-600 mt-1" dir="ltr">
                        {evalSummary.whiteLabelLeaks}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Knowledge Gaps Queue */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-[var(--foreground)]">
                  صف پرسش‌های دارای شکاف دانش (تبدیل تک‌کلیکی به پاسخ طلایی استاد)
                </h3>
                {!telemetry?.recentKnowledgeGaps?.length ? (
                  <p className="text-xs text-[var(--foreground-muted)] rounded-xl bg-[var(--surface-sunken)] p-4">
                    هم‌اکنون پرسشِ بی‌پاسخ یا کم‌امتیازی ثبت نشده است. به‌محض دریافت پرسش‌های جدید کاربران، موارد نیازمند آموزش اینجا ظاهر می‌شوند.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {telemetry.recentKnowledgeGaps.map((gap) => (
                      <div
                        key={gap.id}
                        className="rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-3.5 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-[var(--foreground)]">{gap.querySanitized}</div>
                          <div className="text-[11px] text-[var(--foreground-muted)]">
                            زبان: {gap.locale.toUpperCase()} • منابع یافت‌شده: {gap.citationCount} • امتیاز: {gap.topScore}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePromoteGapToGoldenQa(gap.querySanitized, gap.locale)}
                          className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold"
                        >
                          <ArrowUpLeft size={14} />
                          <span>تبدیل به پاسخ طلایی</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* User Feedback Triage */}
              {telemetry && telemetry.recentFeedback.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-[var(--foreground)]">بازخوردهای اخیر کاربران</h3>
                  <div className="space-y-2">
                    {telemetry.recentFeedback.slice(0, 10).map((fb) => (
                      <div
                        key={fb.id}
                        className="rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-3.5 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-bold text-[var(--foreground)]">
                            {fb.rating === 1 ? (
                              <ThumbsUp size={13} className="text-emerald-600" />
                            ) : (
                              <ThumbsDown size={13} className="text-rose-600" />
                            )}
                            <span>{fb.queryPreview || 'بازخورد روی پاسخ دستیار'}</span>
                          </div>
                          {fb.userNote && <p className="text-[11px] text-[var(--foreground-muted)]">{fb.userNote}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          {fb.rating === -1 && fb.queryPreview && (
                            <button
                              type="button"
                              onClick={() => handlePromoteGapToGoldenQa(fb.queryPreview || '', fb.locale || 'fa')}
                              className="px-2.5 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-[11px] font-bold"
                            >
                              تبدیل به پاسخ طلایی
                            </button>
                          )}
                          {fb.triagedStatus === 'open' && (
                            <button
                              type="button"
                              onClick={() => handleTriageFeedback(fb.id, 'dismissed')}
                              className="px-2.5 py-1.5 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[11px] font-bold text-[var(--foreground-muted)]"
                            >
                              بستن
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 2: GOLDEN Q&A BANK */}
          {subTab === 'golden_qa' && (
            <div className="space-y-6">
              <form
                onSubmit={handleSaveGoldenQa}
                className="rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-[var(--foreground)]">
                    {gqaId ? 'ویرایش پاسخ طلایی مصوب استاد' : 'افزودن پاسخ طلایی جدید (با امضای Ed25519 و اولویت بالا)'}
                  </h3>
                  {gqaId && (
                    <button
                      type="button"
                      onClick={() => {
                        setGqaId(undefined);
                        setGqaQuestion('');
                        setGqaAnswer('');
                        setGqaVariants('');
                        setGqaLinks('');
                      }}
                      className="text-xs font-bold text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    >
                      انصراف از ویرایش
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <AccessibleListbox label="زبان پاسخ طلایی" value={gqaLocale} options={LOCALE_OPTIONS} onChange={setGqaLocale} />
                  <AccessibleListbox label="رکن موضوعی" value={gqaPillar} options={PILLAR_OPTIONS} onChange={setGqaPillar} />
                  <div>
                    <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">ضریب اولویت (۱ تا ۲٫۵)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="1"
                      max="2.5"
                      value={gqaBoost}
                      onChange={(e) => setGqaBoost(e.target.value)}
                      dir="ltr"
                      className="w-full min-h-[44px] rounded-xl bg-[var(--surface-card)] border border-[var(--border-medium)] px-3 text-xs text-[var(--foreground)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">پرسش معیار پژوهشگر</label>
                  <input
                    required
                    value={gqaQuestion}
                    onChange={(e) => setGqaQuestion(e.target.value)}
                    placeholder="مثال: تفاوت دگرشنیدن با گوش دادن عادی از دیدگاه دکتر مکارمی چیست؟"
                    className="w-full min-h-[44px] rounded-xl bg-[var(--surface-card)] border border-[var(--border-medium)] px-3.5 text-xs text-[var(--foreground)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">
                    صورت‌های دیگر طرح همین پرسش (هر خط یک صورت — اختیاری)
                  </label>
                  <textarea
                    rows={2}
                    value={gqaVariants}
                    onChange={(e) => setGqaVariants(e.target.value)}
                    placeholder="دگرشنیدن چیست؟"
                    className="w-full rounded-xl bg-[var(--surface-card)] border border-[var(--border-medium)] p-3 text-xs text-[var(--foreground)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">
                    پاسخ قطعی و مصوب استاد (با پشتیبانی از Markdown)
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={gqaAnswer}
                    onChange={(e) => setGqaAnswer(e.target.value)}
                    placeholder="متن دقیق و مستند مورد تأیید استاد..."
                    className="w-full rounded-xl bg-[var(--surface-card)] border border-[var(--border-medium)] p-3 text-xs text-[var(--foreground)] leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">
                    پیوند آثار مرجع مرتبط در سایت (هر خط یک مسیر نسبی، مثلاً /fa/books/hafez-par-hafez)
                  </label>
                  <textarea
                    rows={2}
                    dir="ltr"
                    value={gqaLinks}
                    onChange={(e) => setGqaLinks(e.target.value)}
                    placeholder="/fa/psychoanalysis/articles/is-psychoanalysis-a-science"
                    className="w-full rounded-xl bg-[var(--surface-card)] border border-[var(--border-medium)] p-3 text-xs font-mono text-[var(--foreground)]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-bold text-xs disabled:opacity-50"
                >
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  <span>ذخیره و نمایه‌سازی فوری پاسخ طلایی</span>
                </button>
              </form>

              <div className="space-y-2.5">
                <h3 className="text-sm font-extrabold text-[var(--foreground)]">
                  فهرست پاسخ‌های طلایی فعال ({goldenQaList.length.toLocaleString('fa-IR')} مورد)
                </h3>
                {goldenQaList.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-4 space-y-2"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--primary-light)] text-[var(--primary)] ml-2">
                          {item.locale.toUpperCase()} • {item.pillar}
                        </span>
                        <span className="text-xs font-extrabold text-[var(--foreground)]">{item.questionCanonical}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setGqaId(item.id);
                            setGqaLocale(item.locale);
                            setGqaPillar(item.pillar);
                            setGqaQuestion(item.questionCanonical);
                            setGqaVariants(item.questionVariants.join('\n'));
                            setGqaAnswer(item.answerMarkdown);
                            setGqaLinks(item.linkedUrls.join('\n'));
                            setGqaBoost(String(item.priorityBoost));
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[11px] font-bold"
                        >
                          ویرایش
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteGoldenQa(item.id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-500/10"
                          title="حذف پاسخ طلایی"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--foreground-muted)] leading-relaxed line-clamp-3">
                      {item.answerMarkdown}
                    </p>
                    <div className="text-[10px] font-mono text-[var(--foreground-muted)]" dir="ltr">
                      SHA-256: {item.contentSha256.slice(0, 14)}... • Boost ×{item.priorityBoost}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-TAB 3: LIVING GLOSSARY & CONCEPT GRAPH */}
          {subTab === 'glossary' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Add/Edit Term */}
                <form
                  onSubmit={handleSaveGlossaryTerm}
                  className="rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-5 space-y-3.5"
                >
                  <h3 className="text-sm font-extrabold text-[var(--foreground)]">افزودن اصطلاح سه‌زبانه به واژه‌نامه زنده</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input
                      required
                      value={termFa}
                      onChange={(e) => setTermFa(e.target.value)}
                      placeholder="اصطلاح فارسی"
                      className="min-h-[42px] rounded-xl bg-[var(--surface-card)] border border-[var(--border-medium)] px-3 text-xs"
                    />
                    <input
                      required
                      value={termFr}
                      onChange={(e) => setTermFr(e.target.value)}
                      placeholder="Terme français"
                      dir="ltr"
                      className="min-h-[42px] rounded-xl bg-[var(--surface-card)] border border-[var(--border-medium)] px-3 text-xs"
                    />
                    <input
                      required
                      value={termEn}
                      onChange={(e) => setTermEn(e.target.value)}
                      placeholder="English term"
                      dir="ltr"
                      className="min-h-[42px] rounded-xl bg-[var(--surface-card)] border border-[var(--border-medium)] px-3 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <AccessibleListbox label="رکن موضوعی" value={termPillar} options={PILLAR_OPTIONS} onChange={setTermPillar} />
                    <div>
                      <label className="block text-xs font-bold mb-1.5">مترادف‌ها (با ویرگول جدا کنید)</label>
                      <input
                        value={termAliases}
                        onChange={(e) => setTermAliases(e.target.value)}
                        placeholder="دگرشنیدن، دیگرشنیدن، écouter autrement"
                        className="w-full min-h-[42px] rounded-xl bg-[var(--surface-card)] border border-[var(--border-medium)] px-3 text-xs"
                      />
                    </div>
                  </div>
                  <textarea
                    required
                    rows={2}
                    value={termDefFa}
                    onChange={(e) => setTermDefFa(e.target.value)}
                    placeholder="تعریف دقیق مفهومی به فارسی..."
                    className="w-full rounded-xl bg-[var(--surface-card)] border border-[var(--border-medium)] p-3 text-xs"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <textarea
                      rows={2}
                      dir="ltr"
                      value={termDefFr}
                      onChange={(e) => setTermDefFr(e.target.value)}
                      placeholder="Définition française (optionnel)..."
                      className="w-full rounded-xl bg-[var(--surface-card)] border border-[var(--border-medium)] p-2.5 text-xs"
                    />
                    <textarea
                      rows={2}
                      dir="ltr"
                      value={termDefEn}
                      onChange={(e) => setTermDefEn(e.target.value)}
                      placeholder="British English definition (optional)..."
                      className="w-full rounded-xl bg-[var(--surface-card)] border border-[var(--border-medium)] p-2.5 text-xs"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold">
                    <input
                      type="checkbox"
                      checked={termLocked}
                      onChange={(e) => setTermLocked(e.target.checked)}
                      className="w-4 h-4 accent-[var(--primary)]"
                    />
                    <span>قفل ترجمهٔ تخصصی (الزام رعایت معادل ثابت در ترجمه و پاسخ دستیار)</span>
                  </label>
                  <button
                    type="submit"
                    disabled={busy}
                    className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-xs"
                  >
                    <Plus size={14} />
                    <span>ثبت اصطلاح در مغز جستجو</span>
                  </button>
                </form>

                {/* Add Concept Edge */}
                <form
                  onSubmit={handleAddConceptEdge}
                  className="rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-5 space-y-3.5"
                >
                  <h3 className="text-sm font-extrabold text-[var(--foreground)]">
                    تعریف پیوند در گراف مفاهیم ({conceptEdges.length.toLocaleString('fa-IR')} پیوند فعال)
                  </h3>
                  <AccessibleListbox
                    label="مفهوم مبدأ"
                    value={edgeSource}
                    options={termOptions}
                    onChange={setEdgeSource}
                    searchable
                  />
                  <AccessibleListbox
                    label="مفهوم مقصد"
                    value={edgeTarget}
                    options={termOptions}
                    onChange={setEdgeTarget}
                    searchable
                  />
                  <AccessibleListbox
                    label="نوع رابطهٔ معنایی"
                    value={edgeRel}
                    options={EDGE_RELATION_OPTIONS}
                    onChange={setEdgeRel}
                  />
                  <input
                    value={edgeNote}
                    onChange={(e) => setEdgeNote(e.target.value)}
                    placeholder="توضیح کوتاه پیوند (اختیاری)..."
                    className="w-full min-h-[42px] rounded-xl bg-[var(--surface-card)] border border-[var(--border-medium)] px-3 text-xs"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-xs"
                  >
                    <Network size={14} />
                    <span>ثبت پیوند مفهومی</span>
                  </button>
                </form>
              </div>

              {/* Searchable Glossary List */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-extrabold text-[var(--foreground)]">
                    واژه‌نامهٔ زنده ({filteredGlossary.length.toLocaleString('fa-IR')} از {glossaryTerms.length.toLocaleString('fa-IR')} مدخل)
                  </h3>
                  <input
                    value={glossaryFilter}
                    onChange={(e) => setGlossaryFilter(e.target.value)}
                    placeholder="جستجو در اصطلاحات فارسی، فرانسوی یا انگلیسی..."
                    className="min-h-[38px] w-full sm:w-72 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] px-3 text-xs"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto pl-1">
                  {filteredGlossary.map((term) => (
                    <div
                      key={term.id}
                      className="rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-3.5 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-[var(--foreground)]">{term.term_fa}</span>
                        {term.is_locked_translation && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                            قفل‌شده
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--foreground-muted)]" dir="ltr">
                        {term.term_fr} · {term.term_en}
                      </div>
                      <p className="text-[11px] text-[var(--foreground-muted)] line-clamp-2 leading-relaxed">
                        {term.conceptual_definition_fa}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 4: UNSTRUCTURED TRAINING DOCUMENTS INGESTOR */}
          {subTab === 'documents' && (
            <div className="space-y-6">
              <form
                onSubmit={handleIngestTrainingDoc}
                className="rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-[var(--foreground)]">
                      آموزش مستقیم از جزوه‌ها، یادداشت‌ها، زیرنویس‌ها و متون تازه
                    </h3>
                    <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                      متن پس از نرمال‌سازی نیم‌فاصله و امضای Ed25519 فوراً در لایهٔ آموزشی نمایه می‌شود (بدون تغییر روی خزانهٔ اصلی).
                    </p>
                  </div>
                  <label className="min-h-[40px] cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-medium)] hover:border-[var(--primary)] text-xs font-bold">
                    <Upload size={14} />
                    <span>بارگذاری فایل متنی (.md / .txt / .srt / .vtt)</span>
                    <input type="file" accept=".md,.txt,.srt,.vtt" onChange={handleFileUploadForDoc} className="hidden" />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <AccessibleListbox label="قالب سند" value={docFormat} options={DOC_FORMAT_OPTIONS} onChange={setDocFormat} />
                  <AccessibleListbox label="زبان سند" value={docLocale} options={LOCALE_OPTIONS} onChange={setDocLocale} />
                  <AccessibleListbox label="رکن موضوعی" value={docPillar} options={PILLAR_OPTIONS} onChange={setDocPillar} />
                </div>

                <input
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="عنوان جزوه، سمینار یا یادداشت آموزشی..."
                  className="w-full min-h-[44px] rounded-xl bg-[var(--surface-card)] border border-[var(--border-medium)] px-3.5 text-xs"
                />

                <textarea
                  required
                  rows={6}
                  value={docBody}
                  onChange={(e) => setDocBody(e.target.value)}
                  placeholder="متن کامل جزوه، یادداشت سمینار یا متن استخراج‌شده از PDF را اینجا وارد کنید (حداقل ۴۰ کاراکتر)..."
                  className="w-full rounded-xl bg-[var(--surface-card)] border border-[var(--border-medium)] p-3.5 text-xs leading-relaxed"
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] text-[var(--foreground-muted)]">
                    تخمین زنده: {liveWordEstimate.toLocaleString('fa-IR')} واژه (~{Math.max(1, Math.ceil(liveWordEstimate / 320)).toLocaleString('fa-IR')} قطعهٔ جستجو)
                  </span>
                  <button
                    type="submit"
                    disabled={busy}
                    className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-xs disabled:opacity-50"
                  >
                    {busy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                    <span>امضا و نمایه‌سازی در مغز دستیار</span>
                  </button>
                </div>
              </form>

              <div className="space-y-2.5">
                <h3 className="text-sm font-extrabold text-[var(--foreground)]">
                  اسناد آموزشی نمایه‌شده ({trainingDocs.length.toLocaleString('fa-IR')} سند)
                </h3>
                {trainingDocs.length === 0 ? (
                  <p className="text-xs text-[var(--foreground-muted)] rounded-xl bg-[var(--surface-sunken)] p-4">
                    هنوز سند آموزشی اضافی از طریق پیشخوان بارگذاری نشده است.
                  </p>
                ) : (
                  trainingDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-4 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-extrabold text-[var(--foreground)]">{doc.title}</div>
                        <div className="text-[11px] text-[var(--foreground-muted)]">
                          قالب: {doc.sourceFormat} • زبان: {doc.locale.toUpperCase()} • {doc.wordCount.toLocaleString('fa-IR')} واژه ({doc.chunkCount} قطعه)
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteTrainingDoc(doc.id)}
                        className="p-2 rounded-lg text-rose-600 hover:bg-rose-500/10"
                        title="حذف سند آموزشی"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* SUB-TAB 1: MASTER CONSTITUTION & VERSIONED PERSONA */}
          {subTab === 'constitution' && (
            <div className="space-y-6">
              <form
                onSubmit={handleSavePersona}
                className="rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-extrabold text-[var(--foreground)]">
                    ویرایش منشور معرفتی، لحن علمی و مرزهای اخلاق بالینی (نسخهٔ فعال: {activePersona?.versionId || 1})
                  </h3>
                  <span className="text-[11px] font-mono text-[var(--foreground-muted)]" dir="ltr">
                    Ed25519 Signed
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1.5">برچسب نسخهٔ جدید منشور</label>
                    <input
                      required
                      value={personaLabel}
                      onChange={(e) => setPersonaLabel(e.target.value)}
                      className="w-full min-h-[42px] rounded-xl bg-[var(--surface-card)] border border-[var(--border-medium)] px-3 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5">سقف بودجهٔ توکن ماهانه (محافظ هزینه)</label>
                    <input
                      type="number"
                      min="100000"
                      step="100000"
                      dir="ltr"
                      value={monthlyBudget}
                      onChange={(e) => setMonthlyBudget(e.target.value)}
                      className="w-full min-h-[42px] rounded-xl bg-[var(--surface-card)] border border-[var(--border-medium)] px-3 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-3 flex items-center justify-between gap-3 text-xs font-bold">
                    <span>پروتکل ایمنی بحران بالینی (3114 فرانسه / 1480 ایران)</span>
                    <input
                      type="checkbox"
                      checked={enableCrisis}
                      onChange={(e) => setEnableCrisis(e.target.checked)}
                      className="w-4 h-4 accent-[var(--primary)]"
                    />
                  </label>
                  <label className="rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-3 flex items-center justify-between gap-3 text-xs font-bold">
                    <span>فعال‌سازی موتور پشتیبان سریع در صورت نبود کلید اصلی</span>
                    <input
                      type="checkbox"
                      checked={enableFastFallback}
                      onChange={(e) => setEnableFastFallback(e.target.checked)}
                      className="w-4 h-4 accent-[var(--primary)]"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5">منشور معرفتی فارسی (FA)</label>
                  <textarea
                    required
                    rows={5}
                    value={constFa}
                    onChange={(e) => setConstFa(e.target.value)}
                    className="w-full rounded-xl bg-[var(--surface-card)] border border-[var(--border-medium)] p-3 text-xs leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1.5">منشور فرانسوی (FR)</label>
                    <textarea
                      required
                      rows={4}
                      dir="ltr"
                      value={constFr}
                      onChange={(e) => setConstFr(e.target.value)}
                      className="w-full rounded-xl bg-[var(--surface-card)] border border-[var(--border-medium)] p-3 text-xs leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5">منشور انگلیسی بریتانیایی (EN)</label>
                    <textarea
                      required
                      rows={4}
                      dir="ltr"
                      value={constEn}
                      onChange={(e) => setConstEn(e.target.value)}
                      className="w-full rounded-xl bg-[var(--surface-card)] border border-[var(--border-medium)] p-3 text-xs leading-relaxed"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-xs disabled:opacity-50"
                >
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                  <span>ثبت نسخهٔ جدید منشور با امضای Ed25519</span>
                </button>
              </form>

              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-[var(--foreground)]">
                  تاریخچهٔ نسخه‌های منشور (بازگشت تک‌کلیکی)
                </h3>
                {personaVersions.map((v) => (
                  <div
                    key={v.versionId}
                    className="rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-3.5 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-extrabold text-[var(--foreground)]">
                        نسخهٔ {v.versionId} — {v.label}
                      </div>
                      <div className="text-[11px] text-[var(--foreground-muted)] mt-0.5">
                        سقف بودجه: {v.monthlyTokenBudget.toLocaleString('fa-IR')} توکن • ثبت: {v.createdAt.slice(0, 10)}
                      </div>
                    </div>
                    {v.isActive ? (
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                        نسخهٔ فعال
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleActivatePersonaVersion(v.versionId)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-card)] border border-[var(--border-medium)] text-xs font-bold"
                      >
                        <RotateCcw size={13} />
                        <span>بازگردانی و فعال‌سازی</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
