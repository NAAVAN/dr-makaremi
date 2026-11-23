'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Scale,
  Receipt,
  Download,
  CheckCircle2,
  ShieldCheck,
  Landmark,
  RotateCcw,
  Save,
  RefreshCw,
} from 'lucide-react';
import type {
  ArtworkAuthenticityCertificate,
  CommerceAvailability,
  CommerceCatalogItem,
  CommerceLegalConfig,
  CommerceOrder,
  CommerceWithdrawalRequest,
} from '@makaremi/shared';
import { formatEur } from '@/lib/commerce/rules';

interface StudioCommercePayload {
  legalConfig: CommerceLegalConfig;
  catalog: CommerceCatalogItem[];
  orders: CommerceOrder[];
  withdrawals: CommerceWithdrawalRequest[];
  certificates: ArtworkAuthenticityCertificate[];
  stripeMode: 'live' | 'test' | 'unconfigured';
  emailConfigured: boolean;
  stats: {
    totalCatalogItems: number;
    availableCount: number;
    totalOrders: number;
    paidOrdersCount: number;
    pendingSepaCount: number;
    totalArtisteAuteurCents: number;
    totalCommercialBicCents: number;
    withdrawalCount: number;
    certificateCount: number;
  };
}

export function StudioCommercePanel() {
  const [data, setData] = useState<StudioCommercePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<'catalog' | 'orders' | 'legal' | 'accounting'>('catalog');
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [savingSku, setSavingSku] = useState<string | null>(null);
  const [savingLegal, setSavingLegal] = useState(false);

  // Editable catalog drafts keyed by SKU
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [availDrafts, setAvailDrafts] = useState<Record<string, CommerceAvailability>>({});
  const [dimDrafts, setDimDrafts] = useState<Record<string, string>>({});

  // Editable legal config form
  const [legalDraft, setLegalDraft] = useState<Partial<CommerceLegalConfig>>({});

  const loadCommerce = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/studio/commerce', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.ok) {
        setData(json);
        setLegalDraft(json.legalConfig || {});
        const pMap: Record<string, string> = {};
        const aMap: Record<string, CommerceAvailability> = {};
        const dMap: Record<string, string> = {};
        for (const item of json.catalog as CommerceCatalogItem[]) {
          pMap[item.sku] = item.priceEurCents !== null ? String(item.priceEurCents / 100) : '';
          aMap[item.sku] = item.availability;
          dMap[item.sku] = item.physicalSpecs?.dimensionsCm || '';
        }
        setPriceDrafts(pMap);
        setAvailDrafts(aMap);
        setDimDrafts(dMap);
      }
    } catch {
      setFeedback({ kind: 'err', text: 'خطا در بارگذاری اطلاعات فروشگاه پیشخوان.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCommerce();
  }, [loadCommerce]);

  const handleSaveSku = async (item: CommerceCatalogItem) => {
    setSavingSku(item.sku);
    setFeedback(null);
    const rawPrice = (priceDrafts[item.sku] || '').trim();
    const numericEur = rawPrice === '' ? null : Math.round(Number(rawPrice) * 100);
    if (numericEur !== null && (!Number.isFinite(numericEur) || numericEur < 100)) {
      setFeedback({ kind: 'err', text: 'مبلغ یورو نامعتبر است (حداقل ۱ یورو).' });
      setSavingSku(null);
      return;
    }

    try {
      const res = await fetch('/api/studio/commerce', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert_catalog_item',
          sku: item.sku,
          availability: availDrafts[item.sku] || item.availability,
          priceEurCents: numericEur,
          dimensionsCm: dimDrafts[item.sku] || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setFeedback({ kind: 'err', text: json.error || 'ذخیره تغییر ناموفق بود.' });
      } else {
        setFeedback({ kind: 'ok', text: `تغییرات اثر ${item.sku} با موفقیت ذخیره و در فروشگاه زنده اعمال شد.` });
        await loadCommerce();
      }
    } catch {
      setFeedback({ kind: 'err', text: 'خطای ارتباط با سرور.' });
    } finally {
      setSavingSku(null);
    }
  };

  const handleSaveLegal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLegal(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/studio/commerce', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_legal_config',
          patch: {
            siret: legalDraft.siret,
            apeCode: legalDraft.apeCode,
            urssafArtisteAuteurRef: legalDraft.urssafArtisteAuteurRef,
            addressLine1: legalDraft.addressLine1,
            postalCodeCity: legalDraft.postalCodeCity,
            email: legalDraft.email,
            phone: legalDraft.phone,
            taxMode: legalDraft.taxMode,
            vatNumber: legalDraft.vatNumber || null,
            mediatorName: legalDraft.mediatorName,
            mediatorAddress: legalDraft.mediatorAddress,
            sepaAccountHolder: legalDraft.sepaAccountHolder,
            sepaIban: legalDraft.sepaIban,
            sepaBic: legalDraft.sepaBic,
            sepaBankName: legalDraft.sepaBankName,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setFeedback({ kind: 'err', text: json.error || 'ذخیره تنظیمات حقوقی ناموفق بود.' });
      } else {
        setFeedback({
          kind: 'ok',
          text: 'مشخصات حقوقی فرانسه (SIRET، TVA، میانجی و حساب SEPA) ذخیره و در کل صفحات قانونی و فاکتورها اعمال شد.',
        });
        await loadCommerce();
      }
    } catch {
      setFeedback({ kind: 'err', text: 'خطای ارتباط با سرور.' });
    } finally {
      setSavingLegal(false);
    }
  };

  const handleOrderStatus = async (orderId: string, status: CommerceOrder['status']) => {
    setFeedback(null);
    try {
      const res = await fetch('/api/studio/commerce', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_order_status',
          orderId,
          status,
        }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setFeedback({
          kind: 'ok',
          text:
            status === 'paid'
              ? 'واریز تأیید شد؛ فاکتور نهایی و گواهی اصالت رمزنگاری‌شده Ed25519 به‌صورت خودکار صادر گردید.'
              : 'وضعیت سفارش به‌روزرسانی شد.',
        });
        await loadCommerce();
      } else {
        setFeedback({ kind: 'err', text: json.error || 'خطا در تغییر وضعیت سفارش.' });
      }
    } catch {
      setFeedback({ kind: 'err', text: 'خطا در ارتباط با سرور.' });
    }
  };

  if (loading || !data) {
    return (
      <div className="p-8 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-center text-sm text-[var(--foreground-muted)]">
        در حال بارگذاری میز مدیریت فروشگاه و مقررات فرانسه...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Header Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-1">
          <span className="text-xs text-[var(--foreground-muted)]">آثار فعال در فروشگاه</span>
          <p className="text-2xl font-black text-[var(--foreground)] font-mono tabular-nums">
            {data.stats.availableCount} / {data.stats.totalCatalogItems}
          </p>
          <span className="text-[11px] text-emerald-600 font-bold">تابلو اصل، چاپ فاخر و کتاب</span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-1">
          <span className="text-xs text-[var(--foreground-muted)]">سفارش‌ها / در انتظار SEPA</span>
          <p className="text-2xl font-black text-[var(--foreground)] font-mono tabular-nums">
            {data.stats.totalOrders} ({data.stats.pendingSepaCount} SEPA)
          </p>
          <span className="text-[11px] text-amber-700 dark:text-amber-400 font-bold">
            گواهی اصالت صادرشده: {data.stats.certificateCount}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-1">
          <span className="text-xs text-[var(--foreground-muted)]">درآمد هنرمند-مؤلف (URSSAF)</span>
          <p className="text-2xl font-black text-[var(--primary)] font-mono tabular-nums">
            {formatEur(data.stats.totalArtisteAuteurCents, 'fr')}
          </p>
          <span className="text-[11px] text-[var(--foreground-muted)]">سقف معافیت TVA: ۵۰٬۰۰۰ €</span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-1">
          <span className="text-xs text-[var(--foreground-muted)]">وضعیت درگاه Stripe France</span>
          <p className="text-lg font-black text-[var(--foreground)]">
            {data.stripeMode === 'live'
              ? 'متصل و زنده (Live)'
              : data.stripeMode === 'test'
                ? 'حالت آزمایشی (Test)'
                : 'آماده اتصال کلید (SEPA فعال)'}
          </p>
          <span className="text-[11px] text-[var(--foreground-muted)]">
            رژیم TVA: {data.legalConfig.taxMode === 'franchise_en_base' ? 'معاف (Art. 293 B)' : 'TVA فعال'}
          </span>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            feedback.kind === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-500/10 border-red-500/35 text-red-700 dark:text-red-400'
          }`}
        >
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Sub-navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'catalog', label: 'کاتالوگ و قیمت‌گذاری (€)', icon: ShoppingBag },
              { id: 'orders', label: `سفارش‌ها و انصراف‌ها (${data.stats.totalOrders})`, icon: Landmark },
              { id: 'legal', label: 'تنظیمات حقوقی فرانسه (SIRET / SEPA / TVA)', icon: Scale },
              { id: 'accounting', label: 'دفتر درآمد (Livre de recettes)', icon: Receipt },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            const active = subTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSubTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'bg-[var(--surface-card)] border-[var(--border-subtle)] text-[var(--foreground)] hover:border-[var(--primary)]'
                }`}
              >
                <Icon size={15} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={loadCommerce}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs font-bold hover:border-[var(--primary)] cursor-pointer"
        >
          <RefreshCw size={13} />
          <span>بروزرسانی</span>
        </button>
      </div>

      {/* TAB 1: CATALOG & PRICING */}
      {subTab === 'catalog' && (
        <div className="space-y-3">
          {data.catalog.map((item) => (
            <div
              key={item.sku}
              className="p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] grid grid-cols-1 lg:grid-cols-12 gap-4 items-center"
            >
              <div className="lg:col-span-5 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-[var(--surface-sunken)] font-bold text-[var(--primary)]">
                    {item.sku}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-800 dark:text-amber-300 font-bold">
                    {item.legalBucket === 'artiste_auteur' ? 'URSSAF هنرمند-مؤلف' : 'بازتولید/تجاری BIC'}
                  </span>
                  <span className="text-[var(--foreground-muted)]">HS: {item.hsCode}</span>
                </div>
                <p className="text-sm font-bold text-[var(--foreground)]">{item.title.fa}</p>
                <p className="text-[11px] text-[var(--foreground-muted)]">{item.title.fr}</p>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-[10px] text-[var(--foreground-muted)] mb-1">قیمت (یورو €)</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={priceDrafts[item.sku] ?? ''}
                  onChange={(e) => setPriceDrafts((prev) => ({ ...prev, [item.sku]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs font-mono"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-[10px] text-[var(--foreground-muted)] mb-1">ابعاد (مثلاً 70×100 cm)</label>
                <input
                  type="text"
                  value={dimDrafts[item.sku] ?? ''}
                  onChange={(e) => setDimDrafts((prev) => ({ ...prev, [item.sku]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs font-mono"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-[10px] text-[var(--foreground-muted)] mb-1">وضعیت موجودی</label>
                <select
                  value={availDrafts[item.sku] || item.availability}
                  onChange={(e) =>
                    setAvailDrafts((prev) => ({ ...prev, [item.sku]: e.target.value as CommerceAvailability }))
                  }
                  className="w-full px-2.5 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs font-bold"
                >
                  <option value="available">قابل تملک (فعال)</option>
                  <option value="reserved">رزرو موقت</option>
                  <option value="sold">واگذار شده (فروخته‌شده)</option>
                  <option value="inquiry_only">صرفاً استعلام قیمت</option>
                  <option value="not_for_sale">غیرقابل فروش</option>
                </select>
              </div>

              <div className="lg:col-span-1 flex justify-end">
                <button
                  type="button"
                  disabled={savingSku === item.sku}
                  onClick={() => handleSaveSku(item)}
                  className="w-full lg:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  <Save size={14} />
                  <span>ذخیره</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: ORDERS & WITHDRAWALS */}
      {subTab === 'orders' && (
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-base font-black text-[var(--foreground)]">سفارش‌های ثبت‌شده و صدور گواهی اصالت</h2>
            {data.orders.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-center text-xs text-[var(--foreground-muted)]">
                هنوز سفارشی ثبت نشده است. به‌محض ثبت سفارش از `/shop` یا صفحات آثار، در اینجا ظاهر می‌شود.
              </div>
            ) : (
              data.orders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-5 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-black text-[var(--primary)]">{ord.orderNumber}</span>
                      <span className="font-mono text-[var(--foreground-muted)]">{ord.invoiceNumber}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[var(--surface-sunken)] font-bold">
                        {ord.status}
                      </span>
                      <span className="font-mono font-black">{formatEur(ord.quote.totalCents, 'fr')}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {ord.status === 'awaiting_sepa_transfer' && (
                        <button
                          type="button"
                          onClick={() => handleOrderStatus(ord.id, 'paid')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                        >
                          <ShieldCheck size={14} />
                          <span>تأیید واریز SEPA و صدور گواهی Ed25519</span>
                        </button>
                      )}
                      {ord.status === 'paid' && (
                        <button
                          type="button"
                          onClick={() => handleOrderStatus(ord.id, 'fulfilled')}
                          className="px-3 py-1.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold cursor-pointer"
                        >
                          ثبت ارسال مرسوله
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[var(--foreground-muted)]">
                    <div>
                      <strong className="text-[var(--foreground)]">خریدار:</strong> {ord.customer.fullName} ({ord.customer.email}) — {ord.customer.countryCode}
                    </div>
                    <div>
                      <strong className="text-[var(--foreground)]">تفکیک حسابداری:</strong>{' '}
                      URSSAF: {formatEur(ord.quote.artisteAuteurTotalCents, 'fr')} | BIC: {formatEur(ord.quote.commercialBicTotalCents, 'fr')}
                    </div>
                  </div>

                  {ord.certificateIds.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">گواهی اصالت:</span>
                      {ord.certificateIds.map((cid) => (
                        <Link
                          key={cid}
                          href={`/fa/verify/${cid}`}
                          target="_blank"
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-mono text-xs font-bold hover:underline"
                        >
                          {cid}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-[var(--foreground)] flex items-center gap-2">
              <RotateCcw size={16} className="text-amber-600" />
              <span>درخواست‌های قانونی انصراف ۱۴ روزه (قانون ۱۹ ژوئن ۲۰۲۶)</span>
            </h2>
            {data.withdrawals.length === 0 ? (
              <p className="text-xs text-[var(--foreground-muted)]">درخواستی ثبت نشده است.</p>
            ) : (
              data.withdrawals.map((w) => (
                <div key={w.id} className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/30 text-xs space-y-1">
                  <div className="flex flex-wrap justify-between gap-2 font-mono font-bold">
                    <span>{w.referenceCode} • سفارش {w.orderNumber}</span>
                    <span>{w.confirmedAt}</span>
                  </div>
                  <p>{w.customerFullName} ({w.customerEmail}) — وضعیت: {w.status}</p>
                </div>
              ))
            )}
          </section>
        </div>
      )}

      {/* TAB 3: FRENCH LEGAL CONFIG */}
      {subTab === 'legal' && (
        <form onSubmit={handleSaveLegal} className="p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-5">
          <div className="space-y-1 border-b border-[var(--border-subtle)] pb-3">
            <h2 className="text-base font-black text-[var(--foreground)]">
              پیکربندی هویت حقوقی، مالیات (TVA) و حساب بانکی SEPA در فرانسه
            </h2>
            <p className="text-xs text-[var(--foreground-muted)]">
              اطلاعات ثبت‌شده در اینجا بلافاصله در صفحات `Mentions légales`، `CGV`، پیش‌فاکتورهای `SEPA` و دفتر درآمد اعمال می‌شود.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="block font-bold">شماره SIRET (۱۴ رقم فرانسه)</label>
              <input
                type="text"
                value={legalDraft.siret || ''}
                onChange={(e) => setLegalDraft((p) => ({ ...p, siret: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold">رژیم مالیات بر ارزش افزوده (TVA)</label>
              <select
                value={legalDraft.taxMode || 'franchise_en_base'}
                onChange={(e) =>
                  setLegalDraft((p) => ({ ...p, taxMode: e.target.value as CommerceLegalConfig['taxMode'] }))
                }
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] font-bold"
              >
                <option value="franchise_en_base">معافیت اولیه TVA — Franchise en base (Art. 293 B CGI)</option>
                <option value="tva_active">TVA فعال فرانسه (۵.۵٪ آثار اصل و کتاب / ۲۰٪ چاپ بازتولید)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-bold">نشانی رسمی پاریس</label>
              <input
                type="text"
                value={legalDraft.addressLine1 || ''}
                onChange={(e) => setLegalDraft((p) => ({ ...p, addressLine1: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)]"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold">کد پستی و شهر</label>
              <input
                type="text"
                value={legalDraft.postalCodeCity || ''}
                onChange={(e) => setLegalDraft((p) => ({ ...p, postalCodeCity: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)]"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold">شماره IBAN حساب اختصاصی فرانسه (SEPA)</label>
              <input
                type="text"
                value={legalDraft.sepaIban || ''}
                onChange={(e) => setLegalDraft((p) => ({ ...p, sepaIban: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold">کد BIC / SWIFT</label>
              <input
                type="text"
                value={legalDraft.sepaBic || ''}
                onChange={(e) => setLegalDraft((p) => ({ ...p, sepaBic: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold">نام میانجی رسمی مصرف‌کننده (الزامی Art. L612-1)</label>
              <input
                type="text"
                value={legalDraft.mediatorName || ''}
                onChange={(e) => setLegalDraft((p) => ({ ...p, mediatorName: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)]"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold">نشانی میانجی مصرف‌کننده</label>
              <input
                type="text"
                value={legalDraft.mediatorAddress || ''}
                onChange={(e) => setLegalDraft((p) => ({ ...p, mediatorAddress: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingLegal}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-black disabled:opacity-50 cursor-pointer"
          >
            <Save size={15} />
            <span>{savingLegal ? 'در حال ذخیره...' : 'ذخیره و انتشار در صفحات قانونی و فاکتورها'}</span>
          </button>
        </form>
      )}

      {/* TAB 4: FRENCH ACCOUNTING LEDGER */}
      {subTab === 'accounting' && (
        <div className="p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-5">
          <div className="space-y-1">
            <h2 className="text-base font-black text-[var(--foreground)]">
              خروجی رسمی دفتر درآمد فرانسه (Livre de recettes — تفکیک URSSAF Limousin از BIC)
            </h2>
            <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
              مطابق قوانین مالیاتی و اجتماعی فرانسه (Décret 2020-1095 و CGI Art. 98 A)، درآمد آثار اصل و کتاب‌های خودنشر (`Artiste-Auteur`) به‌طور خودکار از درآمد چاپ‌های بازتولید Fine Art و نسخه‌های تجاری (`Micro-entreprise BIC`) تفکیک می‌شود تا تحویل به حسابدار رسمی (`Expert-comptable`) بی‌نقص باشد.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] space-y-1">
              <span className="font-bold text-[var(--primary)]">بخش اول: Artiste-Auteur (URSSAF Limousin)</span>
              <p className="text-xl font-black font-mono tabular-nums">
                {formatEur(data.stats.totalArtisteAuteurCents, 'fr')}
              </p>
              <span className="text-[11px] text-[var(--foreground-muted)]">آثار اصل دستی + کتاب‌های خودنشر دیجیتال + حمایت</span>
            </div>
            <div className="p-4 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] space-y-1">
              <span className="font-bold text-amber-700 dark:text-amber-400">بخش دوم: Commercial / Micro-entreprise (BIC)</span>
              <p className="text-xl font-black font-mono tabular-nums">
                {formatEur(data.stats.totalCommercialBicCents, 'fr')}
              </p>
              <span className="text-[11px] text-[var(--foreground-muted)]">چاپ‌های بازتولید Fine Art + نسخه‌های خریداری‌شده از ناشر</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="/api/studio/commerce/ledger?bucket=all"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold"
            >
              <Download size={14} />
              <span>دانلود کل دفتر درآمد (CSV)</span>
            </a>
            <a
              href="/api/studio/commerce/ledger?bucket=artiste_auteur"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs font-bold hover:border-[var(--primary)]"
            >
              <Download size={14} />
              <span>خروجی اختصاصی URSSAF Limousin (Artiste-Auteur)</span>
            </a>
            <a
              href="/api/studio/commerce/ledger?bucket=commercial_bic"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs font-bold hover:border-[var(--primary)]"
            >
              <Download size={14} />
              <span>خروجی اختصاصی Micro-entreprise (BIC)</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
