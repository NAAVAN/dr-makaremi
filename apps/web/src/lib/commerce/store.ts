import crypto from 'node:crypto';
import type {
  ArtworkAuthenticityCertificate,
  CommerceCatalogItem,
  CommerceCustomerInfo,
  CommerceLegalConfig,
  CommerceOrder,
  CommerceOrderStatus,
  CommercePaymentMethod,
  CommerceQuote,
  CommerceWithdrawalRequest,
  Locale,
} from '@makaremi/shared';
import {
  readCommerceJson,
  writeCommerceJson,
  loadVaultArtworks,
  loadVaultBooks,
} from '@/lib/vault-loader';
import {
  computeCanonicalSha256,
  OFFICIAL_DR_MAKAREMI_PUBLIC_KEY,
  signWithEd25519,
  verifyEd25519Signature,
} from '@/lib/crypto';
import { resolveProxiedMediaUrl } from '@/lib/media-url';

const LEGAL_CONFIG_FILE = 'legal-config.json';
const CATALOG_FILE = 'catalog.json';
const ORDERS_FILE = 'runtime-orders.json';
const WITHDRAWALS_FILE = 'runtime-withdrawals.json';
const CERTIFICATES_FILE = 'runtime-certificates.json';

const DEFAULT_LEGAL_CONFIG: CommerceLegalConfig = {
  sellerName: 'Dr Hassan Makaremi',
  tradeName: 'Atelier & Éditions Dr Hassan Makaremi',
  legalStatusFr: "Entrepreneur Individuel — Artiste-Auteur (URSSAF Limousin) & Activité complémentaire d'éditions",
  legalStatusFa: 'شخص حقیقی ثبت‌شده در فرانسه — هنرمند-مؤلف (URSSAF Limousin) و انتشارات آثار',
  legalStatusEn: 'Individual French Artist-Author (URSSAF Limousin) & Independent Editions',
  siret: 'À renseigner dans le Pishkhan (14 chiffres)',
  siretConfigured: false,
  urssafArtisteAuteurRef: 'URSSAF Limousin — Pôle Artistes-Auteurs',
  apeCode: '9003A (Création artistique relevant des arts plastiques)',
  addressLine1: 'Paris, France (adresse complète communiquée sur facture)',
  postalCodeCity: '75000 Paris',
  country: 'France',
  email: 'contact@makaremi.com',
  phone: 'Sur demande écrite via contact@makaremi.com',
  directorOfPublication: 'Dr Hassan Makaremi',
  hostName: 'Vercel Inc.',
  hostAddress: '440 N Barranca Ave #4133, Covina, CA 91723, United States',
  hostWebsite: 'https://vercel.com',
  taxMode: 'franchise_en_base',
  vatNumber: null,
  franchiseMentionFr: 'TVA non applicable, art. 293 B du CGI',
  mediatorName: 'CM2C — Centre de la Médiation de la Consommation de Conciliateurs de Justice',
  mediatorUrl: 'https://www.cm2c.net',
  mediatorAddress: '49 Rue de Ponthieu, 75008 Paris, France',
  sepaAccountHolder: 'Dr Hassan Makaremi',
  sepaIban: 'FR76 XXXX XXXX XXXX XXXX XXXX XXX (à configurer dans le Pishkhan)',
  sepaBic: 'À configurer dans le Pishkhan',
  sepaBankName: 'Compte dédié France (SEPA)',
  sepaRecommendedThresholdEurCents: 250000,
  eInvoicingPlatformName: 'Plateforme Agréée (PA) — Réforme Facturation Électronique France 2026/2027',
  updatedAt: '2026-11-23T00:00:00.000Z',
};

// In-process reservation lock for unique original artworks (prevents double-sell race condition)
const activeUniqueSkuLocks = new Map<string, { orderId: string; expiresAt: number }>();

export function getCommerceLegalConfig(): CommerceLegalConfig {
  const stored = readCommerceJson<Partial<CommerceLegalConfig>>(LEGAL_CONFIG_FILE, DEFAULT_LEGAL_CONFIG);
  return {
    ...DEFAULT_LEGAL_CONFIG,
    ...stored,
  };
}

export function saveCommerceLegalConfig(patch: Partial<CommerceLegalConfig>): CommerceLegalConfig {
  const current = getCommerceLegalConfig();
  const next: CommerceLegalConfig = {
    ...current,
    ...patch,
    siretConfigured: Boolean(
      (patch.siret ?? current.siret) &&
        /^\d{14}$/.test((patch.siret ?? current.siret).replace(/\s+/g, ''))
    ),
    updatedAt: new Date().toISOString(),
  };
  writeCommerceJson(LEGAL_CONFIG_FILE, next);
  return next;
}

function hydrateCatalogImages(items: CommerceCatalogItem[]): CommerceCatalogItem[] {
  const artworks = loadVaultArtworks();
  const books = loadVaultBooks();
  const artworkMap = new Map(artworks.map((a) => [a.slug, a]));
  const bookMap = new Map(books.map((b) => [b.slug, b]));

  const orders = getCommerceOrders();
  const soldUniqueSkus = new Set<string>();
  const reservedUniqueSkus = new Set<string>();
  const now = Date.now();

  for (const ord of orders) {
    if (ord.status === 'paid' || ord.status === 'fulfilled') {
      for (const ln of ord.quote.lines) {
        if (ln.kind === 'original_artwork') soldUniqueSkus.add(ln.sku);
      }
    } else if (ord.status === 'awaiting_sepa_transfer') {
      for (const ln of ord.quote.lines) {
        if (ln.kind === 'original_artwork') reservedUniqueSkus.add(ln.sku);
      }
    }
  }

  for (const [sku, lock] of activeUniqueSkuLocks.entries()) {
    if (lock.expiresAt > now) {
      reservedUniqueSkus.add(sku);
    } else {
      activeUniqueSkuLocks.delete(sku);
    }
  }

  return items.map((item) => {
    let resolvedImageUrl = item.imageUrl || null;
    if (!resolvedImageUrl) {
      if (item.collection === 'artworks') {
        const art = artworkMap.get(item.slug);
        const matchedPlate = item.plateImageId
          ? art?.gallery_images?.find((g) => g.id === item.plateImageId)
          : undefined;
        const rawUrl = matchedPlate?.url || art?.image_url || art?.gallery_images?.[0]?.url || null;
        resolvedImageUrl = resolveProxiedMediaUrl(rawUrl, 'art', item.title.fr);
      } else if (item.collection === 'books') {
        const book = bookMap.get(item.slug);
        resolvedImageUrl = resolveProxiedMediaUrl(book?.cover_image_url, 'book', item.title.fr);
      }
    }

    let availability = item.availability;
    let editionRemaining = item.editionRemaining;
    if (item.kind === 'original_artwork') {
      if (soldUniqueSkus.has(item.sku)) {
        availability = 'sold';
        editionRemaining = 0;
      } else if (reservedUniqueSkus.has(item.sku) && availability === 'available') {
        availability = 'reserved';
      }
    }

    return {
      ...item,
      imageUrl: resolvedImageUrl,
      availability,
      editionRemaining,
    };
  });
}

export function getCommerceCatalog(): CommerceCatalogItem[] {
  const raw = readCommerceJson<CommerceCatalogItem[]>(CATALOG_FILE, []);
  return hydrateCatalogImages(raw);
}

export function getCommerceProductBySku(sku: string): CommerceCatalogItem | null {
  const all = getCommerceCatalog();
  return all.find((p) => p.sku === sku) || null;
}

export function getCommerceProductsForWork(
  collection: CommerceCatalogItem['collection'],
  slug: string
): CommerceCatalogItem[] {
  const all = getCommerceCatalog();
  return all.filter((p) => p.collection === collection && p.slug === slug);
}

export function upsertCommerceCatalogItem(item: CommerceCatalogItem): CommerceCatalogItem[] {
  const raw = readCommerceJson<CommerceCatalogItem[]>(CATALOG_FILE, []);
  const idx = raw.findIndex((x) => x.sku === item.sku);
  const stamped: CommerceCatalogItem = {
    ...item,
    updatedAt: new Date().toISOString(),
  };
  if (idx >= 0) {
    raw[idx] = stamped;
  } else {
    raw.unshift(stamped);
  }
  writeCommerceJson(CATALOG_FILE, raw);
  return hydrateCatalogImages(raw);
}

export function getCommerceOrders(): CommerceOrder[] {
  return readCommerceJson<CommerceOrder[]>(ORDERS_FILE, []);
}

export function getCommerceOrderByNumber(orderNumber: string): CommerceOrder | null {
  const clean = orderNumber.trim().toUpperCase();
  return getCommerceOrders().find((o) => o.orderNumber.toUpperCase() === clean) || null;
}

export function getCommerceOrderById(orderId: string): CommerceOrder | null {
  return getCommerceOrders().find((o) => o.id === orderId) || null;
}

/**
 * Generates strictly sequential, gap-free French invoice numbers (FACT-YYYY-0001)
 * compliant with Code de commerce & French e-invoicing readiness.
 */
function nextSequentialOrderAndInvoiceNumbers(existing: CommerceOrder[]): {
  orderNumber: string;
  invoiceNumber: string;
} {
  const year = new Date().getUTCFullYear();
  const seq = existing.length + 1;
  const padded = String(seq).padStart(4, '0');
  return {
    orderNumber: `MKM-${year}-${padded}`,
    invoiceNumber: `FACT-${year}-${padded}`,
  };
}

export function createCommerceOrder(input: {
  paymentMethod: CommercePaymentMethod;
  locale: Locale;
  customer: CommerceCustomerInfo;
  quote: CommerceQuote;
  digitalWithdrawalWaived: boolean;
  customOrderWaived: boolean;
  stripeSessionId?: string | null;
}): CommerceOrder {
  const orders = getCommerceOrders();
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  // Atomic check for unique original artworks to prevent concurrent double-purchase
  const catalog = getCommerceCatalog();
  const bySku = new Map(catalog.map((c) => [c.sku, c]));

  for (const line of input.quote.lines) {
    const prod = bySku.get(line.sku);
    if (!prod || prod.availability !== 'available') {
      throw new Error(`Item ${line.sku} is no longer available (${prod?.availability || 'missing'})`);
    }
    if (prod.kind === 'original_artwork') {
      const existingLock = activeUniqueSkuLocks.get(prod.sku);
      if (existingLock && existingLock.expiresAt > now) {
        throw new Error(`Original artwork ${prod.sku} is currently reserved in another active checkout`);
      }
    }
  }

  const { orderNumber, invoiceNumber } = nextSequentialOrderAndInvoiceNumbers(orders);
  const id = crypto.randomUUID();

  // Reserve unique artworks for 30 minutes (or indefinitely until SEPA settlement/cancel)
  for (const line of input.quote.lines) {
    if (line.kind === 'original_artwork') {
      activeUniqueSkuLocks.set(line.sku, {
        orderId: id,
        expiresAt: now + 30 * 60 * 1000,
      });
    }
  }

  const initialStatus: CommerceOrderStatus =
    input.paymentMethod === 'sepa_wire' ? 'awaiting_sepa_transfer' : 'pending_payment';

  const order: CommerceOrder = {
    id,
    orderNumber,
    invoiceNumber,
    status: initialStatus,
    paymentMethod: input.paymentMethod,
    stripeSessionId: input.stripeSessionId || null,
    stripePaymentIntentId: null,
    locale: input.locale,
    customer: input.customer,
    quote: input.quote,
    cgvAcceptedAt: nowIso,
    digitalWithdrawalWaivedAt: input.digitalWithdrawalWaived ? nowIso : null,
    customOrderWaivedAt: input.customOrderWaived ? nowIso : null,
    certificateIds: [],
    downloadTokens: [],
    createdAt: nowIso,
    updatedAt: nowIso,
    paidAt: null,
  };

  orders.unshift(order);
  writeCommerceJson(ORDERS_FILE, orders);
  return order;
}

export function attachStripeSessionToOrder(orderId: string, stripeSessionId: string): CommerceOrder | null {
  const orders = getCommerceOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx < 0) return null;
  orders[idx] = {
    ...orders[idx],
    stripeSessionId,
    updatedAt: new Date().toISOString(),
  };
  writeCommerceJson(ORDERS_FILE, orders);
  return orders[idx];
}

export function buildCertificateCanonicalString(cert: Omit<ArtworkAuthenticityCertificate, 'canonicalSha256' | 'signatureEd25519'>): string {
  return [
    `CERT_ID:${cert.certificateId}`,
    `ORDER:${cert.orderNumber}`,
    `INVOICE:${cert.invoiceNumber}`,
    `SKU:${cert.sku}`,
    `ARTWORK_SLUG:${cert.artworkSlug}`,
    `ARTIST:${cert.artistName}`,
    `KIND:${cert.kind}`,
    `EDITION:${cert.editionLabel}`,
    `DIMENSIONS:${cert.dimensionsCm}`,
    `BUYER:${cert.buyerName}`,
    `ISSUED_AT:${cert.issuedAt}`,
  ].join('\n--DECRET_MARCUS_BOUNDARY--\n');
}

export function verifyAuthenticityCertificate(cert: ArtworkAuthenticityCertificate): {
  sha256Matches: boolean;
  ed25519Valid: boolean;
} {
  const { canonicalSha256, signatureEd25519, ...rest } = cert;
  const canonical = buildCertificateCanonicalString(rest);
  const recomputedSha = computeCanonicalSha256(canonical);
  const sha256Matches = recomputedSha === canonicalSha256;
  const ed25519Valid = verifyEd25519Signature(
    canonical,
    signatureEd25519,
    OFFICIAL_DR_MAKAREMI_PUBLIC_KEY
  );
  return { sha256Matches, ed25519Valid };
}

export function getAuthenticityCertificates(): ArtworkAuthenticityCertificate[] {
  return readCommerceJson<ArtworkAuthenticityCertificate[]>(CERTIFICATES_FILE, []);
}

export function getAuthenticityCertificateById(certificateId: string): ArtworkAuthenticityCertificate | null {
  const clean = certificateId.trim().toUpperCase();
  return getAuthenticityCertificates().find((c) => c.certificateId.toUpperCase() === clean) || null;
}

export function markCommerceOrderPaid(input: {
  orderId?: string;
  orderNumber?: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string | null;
}): CommerceOrder | null {
  const orders = getCommerceOrders();
  const idx = orders.findIndex(
    (o) =>
      (input.orderId && o.id === input.orderId) ||
      (input.orderNumber && o.orderNumber === input.orderNumber) ||
      (input.stripeSessionId && o.stripeSessionId === input.stripeSessionId)
  );
  if (idx < 0) return null;

  const existing = orders[idx];
  if (existing.status === 'paid' || existing.status === 'fulfilled') {
    return existing;
  }

  const nowIso = new Date().toISOString();
  const catalog = getCommerceCatalog();
  const bySku = new Map(catalog.map((c) => [c.sku, c]));
  const certificates = getAuthenticityCertificates();
  const issuedCertificateIds: string[] = [...existing.certificateIds];
  const downloadTokens = [...existing.downloadTokens];

  for (const line of existing.quote.lines) {
    const prod = bySku.get(line.sku);

    // 1. Issue Cryptographic Ed25519 Décret Marcus Certificate for Artworks & Numbered Prints
    if (line.kind === 'original_artwork' || line.kind === 'fine_art_print') {
      const certId = `COA-${new Date().getUTCFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const isOriginal = line.kind === 'original_artwork';
      const baseCert: Omit<ArtworkAuthenticityCertificate, 'canonicalSha256' | 'signatureEd25519'> = {
        certificateId: certId,
        orderNumber: existing.orderNumber,
        invoiceNumber: existing.invoiceNumber,
        sku: line.sku,
        artworkSlug: prod?.slug || line.sku,
        plateImageId: prod?.plateImageId ?? null,
        artworkTitle: line.title,
        artistName: 'Dr Hassan Makaremi',
        creationYear: prod?.year ?? null,
        kind: line.kind,
        editionLabel: isOriginal
          ? 'Œuvre originale unique (1/1)'
          : `Tirage d'art numéroté (Édition limitée / ${prod?.editionSize || 30})`,
        dimensionsCm: prod?.physicalSpecs?.dimensionsCm || 'Certifié sur fiche atelier',
        medium: prod?.physicalSpecs?.medium || {
          fa: 'اثر هنری ثبت‌شده در آتلیه دکتر مکارمی پاریس',
          fr: "Création certifiée par l'atelier Dr Hassan Makaremi, Paris",
          en: 'Certified artwork from Dr. Hassan Makaremi Studio, Paris',
        },
        buyerName: existing.customer.fullName,
        issuedAt: nowIso,
        publicKeyUrl: 'https://makaremi.com/.well-known/makaremi-public-key.pem',
        decretMarcusStatementFr: isOriginal
          ? "Conformément au décret n° 81-255 du 3 mars 1981 (décret Marcus), l'artiste Dr Hassan Makaremi certifie que cette œuvre est une création originale unique entièrement exécutée de sa main."
          : "Conformément au décret n° 81-255 du 3 mars 1981 (décret Marcus), l'artiste Dr Hassan Makaremi certifie que ce tirage Fine Art numéroté et signé a été réalisé sous son contrôle exclusif (reproduction d'art numérotée).",
      };

      const canonical = buildCertificateCanonicalString(baseCert);
      const signedCert: ArtworkAuthenticityCertificate = {
        ...baseCert,
        canonicalSha256: computeCanonicalSha256(canonical),
        signatureEd25519: signWithEd25519(canonical),
      };

      certificates.unshift(signedCert);
      issuedCertificateIds.push(certId);

      // Clear temporary lock since order is now permanently marked paid
      activeUniqueSkuLocks.delete(line.sku);
    }

    // 2. Issue Expiring Watermarked Digital Download Token for E-books
    if (line.kind === 'book_digital_ebook') {
      const token = crypto.randomBytes(24).toString('base64url');
      downloadTokens.push({
        token,
        sku: line.sku,
        title: line.title[existing.locale] || line.title.fr,
        expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        downloadsUsed: 0,
        maxDownloads: 5,
      });
    }
  }

  writeCommerceJson(CERTIFICATES_FILE, certificates);

  orders[idx] = {
    ...existing,
    status: 'paid',
    stripePaymentIntentId: input.stripePaymentIntentId ?? existing.stripePaymentIntentId,
    certificateIds: issuedCertificateIds,
    downloadTokens,
    paidAt: nowIso,
    updatedAt: nowIso,
  };
  writeCommerceJson(ORDERS_FILE, orders);
  return orders[idx];
}

export function updateCommerceOrderStatus(
  orderId: string,
  status: CommerceOrderStatus
): CommerceOrder | null {
  if (status === 'paid') {
    return markCommerceOrderPaid({ orderId });
  }
  const orders = getCommerceOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx < 0) return null;

  if (status === 'cancelled' || status === 'refunded') {
    for (const line of orders[idx].quote.lines) {
      activeUniqueSkuLocks.delete(line.sku);
    }
  }

  orders[idx] = {
    ...orders[idx],
    status,
    updatedAt: new Date().toISOString(),
  };
  writeCommerceJson(ORDERS_FILE, orders);
  return orders[idx];
}

export function consumeDownloadToken(token: string): {
  valid: boolean;
  error?: string;
  order?: CommerceOrder;
  assetUrl?: string;
  title?: string;
  remainingDownloads?: number;
} {
  const orders = getCommerceOrders();
  for (let i = 0; i < orders.length; i++) {
    const ord = orders[i];
    const tokenIdx = ord.downloadTokens.findIndex((t) => t.token === token);
    if (tokenIdx >= 0) {
      const entry = ord.downloadTokens[tokenIdx];
      if (ord.status !== 'paid' && ord.status !== 'fulfilled') {
        return { valid: false, error: 'Order payment is not settled yet' };
      }
      if (Date.now() > Date.parse(entry.expiresAt)) {
        return { valid: false, error: 'Download link has expired (72h window)' };
      }
      if (entry.downloadsUsed >= entry.maxDownloads) {
        return { valid: false, error: 'Maximum download limit reached' };
      }

      const product = getCommerceProductBySku(entry.sku);
      entry.downloadsUsed += 1;
      ord.updatedAt = new Date().toISOString();
      writeCommerceJson(ORDERS_FILE, orders);

      return {
        valid: true,
        order: ord,
        assetUrl: product?.digitalAssetKey || undefined,
        title: entry.title,
        remainingDownloads: entry.maxDownloads - entry.downloadsUsed,
      };
    }
  }
  return { valid: false, error: 'Invalid download token' };
}

export function getCommerceWithdrawals(): CommerceWithdrawalRequest[] {
  return readCommerceJson<CommerceWithdrawalRequest[]>(WITHDRAWALS_FILE, []);
}

/**
 * Registers a legally compliant French online withdrawal request
 * under Ordonnance n° 2026-2 & Décret n° 2026-3 (effective June 19, 2026, Art. L221-21 & D221-5).
 */
export function createWithdrawalRequest(input: {
  orderNumber: string;
  customerFullName: string;
  customerEmail: string;
  reason?: string;
}): CommerceWithdrawalRequest {
  const withdrawals = getCommerceWithdrawals();
  const matchedOrder = getCommerceOrderByNumber(input.orderNumber);
  const nowIso = new Date().toISOString();
  const ref = `RET-${new Date().getUTCFullYear()}-${String(withdrawals.length + 1).padStart(4, '0')}`;

  let status: CommerceWithdrawalRequest['status'] = 'received';
  let legalBasisNoteFr =
    "Demande de rétractation enregistrée conformément aux articles L.221-18, L.221-21 et D.221-5 du Code de la consommation (délai légal de 14 jours). Remboursement sous 14 jours dès réception ou preuve d'expédition du retour.";

  if (matchedOrder) {
    const onlyDigitalOrCustom = matchedOrder.quote.lines.every((l) => l.requiresWithdrawalWaiver);
    if (onlyDigitalOrCustom) {
      status = 'excluded_by_law';
      legalBasisNoteFr =
        "Accusé de réception enregistré. Attention : cette commande porte exclusivement sur un contenu numérique fourni immédiatement avec renonciation expresse (art. L.221-28 13°) ou une œuvre réalisée sur mesure (art. L.221-28 3°). Notre service étudiera néanmoins votre demande avec bienveillance.";
    } else {
      updateCommerceOrderStatus(matchedOrder.id, 'withdrawal_requested');
    }
  }

  const record: CommerceWithdrawalRequest = {
    id: crypto.randomUUID(),
    referenceCode: ref,
    orderNumber: input.orderNumber.trim().toUpperCase(),
    customerFullName: input.customerFullName.trim(),
    customerEmail: input.customerEmail.trim().toLowerCase(),
    reason: input.reason?.trim().slice(0, 500) || undefined,
    submittedAt: nowIso,
    confirmedAt: nowIso,
    receiptEmailSent: false,
    status,
    legalBasisNoteFr,
  };

  withdrawals.unshift(record);
  writeCommerceJson(WITHDRAWALS_FILE, withdrawals);
  return record;
}

export function markWithdrawalReceiptSent(withdrawalId: string): void {
  const withdrawals = getCommerceWithdrawals();
  const idx = withdrawals.findIndex((w) => w.id === withdrawalId);
  if (idx >= 0) {
    withdrawals[idx].receiptEmailSent = true;
    writeCommerceJson(WITHDRAWALS_FILE, withdrawals);
  }
}

/**
 * Generates French accounting ledger ("Livre de recettes" CSV) separating
 * Artiste-Auteur (URSSAF Limousin) and Commercial BIC (Micro-entreprise) revenues.
 */
export function buildFrenchAccountingLedgerCsv(bucketFilter?: 'all' | 'artiste_auteur' | 'commercial_bic'): string {
  const orders = getCommerceOrders().filter((o) => o.status === 'paid' || o.status === 'fulfilled');
  const headers = [
    'Date_Paiement',
    'Numero_Facture',
    'Numero_Commande',
    'Client',
    'Pays',
    'Mode_Paiement',
    'Regime_Fiscal_Social',
    'Total_Artiste_Auteur_EUR',
    'Total_Commercial_BIC_EUR',
    'Frais_Port_EUR',
    'TVA_EUR',
    'Total_TTC_EUR',
    'Mention_TVA',
  ];

  const rows: string[] = [headers.join(';')];
  for (const ord of orders) {
    const aaEur = (ord.quote.artisteAuteurTotalCents / 100).toFixed(2);
    const bicEur = (ord.quote.commercialBicTotalCents / 100).toFixed(2);
    if (bucketFilter === 'artiste_auteur' && ord.quote.artisteAuteurTotalCents <= 0) continue;
    if (bucketFilter === 'commercial_bic' && ord.quote.commercialBicTotalCents <= 0) continue;

    const regime =
      ord.quote.artisteAuteurTotalCents > 0 && ord.quote.commercialBicTotalCents > 0
        ? 'MIXTE_AA_BIC'
        : ord.quote.artisteAuteurTotalCents > 0
          ? 'ARTISTE_AUTEUR_URSSAF_LIMOUSIN'
          : 'COMMERCIAL_BIC_MICRO';

    const escapeCsv = (v: string) => `"${String(v || '').replace(/"/g, '""')}"`;

    rows.push(
      [
        escapeCsv((ord.paidAt || ord.createdAt).slice(0, 10)),
        escapeCsv(ord.invoiceNumber),
        escapeCsv(ord.orderNumber),
        escapeCsv(ord.customer.fullName),
        escapeCsv(ord.customer.countryCode),
        escapeCsv(ord.paymentMethod),
        escapeCsv(regime),
        aaEur,
        bicEur,
        (ord.quote.shippingCents / 100).toFixed(2),
        (ord.quote.taxCents / 100).toFixed(2),
        (ord.quote.totalCents / 100).toFixed(2),
        escapeCsv(ord.quote.taxNoticeFr),
      ].join(';')
    );
  }

  return '\uFEFF' + rows.join('\n');
}
