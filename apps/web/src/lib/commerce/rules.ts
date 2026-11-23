import type {
  CommerceCatalogItem,
  CommerceLegalConfig,
  CommercePaymentMethod,
  CommerceQuote,
  CommerceQuoteLine,
} from '@makaremi/shared';

export interface ShippingCountryOption {
  code: string;
  zone: 'FR' | 'EU' | 'INTL';
  name: { fa: string; fr: string; en: string };
}

/**
 * Explicitly sanctioned / embargoed ISO country codes excluded from EU/Stripe payment processing
 * to protect the artist's French bank account and PSP compliance (EU sanctions & OFAC).
 */
export const SANCTIONED_COUNTRY_CODES = new Set(['IR', 'KP', 'SY', 'CU', 'RU', 'BY']);

export const EU_COUNTRY_CODES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
]);

export const ALLOWED_SHIPPING_COUNTRIES: ShippingCountryOption[] = [
  { code: 'FR', zone: 'FR', name: { fa: 'فرانسه (France)', fr: 'France métropolitaine', en: 'France' } },
  { code: 'BE', zone: 'EU', name: { fa: 'بلژیک (Belgique)', fr: 'Belgique', en: 'Belgium' } },
  { code: 'DE', zone: 'EU', name: { fa: 'آلمان (Allemagne)', fr: 'Allemagne', en: 'Germany' } },
  { code: 'NL', zone: 'EU', name: { fa: 'هلند (Pays-Bas)', fr: 'Pays-Bas', en: 'Netherlands' } },
  { code: 'SE', zone: 'EU', name: { fa: 'سوئد (Suède)', fr: 'Suède', en: 'Sweden' } },
  { code: 'IT', zone: 'EU', name: { fa: 'ایتالیا (Italie)', fr: 'Italie', en: 'Italy' } },
  { code: 'ES', zone: 'EU', name: { fa: 'اسپانیا (Espagne)', fr: 'Espagne', en: 'Spain' } },
  { code: 'AT', zone: 'EU', name: { fa: 'اتریش (Autriche)', fr: 'Autriche', en: 'Austria' } },
  { code: 'DK', zone: 'EU', name: { fa: 'دانمارک (Danemark)', fr: 'Danemark', en: 'Denmark' } },
  { code: 'LU', zone: 'EU', name: { fa: 'لوکزامبورگ (Luxembourg)', fr: 'Luxembourg', en: 'Luxembourg' } },
  { code: 'PT', zone: 'EU', name: { fa: 'پرتغال (Portugal)', fr: 'Portugal', en: 'Portugal' } },
  { code: 'IE', zone: 'EU', name: { fa: 'ایرلند (Irlande)', fr: 'Irlande', en: 'Ireland' } },
  { code: 'FI', zone: 'EU', name: { fa: 'فنلاند (Finlande)', fr: 'Finlande', en: 'Finland' } },
  { code: 'CH', zone: 'INTL', name: { fa: 'سوئیس (Suisse)', fr: 'Suisse', en: 'Switzerland' } },
  { code: 'GB', zone: 'INTL', name: { fa: 'بریتانیا (Royaume-Uni)', fr: 'Royaume-Uni', en: 'United Kingdom' } },
  { code: 'NO', zone: 'INTL', name: { fa: 'نروژ (Norvège)', fr: 'Norvège', en: 'Norway' } },
  { code: 'US', zone: 'INTL', name: { fa: 'ایالات متحده آمریکا (USA)', fr: 'États-Unis', en: 'United States' } },
  { code: 'CA', zone: 'INTL', name: { fa: 'کانادا (Canada)', fr: 'Canada', en: 'Canada' } },
  { code: 'AU', zone: 'INTL', name: { fa: 'استرالیا (Australie)', fr: 'Australie', en: 'Australia' } },
  { code: 'NZ', zone: 'INTL', name: { fa: 'نیوزیلند (Nouvelle-Zélande)', fr: 'Nouvelle-Zélande', en: 'New Zealand' } },
  { code: 'JP', zone: 'INTL', name: { fa: 'ژاپن (Japon)', fr: 'Japon', en: 'Japan' } },
  { code: 'AE', zone: 'INTL', name: { fa: 'امارات متحده عربی (Émirats)', fr: 'Émirats arabes unis', en: 'United Arab Emirates' } },
];

export const ALLOWED_SHIPPING_COUNTRY_SET = new Set(ALLOWED_SHIPPING_COUNTRIES.map((c) => c.code));

export function isPhysicalCommerceKind(kind: CommerceCatalogItem['kind']): boolean {
  return (
    kind === 'original_artwork' ||
    kind === 'fine_art_print' ||
    kind === 'book_physical_signed' ||
    kind === 'commission_inquiry'
  );
}

export function formatEur(cents: number | null | undefined, locale: 'fa' | 'fr' | 'en' = 'fr'): string {
  if (cents === null || cents === undefined) {
    return locale === 'fa' ? 'استعلام قیمت' : locale === 'fr' ? 'Sur demande' : 'Upon inquiry';
  }
  const amount = cents / 100;
  try {
    const intlLocale = locale === 'fa' ? 'fa-IR' : locale === 'fr' ? 'fr-FR' : 'en-IE';
    return new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} €`;
  }
}

/**
 * Computes an authoritative, French-law compliant quote on the server:
 * - Loi Darcos (France): Physical books under €35 MUST charge >= €3.00 shipping; >= €35 cannot be €0.00 (min €0.01)
 * - CGI Art. 293 B: Franchise en base de TVA -> 0% tax + mandatory legal mention
 * - CGI Art. 278-0 bis & Art. 98 A: When TVA active, 5.5% for original hand-executed artworks & books, 20% for prints
 * - CGI Art. 262: Non-EU exports -> 0% VAT (with CN23 customs declaration)
 * - Dual accounting split: Artiste-Auteur (URSSAF Limousin) vs Commercial BIC (Micro-entreprise)
 */
export function calculateFrenchCommerceQuote(input: {
  items: Array<{ product: CommerceCatalogItem; quantity: number; customDedication?: string }>;
  countryCode: string;
  legalConfig: CommerceLegalConfig;
}): CommerceQuote {
  const normalizedCountry = (input.countryCode || 'FR').trim().toUpperCase();
  if (SANCTIONED_COUNTRY_CODES.has(normalizedCountry) || !ALLOWED_SHIPPING_COUNTRY_SET.has(normalizedCountry)) {
    throw new Error(`Unsupported or restricted destination country: ${normalizedCountry}`);
  }

  const isFrance = normalizedCountry === 'FR';
  const isEu = EU_COUNTRY_CODES.has(normalizedCountry);
  const isExportNonEu = !isEu;

  const lines: CommerceQuoteLine[] = [];
  let subtotalCents = 0;
  let bookPhysicalSubtotalCents = 0;
  let hasOriginalArtwork = false;
  let hasFineArtPrint = false;
  let hasBookPhysical = false;
  let hasPhysicalGoods = false;
  let requiresDigitalWaiver = false;
  let requiresCustomWaiver = false;
  let artisteAuteurTotalCents = 0;
  let commercialBicTotalCents = 0;
  let taxCents = 0;

  for (const entry of input.items) {
    const qty = Math.max(1, Math.min(20, Math.floor(entry.quantity || 1)));
    const p = entry.product;
    if (p.priceEurCents === null || p.priceEurCents <= 0) {
      throw new Error(`Product ${p.sku} is not configured for direct priced checkout`);
    }
    if (p.kind === 'original_artwork' && qty > 1) {
      throw new Error(`Original artwork ${p.sku} is a unique piece (max quantity 1)`);
    }

    const lineSubtotalCents = p.priceEurCents * qty;
    subtotalCents += lineSubtotalCents;

    if (p.kind === 'original_artwork') hasOriginalArtwork = true;
    if (p.kind === 'fine_art_print') hasFineArtPrint = true;
    if (p.kind === 'book_physical_signed') {
      hasBookPhysical = true;
      bookPhysicalSubtotalCents += lineSubtotalCents;
    }
    if (isPhysicalCommerceKind(p.kind)) hasPhysicalGoods = true;
    if (p.kind === 'book_digital_ebook' || p.kind === 'patronage_edition') {
      requiresDigitalWaiver = true;
    }
    if (p.kind === 'commission_inquiry') {
      requiresCustomWaiver = true;
    }

    if (p.legalBucket === 'artiste_auteur') {
      artisteAuteurTotalCents += lineSubtotalCents;
    } else {
      commercialBicTotalCents += lineSubtotalCents;
    }

    // Effective VAT computation (all listed prices are TTC in FR/EU; 0% under Franchise en base or Export)
    const effectiveRateBp: 0 | 550 | 2000 =
      input.legalConfig.taxMode === 'franchise_en_base' || isExportNonEu
        ? 0
        : p.vatRateBasisPoints;

    const lineVatCents =
      effectiveRateBp > 0
        ? Math.round(lineSubtotalCents - lineSubtotalCents / (1 + effectiveRateBp / 10000))
        : 0;
    taxCents += lineVatCents;

    lines.push({
      sku: p.sku,
      title: p.title,
      kind: p.kind,
      legalBucket: p.legalBucket,
      quantity: qty,
      unitPriceCents: p.priceEurCents,
      lineSubtotalCents,
      vatRateBasisPoints: effectiveRateBp,
      vatAmountCents: lineVatCents,
      hsCode: p.hsCode,
      requiresWithdrawalWaiver: p.requiresWithdrawalWaiver,
      customDedication: entry.customDedication?.trim().slice(0, 220) || undefined,
    });
  }

  // Shipping Calculation (strict Loi Darcos compliance for French book deliveries!)
  let shippingCents = 0;
  let loiDarcosApplied = false;
  const shippingZone: CommerceQuote['shippingZone'] = !hasPhysicalGoods
    ? 'DIGITAL_ONLY'
    : isFrance
      ? 'FR'
      : isEu
        ? 'EU'
        : 'INTL';

  if (hasPhysicalGoods) {
    if (hasOriginalArtwork) {
      // Insured museum crate / art courier from Paris
      shippingCents = isFrance ? 4500 : isEu ? 8500 : 14500;
    } else if (hasFineArtPrint) {
      // Archival reinforced tube / flat art mailer from Paris
      shippingCents = isFrance ? 1400 : isEu ? 2200 : 3500;
    } else if (hasBookPhysical) {
      if (isFrance) {
        if (bookPhysicalSubtotalCents < 3500) {
          // Loi Darcos (France): strictly >= 3.00 EUR for physical books under 35 EUR
          shippingCents = 300;
          loiDarcosApplied = true;
        } else {
          // Loi Darcos: >= 35 EUR still cannot be strictly 0.00 EUR on remote delivery (min 0.01 EUR)
          shippingCents = 490;
        }
      } else if (isEu) {
        shippingCents = 990;
      } else {
        shippingCents = 1690;
      }
    } else {
      // Bespoke commission shipping
      shippingCents = isFrance ? 3500 : isEu ? 6500 : 11500;
    }

    // Extra safety assertion: if France + physical books under 35 EUR, shipping can NEVER drop below 300 cents
    if (isFrance && hasBookPhysical && bookPhysicalSubtotalCents < 3500 && shippingCents < 300) {
      shippingCents = 300;
      loiDarcosApplied = true;
    }
  }

  const totalCents = subtotalCents + shippingCents;

  const taxNoticeFr =
    input.legalConfig.taxMode === 'franchise_en_base'
      ? input.legalConfig.franchiseMentionFr || 'TVA non applicable, art. 293 B du CGI'
      : isExportNonEu
        ? 'Exonération de TVA — Exportation hors Union Européenne (art. 262 du CGI, déclaration CN23)'
        : 'TVA française incluse (5,5 % œuvres originales & livres / 20 % tirages de reproduction, art. 278-0 bis & 98 A CGI)';

  const sepaThreshold = input.legalConfig.sepaRecommendedThresholdEurCents || 250000;
  const sepaRecommended = totalCents >= sepaThreshold;

  const eligiblePaymentMethods: CommercePaymentMethod[] = [];
  if (totalCents <= 500000) {
    eligiblePaymentMethods.push('stripe_card');
  }
  if (isEu && totalCents >= 5000 && totalCents <= 500000) {
    eligiblePaymentMethods.push('stripe_alma');
  }
  if (hasOriginalArtwork || totalCents >= 20000 || sepaRecommended) {
    eligiblePaymentMethods.push('sepa_wire');
  }
  if (eligiblePaymentMethods.length === 0) {
    eligiblePaymentMethods.push('sepa_wire');
  }

  return {
    currency: 'EUR',
    countryCode: normalizedCountry,
    shippingZone,
    taxMode: input.legalConfig.taxMode,
    taxNoticeFr,
    lines,
    subtotalCents,
    shippingCents,
    loiDarcosApplied,
    loiDarcosBookSubtotalCents: bookPhysicalSubtotalCents,
    taxCents,
    totalCents,
    artisteAuteurTotalCents,
    commercialBicTotalCents,
    requiresDigitalWaiver,
    requiresCustomWaiver,
    hasPhysicalGoods,
    hasOriginalArtwork,
    sepaRecommended,
    eligiblePaymentMethods,
  };
}
