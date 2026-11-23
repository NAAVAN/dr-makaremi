'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X,
  ShoppingBag,
  Trash2,
  CreditCard,
  Landmark,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Check,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import type { CommerceLegalConfig, CommercePaymentMethod, Locale } from '@makaremi/shared';
import { useAcquisitionCart } from './CartProvider';
import {
  ALLOWED_SHIPPING_COUNTRIES,
  calculateFrenchCommerceQuote,
  formatEur,
} from '@/lib/commerce/rules';

interface AcquisitionCartDrawerProps {
  locale: Locale;
  legalConfig: CommerceLegalConfig;
  stripeMode: 'live' | 'test' | 'unconfigured';
}

export function AcquisitionCartDrawer({
  locale,
  legalConfig,
  stripeMode,
}: AcquisitionCartDrawerProps) {
  const router = useRouter();
  const { items, isOpen, closeDrawer, removeItem, updateQuantity, updateDedication, clearCart } =
    useAcquisitionCart();

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const tx = (fa: string, fr: string, en: string) => (isFa ? fa : isFr ? fr : en);

  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [countryCode, setCountryCode] = useState('FR');
  const [paymentMethod, setPaymentMethod] = useState<CommercePaymentMethod>('stripe_card');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');

  // Mandatory French Consumer Code legal checkboxes
  const [cgvAccepted, setCgvAccepted] = useState(false);
  const [digitalWaiverAccepted, setDigitalWaiverAccepted] = useState(false);
  const [customWaiverAccepted, setCustomWaiverAccepted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quote = useMemo(() => {
    if (items.length === 0) return null;
    try {
      return calculateFrenchCommerceQuote({
        items,
        countryCode,
        legalConfig,
      });
    } catch {
      return null;
    }
  }, [items, countryCode, legalConfig]);

  // Keep payment method aligned with eligibility (auto-highlight SEPA above €2,500 or if Stripe not yet configured)
  useEffect(() => {
    if (!quote) return;
    if (quote.sepaRecommended && quote.eligiblePaymentMethods.includes('sepa_wire')) {
      setPaymentMethod('sepa_wire');
    } else if (!quote.eligiblePaymentMethods.includes(paymentMethod)) {
      setPaymentMethod(quote.eligiblePaymentMethods[0] || 'sepa_wire');
    }
  }, [quote, paymentMethod]);

  useEffect(() => {
    if (!isOpen) {
      setStep('cart');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote) return;
    setError(null);

    if (!cgvAccepted) {
      setError(
        tx(
          'پذیرش شرایط عمومی فروش (CGV) پیش از ثبت سفارش الزامی است.',
          'Veuillez accepter les Conditions Générales de Vente (CGV) avant de valider.',
          'You must accept the General Terms of Sale (CGV) before ordering.'
        )
      );
      return;
    }

    if (quote.requiresDigitalWaiver && !digitalWaiverAccepted) {
      setError(
        tx(
          'برای تحویل فوری نسخه دیجیتال، تأیید تیک انصراف از حق Rétractation ۱۴ روزه (ماده L.221-28 13°) الزامی است.',
          'Pour le téléchargement immédiat d’un contenu numérique, votre renonciation expresse au droit de rétractation (art. L.221-28 13°) est obligatoire.',
          'Explicit waiver of the 14-day withdrawal right (Art. L.221-28 13°) is required for instant digital delivery.'
        )
      );
      return;
    }

    if (quote.requiresCustomWaiver && !customWaiverAccepted) {
      setError(
        tx(
          'برای سفارش خوشنویسی اختصاصی، تأیید استثنای حق انصراف (ماده L.221-28 3°) الزامی است.',
          'Pour une commande calligraphique sur mesure, la reconnaissance de l’exclusion du droit de rétractation (art. L.221-28 3°) est obligatoire.',
          'Acknowledgment of the bespoke artwork withdrawal exception (Art. L.221-28 3°) is required.'
        )
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/commerce/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale,
          paymentMethod,
          items: items.map((i) => ({
            sku: i.product.sku,
            quantity: i.quantity,
            customDedication: i.customDedication,
          })),
          customer: {
            fullName: fullName.trim(),
            email: email.trim(),
            phone: phone.trim() || undefined,
            addressLine1: addressLine1.trim() || undefined,
            postalCode: postalCode.trim() || undefined,
            city: city.trim() || undefined,
            countryCode,
            notes: notes.trim() || undefined,
          },
          cgvAccepted,
          digitalWithdrawalWaived: digitalWaiverAccepted,
          customOrderWaived: customWaiverAccepted,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data.code === 'stripe_not_configured') {
          setError(
            tx(
              'کلید درگاه Stripe هنوز در تنظیمات سرور فعال نشده است. می‌توانید همین الان با انتخاب گزینه «واریز بانکی SEPA / پیش‌فاکتور رسمی» اثر را با کارمزد ۰٪ رزرو و ثبت کنید.',
              'La passerelle Stripe n’est pas encore activée sur cet environnement. Vous pouvez réserver immédiatement votre œuvre par « Virement bancaire SEPA (0 % de frais) ».',
              'Stripe card checkout is not yet activated on this preview. You may switch to "SEPA Wire / Official Pro Forma (0% fee)" to reserve immediately.'
            )
          );
          if (quote.eligiblePaymentMethods.includes('sepa_wire')) {
            setPaymentMethod('sepa_wire');
          }
        } else {
          setError(data.error || tx('خطا در ثبت سفارش.', 'Erreur lors de la commande.', 'Order submission error.'));
        }
        setSubmitting(false);
        return;
      }

      if (data.checkoutUrl) {
        clearCart();
        window.location.assign(data.checkoutUrl);
        return;
      }

      if (data.order?.orderNumber) {
        clearCart();
        closeDrawer();
        router.push(`/${locale}/shop/checkout/success?order=${encodeURIComponent(data.order.orderNumber)}`);
      }
    } catch {
      setError(tx('خطا در برقراری ارتباط با سرور.', 'Erreur réseau.', 'Network error.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={tx('سبد تملک آثار و تسویه حساب', 'Panier d’acquisition', 'Acquisition Cart')}
    >
      <div className="fixed inset-0" onClick={closeDrawer} aria-hidden="true" />
      <aside className="relative z-10 w-full max-w-lg h-full bg-[var(--surface-card)] border-s border-[var(--border-subtle)] shadow-2xl flex flex-col">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between gap-3 bg-[var(--surface-sunken)]">
          <div className="flex items-center gap-2.5">
            <ShoppingBag size={18} className="text-[var(--primary)]" />
            <div>
              <h2 className="text-sm font-black text-[var(--foreground)]">
                {step === 'cart'
                  ? tx('سبد تملک آثار و کتاب‌ها', 'Panier d’acquisition', 'Acquisition Cart')
                  : tx('تسویه حساب قانونی (فرانسه و اتحادیه اروپا)', 'Commande sécurisée (France & UE)', 'Secure French-Law Checkout')}
              </h2>
              <p className="text-[11px] text-[var(--foreground-muted)]">
                {legalConfig.tradeName} • Paris
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeDrawer}
            aria-label={tx('بستن سبد', 'Fermer le panier', 'Close cart')}
            className="p-2 rounded-xl hover:bg-[var(--surface-card)] border border-transparent hover:border-[var(--border-subtle)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {items.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <ShoppingBag size={36} className="mx-auto text-[var(--foreground-muted)] opacity-50" />
              <p className="text-sm font-bold text-[var(--foreground)]">
                {tx('سبد تملک شما در حال حاضر خالی است.', 'Votre panier d’acquisition est vide.', 'Your acquisition cart is currently empty.')}
              </p>
              <Link
                href={`/${locale}/shop`}
                onClick={closeDrawer}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold"
              >
                <Sparkles size={14} />
                <span>{tx('ورود به گالری تملک آثار و فروشگاه', 'Explorer la Boutique & Éditions', 'Explore Shop & Editions')}</span>
              </Link>
            </div>
          ) : step === 'cart' ? (
            <>
              {/* Cart Items */}
              <div className="space-y-3">
                {items.map((entry) => {
                  const p = entry.product;
                  const isOriginal = p.kind === 'original_artwork';
                  const isSignedBook = p.kind === 'book_physical_signed';
                  return (
                    <div
                      key={p.sku}
                      className="p-3.5 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] space-y-2.5"
                    >
                      <div className="flex gap-3">
                        {p.imageUrl && (
                          <img
                            src={p.imageUrl}
                            alt={p.title[locale]}
                            className="w-16 h-16 rounded-xl object-cover border border-[var(--border-subtle)] shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold text-[var(--foreground)] leading-snug">
                              {p.title[locale]}
                            </p>
                            <button
                              type="button"
                              onClick={() => removeItem(p.sku)}
                              aria-label={tx('حذف از سبد', 'Retirer', 'Remove')}
                              className="p-1 text-[var(--foreground-muted)] hover:text-red-600 cursor-pointer shrink-0"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                            <span className="px-2 py-0.5 rounded bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--foreground-muted)]">
                              {p.sku}
                            </span>
                            {isOriginal && (
                              <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold">
                                {tx('اثر اصل ۱/۱', 'Œuvre originale 1/1', 'Unique 1/1')}
                              </span>
                            )}
                            {p.kind === 'fine_art_print' && (
                              <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-800 dark:text-sky-300 font-bold">
                                {tx('چاپ بازتولید Fine Art', 'Tirage Fine Art', 'Fine Art Print')}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-1.5">
                              {!isOriginal ? (
                                <div className="inline-flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] text-xs">
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(p.sku, entry.quantity - 1)}
                                    className="px-2 py-0.5 font-bold hover:text-[var(--primary)] cursor-pointer"
                                  >
                                    −
                                  </button>
                                  <span className="px-2 font-mono tabular-nums">{entry.quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(p.sku, entry.quantity + 1)}
                                    className="px-2 py-0.5 font-bold hover:text-[var(--primary)] cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-[var(--foreground-muted)]">
                                  {tx('تک‌نسخه یکتا', 'Pièce unique', 'Unique piece')}
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-black text-[var(--foreground)] font-mono tabular-nums">
                              {formatEur((p.priceEurCents || 0) * entry.quantity, locale)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isSignedBook && (
                        <input
                          type="text"
                          value={entry.customDedication || ''}
                          onChange={(e) => updateDedication(p.sku, e.target.value)}
                          placeholder={tx(
                            'نام دریافت‌کننده جهت تقدیم‌نامه دست‌نویس استاد (اختیاری)...',
                            'Nom pour la dédicace manuscrite de l’auteur (facultatif)...',
                            'Name for Dr. Makaremi’s handwritten dedication (optional)...'
                          )}
                          className="w-full px-3 py-1.5 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[11px] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Destination Country Selector for Accurate Loi Darcos & Shipping Calculation */}
              <div className="p-4 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] space-y-2.5">
                <label htmlFor="cart-country-select" className="block text-xs font-bold text-[var(--foreground)]">
                  {tx('کشور مقصد ارسال / صدور فاکتور:', 'Pays de livraison / facturation :', 'Delivery / Billing Country:')}
                </label>
                <select
                  id="cart-country-select"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                >
                  {ALLOWED_SHIPPING_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name[locale]}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[var(--foreground-muted)] leading-relaxed">
                  {tx(
                    'مطابق مقررات بانکی اتحادیه اروپا، ارسال و پرداخت بین‌المللی برای کشورهای مجاز فعال است. مخاطبان داخل ایران کتاب‌های چاپی ایران را از لینک ناشران داخلی تهیه می‌کنند.',
                    'Livraison et règlement conformes aux réglementations européennes en vigueur (déclaration CN23 incluse hors UE).',
                    'Shipping and payment comply with EU regulations (CN23 customs included for non-EU exports).'
                  )}
                </p>
              </div>

              {/* Legal Pricing Breakdown */}
              {quote && (
                <div className="p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-medium)] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--foreground-muted)]">{tx('جمع آثار:', 'Sous-total :', 'Subtotal:')}</span>
                    <span className="font-mono font-bold tabular-nums">{formatEur(quote.subtotalCents, locale)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--foreground-muted)]">
                      {tx('ارسال بیمه‌شده از پاریس:', 'Livraison depuis Paris :', 'Shipping from Paris:')}
                    </span>
                    <span className="font-mono font-bold tabular-nums">
                      {quote.shippingCents === 0
                        ? tx('تحویل دیجیتال فوری (۰ €)', 'Numérique (0 €)', 'Instant Digital (€0)')
                        : formatEur(quote.shippingCents, locale)}
                    </span>
                  </div>

                  {quote.loiDarcosApplied && (
                    <p className="text-[10px] text-amber-800 dark:text-amber-300 bg-amber-500/10 border border-amber-500/25 rounded-lg px-2.5 py-1.5">
                      {tx(
                        'قانون دارکوس فرانسه (Loi Darcos): حداقل تعرفه ارسال ۳.۰۰ € برای سفارش‌های کتاب زیر ۳۵ € در فرانسه به‌صورت خودکار اعمال شده است.',
                        'Loi Darcos : tarif minimal légal de 3,00 € appliqué aux commandes de livres neufs inférieures à 35 € en France.',
                        'French Loi Darcos: mandatory €3.00 minimum book shipping fee applied for France deliveries under €35.'
                      )}
                    </p>
                  )}

                  <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-sm font-black text-[var(--foreground)]">
                    <span>{tx('مبلغ نهایی (TTC):', 'Total TTC :', 'Total (EUR):')}</span>
                    <span className="font-mono tabular-nums text-[var(--primary)]">
                      {formatEur(quote.totalCents, locale)}
                    </span>
                  </div>

                  <p className="text-[10px] font-mono text-[var(--foreground-muted)] pt-1">
                    {quote.taxNoticeFr}
                  </p>
                </div>
              )}
            </>
          ) : (
            /* STEP 2: FRENCH-LAW COMPLIANT CHECKOUT FORM */
            <form id="commerce-checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4">
              <button
                type="button"
                onClick={() => setStep('cart')}
                className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline cursor-pointer"
              >
                {isFa ? <ArrowRight size={13} /> : <ArrowLeft size={13} />}
                <span>{tx('بازگشت به سبد', 'Retour au panier', 'Back to cart')}</span>
              </button>

              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--foreground)]">
                  {tx('۱. مشخصات خریدار و نشانی فاکتور/ارسال', '1. Coordonnées & Livraison', '1. Buyer & Delivery Details')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={tx('نام و نام خانوادگی *', 'Nom et prénom *', 'Full Name *')}
                    className="sm:col-span-2 px-3 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs text-[var(--foreground)]"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={tx('پست الکترونیک (دریافت فاکتور و گواهی) *', 'Adresse e-mail *', 'Email Address *')}
                    className="sm:col-span-2 px-3 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs text-[var(--foreground)]"
                  />
                  {quote?.hasPhysicalGoods && (
                    <>
                      <input
                        type="text"
                        required
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        placeholder={tx('نشانی دقیق پستی *', 'Adresse postale complète *', 'Street Address *')}
                        className="sm:col-span-2 px-3 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs text-[var(--foreground)]"
                      />
                      <input
                        type="text"
                        required
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder={tx('کد پستی *', 'Code postal *', 'Postal Code *')}
                        className="px-3 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs text-[var(--foreground)]"
                      />
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder={tx('شهر *', 'Ville *', 'City *')}
                        className="px-3 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs text-[var(--foreground)]"
                      />
                    </>
                  )}
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={tx('تلفن جهت هماهنگی پست (اختیاری)', 'Téléphone livraison (facultatif)', 'Phone for courier (optional)')}
                    className="sm:col-span-2 px-3 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs text-[var(--foreground)]"
                  />
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={tx('یادداشت سفارش یا متن دلخواه برای خوشنویسی سفارشی...', 'Note ou précisions (ex. texte de calligraphie)...', 'Order note or custom calligraphy text...')}
                    className="sm:col-span-2 px-3 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs text-[var(--foreground)]"
                  />
                </div>
              </div>

              {/* Payment Method Selection */}
              {quote && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--foreground)]">
                    {tx('۲. روش پرداخت (فرانسه و بین‌المللی)', '2. Mode de règlement', '2. Payment Method')}
                  </h3>

                  <div className="space-y-2">
                    {quote.eligiblePaymentMethods.includes('stripe_card') && (
                      <label
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          paymentMethod === 'stripe_card'
                            ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                            : 'border-[var(--border-subtle)] bg-[var(--surface-sunken)]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === 'stripe_card'}
                          onChange={() => setPaymentMethod('stripe_card')}
                          className="mt-1"
                        />
                        <div className="flex-1 text-xs space-y-0.5">
                          <div className="flex items-center gap-1.5 font-bold text-[var(--foreground)]">
                            <CreditCard size={14} className="text-[var(--primary)]" />
                            <span>
                              {tx(
                                'کارت بانکی امن Stripe France (CB / Visa / Mastercard / Apple Pay)',
                                'Carte bancaire sécurisée Stripe (CB / Visa / Mastercard / Apple Pay)',
                                'Secure Card via Stripe France (CB / Visa / Mastercard / Apple Pay)'
                              )}
                            </span>
                          </div>
                          {stripeMode === 'unconfigured' && (
                            <p className="text-[10px] text-amber-700 dark:text-amber-400">
                              {tx(
                                'پیش‌نمایش: در انتظار ثبت کلید زنده Stripe در تنظیمات سرور (واریز SEPA هم‌اکنون فعال است).',
                                'Aperçu : en attente de clé Stripe live (le virement SEPA est immédiatement actif).',
                                'Preview: awaiting live Stripe key (SEPA Wire reservation is immediately active).'
                              )}
                            </p>
                          )}
                        </div>
                      </label>
                    )}

                    {quote.eligiblePaymentMethods.includes('stripe_alma') && (
                      <label
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          paymentMethod === 'stripe_alma'
                            ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                            : 'border-[var(--border-subtle)] bg-[var(--surface-sunken)]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === 'stripe_alma'}
                          onChange={() => setPaymentMethod('stripe_alma')}
                          className="mt-1"
                        />
                        <div className="flex-1 text-xs space-y-0.5">
                          <span className="font-bold text-[var(--foreground)] block">
                            {tx(
                              'پرداخت اقساطی Alma در اروپا (۲، ۳ یا ۴ قسط — از داخل Stripe)',
                              'Paiement en 2x, 3x ou 4x avec Alma (Europe)',
                              'Pay in 2x / 3x / 4x Installments with Alma (EU)'
                            )}
                          </span>
                          <span className="text-[10px] text-[var(--foreground-muted)]">
                            {tx('مناسب آثار هنری ۵۰ € تا ۵٬۰۰۰ € در اتحادیه اروپا', 'Pour œuvres de 50 € à 5 000 € en UE', 'For artworks €50–€5,000 in the EU')}
                          </span>
                        </div>
                      </label>
                    )}

                    {quote.eligiblePaymentMethods.includes('sepa_wire') && (
                      <label
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          paymentMethod === 'sepa_wire'
                            ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                            : 'border-[var(--border-subtle)] bg-[var(--surface-sunken)]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === 'sepa_wire'}
                          onChange={() => setPaymentMethod('sepa_wire')}
                          className="mt-1"
                        />
                        <div className="flex-1 text-xs space-y-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 font-bold text-[var(--foreground)]">
                              <Landmark size={14} className="text-emerald-600" />
                              {tx('واریز بانکی SEPA / پیش‌فاکتور رسمی (کارمزد ۰٪)', 'Virement bancaire SEPA / Facture pro forma (0 % frais)', 'SEPA Bank Wire / Official Pro Forma (0% fee)')}
                            </span>
                            {quote.sepaRecommended && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                                {tx('پیشنهادی', 'Recommandé', 'Recommended')}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[var(--foreground-muted)]">
                            {tx(
                              'رزرو فوری اثر یکتا + دریافت شماره فاکتور رسمی FACT و IBAN پاریس بدون کارمزد درگاه',
                              'Réservation immédiate + facture pro forma FACT et IBAN Paris sans frais bancaires',
                              'Instant unique-piece reservation + official FACT invoice & Paris IBAN with zero gateway fee'
                            )}
                          </span>
                        </div>
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Mandatory French Consumer Code Checkboxes */}
              {quote && (
                <div className="p-3.5 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] space-y-3 text-xs">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={cgvAccepted}
                      onChange={(e) => setCgvAccepted(e.target.checked)}
                      className="mt-1"
                    />
                    <span className="leading-relaxed text-[var(--foreground)]">
                      {tx('شرایط عمومی فروش (', 'J’accepte les ', 'I accept the ')}
                      <Link
                        href={`/${locale}/legal/cgv`}
                        target="_blank"
                        className="font-bold text-[var(--primary)] underline"
                      >
                        {tx('CGV', 'Conditions Générales de Vente (CGV)', 'General Terms of Sale (CGV)')}
                      </Link>
                      {tx(
                        ') و تعهد پرداخت این سفارش را مطالعه و تأیید می‌کنم. *',
                        ') et je reconnais mon obligation de paiement. *',
                        ') and acknowledge my obligation to pay. *'
                      )}
                    </span>
                  </label>

                  {quote.requiresDigitalWaiver && (
                    <label className="flex items-start gap-2.5 cursor-pointer border-t border-[var(--border-subtle)] pt-2.5">
                      <input
                        type="checkbox"
                        required
                        checked={digitalWaiverAccepted}
                        onChange={(e) => setDigitalWaiverAccepted(e.target.checked)}
                        className="mt-1"
                      />
                      <span className="leading-relaxed text-amber-900 dark:text-amber-300">
                        {tx(
                          'درخواست دسترسی فوری به نسخه دیجیتال را دارم و مطابق ماده L.221-28 (بند ۱۳°) قانون فرانسه، صراحتاً از حق انصراف ۱۴ روزه برای این فایل دیجیتال صرف‌نظر می‌کنم. *',
                          'Je demande l’exécution immédiate du contenu numérique et je renonce expressément à mon droit de rétractation de 14 jours (art. L.221-28 13° du Code de la consommation). *',
                          'I request immediate access to the digital content and expressly waive my 14-day withdrawal right (French Consumer Code Art. L.221-28 13°). *'
                        )}
                      </span>
                    </label>
                  )}

                  {quote.requiresCustomWaiver && (
                    <label className="flex items-start gap-2.5 cursor-pointer border-t border-[var(--border-subtle)] pt-2.5">
                      <input
                        type="checkbox"
                        required
                        checked={customWaiverAccepted}
                        onChange={(e) => setCustomWaiverAccepted(e.target.checked)}
                        className="mt-1"
                      />
                      <span className="leading-relaxed text-amber-900 dark:text-amber-300">
                        {tx(
                          'آگاهم که اثر خوشنویسی سفارشی اختصاصی مطابق ماده L.221-28 (بند ۳°) مشمول حق انصراف ۱۴ روزه نیست. *',
                          'Je reconnais qu’une œuvre calligraphique confectionnée sur mesure est exclue du droit de rétractation (art. L.221-28 3°). *',
                          'I acknowledge that bespoke custom calligraphy commissions are excluded from the 14-day right of withdrawal (Art. L.221-28 3°). *'
                        )}
                      </span>
                    </label>
                  )}
                </div>
              )}

              {error && (
                <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-bold text-red-700 dark:text-red-400 flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && quote && (
          <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--surface-sunken)] space-y-2.5">
            {step === 'cart' ? (
              <button
                type="button"
                onClick={() => setStep('checkout')}
                className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs sm:text-sm font-black shadow-md hover:opacity-95 transition-opacity cursor-pointer"
              >
                <ShieldCheck size={16} />
                <span>
                  {tx(
                    `ادامه به تسویه امن (${formatEur(quote.totalCents, locale)})`,
                    `Passer à la commande (${formatEur(quote.totalCents, locale)})`,
                    `Proceed to Checkout (${formatEur(quote.totalCents, locale)})`
                  )}
                </span>
              </button>
            ) : (
              <button
                type="submit"
                form="commerce-checkout-form"
                disabled={submitting}
                className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--primary)] disabled:opacity-50 text-[var(--primary-foreground)] text-xs sm:text-sm font-black shadow-md hover:opacity-95 transition-opacity cursor-pointer"
              >
                <Check size={16} />
                <span>
                  {submitting
                    ? tx('در حال ثبت سفارش...', 'Validation en cours...', 'Processing order...')
                    : tx(
                        `تأیید سفارش با تعهد پرداخت (${formatEur(quote.totalCents, locale)})`,
                        `Commande avec obligation de paiement (${formatEur(quote.totalCents, locale)})`,
                        `Order with Obligation to Pay (${formatEur(quote.totalCents, locale)})`
                      )}
                </span>
              </button>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
