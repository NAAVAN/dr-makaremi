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
} from '@/lib/vault-loader';
import { getArtworks, getBooks, getPoems, getVideoSpeeches } from '@/lib/cms';
import {
  computeCanonicalSha256,
  OFFICIAL_DR_MAKAREMI_PUBLIC_KEY,
  signWithEd25519,
  verifyEd25519Signature,
} from '@/lib/crypto';
import { resolveProxiedMediaUrl, resolveVideoCoverUrl } from '@/lib/media-url';
import {
  ensureCommerceSchema,
  getNeonSql,
  isNeonDatabaseConfigured,
} from './db';

const LEGAL_CONFIG_FILE = 'legal-config.json';
const CATALOG_FILE = 'catalog.json';
const CATALOG_OVERRIDES_FILE = 'runtime-catalog-overrides.json';
const CATALOG_DELETED_FILE = 'runtime-catalog-deleted.json';
const ORDERS_FILE = 'runtime-orders.json';
const WITHDRAWALS_FILE = 'runtime-withdrawals.json';
const CERTIFICATES_FILE = 'runtime-certificates.json';

const DEFAULT_LEGAL_CONFIG: CommerceLegalConfig = {
  sellerName: 'Dr Hassan Makaremi',
  tradeName: 'Atelier & Éditions Dr Hassan Makaremi',
  legalStatusFr:
    "Entrepreneur Individuel — Artiste-Auteur (URSSAF Limousin) & Activité complémentaire d'éditions",
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

// Local-only fallback lock map when Neon Postgres is not yet connected
const localUniqueSkuLocks = new Map<string, { orderId: string; expiresAt: number }>();

function mapRowToOrder(row: Record<string, unknown>): CommerceOrder {
  return {
    id: String(row.id),
    orderNumber: String(row.order_number),
    invoiceNumber: String(row.invoice_number),
    status: String(row.status) as CommerceOrderStatus,
    paymentMethod: String(row.payment_method) as CommercePaymentMethod,
    stripeSessionId: row.stripe_session_id ? String(row.stripe_session_id) : null,
    stripePaymentIntentId: row.stripe_payment_intent_id ? String(row.stripe_payment_intent_id) : null,
    locale: (String(row.locale) as Locale) || 'fr',
    customer: row.customer_json as CommerceCustomerInfo,
    quote: row.quote_json as CommerceQuote,
    cgvAcceptedAt: new Date(String(row.cgv_accepted_at)).toISOString(),
    digitalWithdrawalWaivedAt: row.digital_withdrawal_waived_at
      ? new Date(String(row.digital_withdrawal_waived_at)).toISOString()
      : null,
    customOrderWaivedAt: row.custom_order_waived_at
      ? new Date(String(row.custom_order_waived_at)).toISOString()
      : null,
    certificateIds: Array.isArray(row.certificate_ids) ? (row.certificate_ids as string[]) : [],
    downloadTokens: Array.isArray(row.download_tokens_json)
      ? (row.download_tokens_json as CommerceOrder['downloadTokens'])
      : [],
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
    paidAt: row.paid_at ? new Date(String(row.paid_at)).toISOString() : null,
  };
}

function mapRowToWithdrawal(row: Record<string, unknown>): CommerceWithdrawalRequest {
  return {
    id: String(row.id),
    referenceCode: String(row.reference_code),
    orderNumber: String(row.order_number),
    customerFullName: String(row.customer_full_name),
    customerEmail: String(row.customer_email),
    reason: row.reason ? String(row.reason) : undefined,
    submittedAt: new Date(String(row.submitted_at)).toISOString(),
    confirmedAt: new Date(String(row.confirmed_at)).toISOString(),
    receiptEmailSent: Boolean(row.receipt_email_sent),
    status: String(row.status) as CommerceWithdrawalRequest['status'],
    legalBasisNoteFr: String(row.legal_basis_note_fr),
  };
}

export async function getCommerceLegalConfig(): Promise<CommerceLegalConfig> {
  const fileConfig = readCommerceJson<Partial<CommerceLegalConfig>>(
    LEGAL_CONFIG_FILE,
    DEFAULT_LEGAL_CONFIG
  );

  if (isNeonDatabaseConfigured()) {
    try {
      await ensureCommerceSchema();
      const sql = getNeonSql();
      const rows = (await sql`
        SELECT value_json FROM commerce_settings WHERE key = 'legal_config' LIMIT 1
      `) as Array<{ value_json?: Partial<CommerceLegalConfig> }>;
      if (rows[0]?.value_json) {
        return {
          ...DEFAULT_LEGAL_CONFIG,
          ...fileConfig,
          ...rows[0].value_json,
        };
      }
    } catch {
      // Safe fallback to static repo defaults during SSG build or transient outage
    }
  }

  return {
    ...DEFAULT_LEGAL_CONFIG,
    ...fileConfig,
  };
}

export async function saveCommerceLegalConfig(
  patch: Partial<CommerceLegalConfig>
): Promise<CommerceLegalConfig> {
  const current = await getCommerceLegalConfig();
  const next: CommerceLegalConfig = {
    ...current,
    ...patch,
    siretConfigured: Boolean(
      (patch.siret ?? current.siret) &&
      /^\d{14}$/.test((patch.siret ?? current.siret).replace(/\s+/g, ''))
    ),
    updatedAt: new Date().toISOString(),
  };

  if (isNeonDatabaseConfigured()) {
    await ensureCommerceSchema();
    const sql = getNeonSql();
    await sql`
      INSERT INTO commerce_settings (key, value_json, updated_at)
      VALUES ('legal_config', ${JSON.stringify(next)}::jsonb, NOW())
      ON CONFLICT (key) DO UPDATE
      SET value_json = EXCLUDED.value_json, updated_at = NOW()
    `;
    return next;
  }

  writeCommerceJson(LEGAL_CONFIG_FILE, next);
  return next;
}

async function hydrateCatalogWithVaultAndLocks(
  items: CommerceCatalogItem[],
  soldUniqueSkus: Set<string>,
  reservedUniqueSkus: Set<string>
): Promise<CommerceCatalogItem[]> {
  const [artworks, books, poems, videos] = await Promise.all([
    getArtworks('fa'),
    getBooks('fa'),
    getPoems('fa'),
    getVideoSpeeches('fa'),
  ]);
  const artworkMap = new Map(artworks.map((a) => [a.slug, a]));
  const bookMap = new Map(books.map((b) => [b.slug, b]));
  const poemMap = new Map(poems.map((p) => [p.slug, p]));
  const videoMap = new Map(videos.map((v) => [v.slug, v]));

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
      } else if (item.collection === 'poems') {
        const poem = poemMap.get(item.slug);
        resolvedImageUrl = poem?.artwork_image_url
          ? resolveProxiedMediaUrl(poem.artwork_image_url, 'art', item.title.fr)
          : null;
      } else if (item.collection === 'videos') {
        const video = videoMap.get(item.slug);
        resolvedImageUrl = video ? resolveVideoCoverUrl(video, item.title.fr) : null;
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

function mergeBaseAndOverrides(
  baseItems: CommerceCatalogItem[],
  overridesMap: Record<string, CommerceCatalogItem>,
  deletedSkus: Set<string>
): CommerceCatalogItem[] {
  const baseSkuSet = new Set(baseItems.map((i) => i.sku));
  const newlyAdded: CommerceCatalogItem[] = [];
  for (const [sku, overrideItem] of Object.entries(overridesMap)) {
    if (!baseSkuSet.has(sku) && !deletedSkus.has(sku)) {
      newlyAdded.push(overrideItem);
    }
  }
  newlyAdded.sort((a, b) => Date.parse(b.updatedAt || '') - Date.parse(a.updatedAt || ''));

  const mergedBase: CommerceCatalogItem[] = [];
  for (const baseItem of baseItems) {
    if (deletedSkus.has(baseItem.sku)) continue;
    mergedBase.push(overridesMap[baseItem.sku] || baseItem);
  }

  return [...newlyAdded, ...mergedBase];
}

export async function getCommerceCatalog(): Promise<CommerceCatalogItem[]> {
  const baseItems = readCommerceJson<CommerceCatalogItem[]>(CATALOG_FILE, []);
  const soldUniqueSkus = new Set<string>();
  const reservedUniqueSkus = new Set<string>();

  if (isNeonDatabaseConfigured()) {
    try {
      await ensureCommerceSchema();
      const sql = getNeonSql();

      const [overrideRowsRaw, deletedRowsRaw, lockRowsRaw] = await Promise.all([
        sql`SELECT value_json FROM commerce_settings WHERE key = 'catalog_overrides' LIMIT 1`,
        sql`SELECT value_json FROM commerce_settings WHERE key = 'catalog_deleted_skus' LIMIT 1`,
        sql`
          SELECT sku, status, expires_at FROM commerce_unique_locks
          WHERE status = 'sold' OR (status = 'reserved' AND (expires_at IS NULL OR expires_at > NOW()))
        `,
      ]);
      const overrideRows = overrideRowsRaw as Array<{ value_json?: Record<string, CommerceCatalogItem> }>;
      const deletedRows = deletedRowsRaw as Array<{ value_json?: string[] }>;
      const lockRows = lockRowsRaw as Array<{ sku: string; status: string }>;

      const overridesMap = overrideRows[0]?.value_json || {};
      const deletedSkus = new Set<string>(Array.isArray(deletedRows[0]?.value_json) ? deletedRows[0].value_json : []);

      for (const lock of lockRows) {
        if (lock.status === 'sold') soldUniqueSkus.add(lock.sku);
        else reservedUniqueSkus.add(lock.sku);
      }

      return hydrateCatalogWithVaultAndLocks(
        mergeBaseAndOverrides(baseItems, overridesMap, deletedSkus),
        soldUniqueSkus,
        reservedUniqueSkus
      );
    } catch {
      // Safe fallback to static repo catalog during build or outage
    }
  }

  // Local fallback path (mirrors Neon overrides + tombstones cleanly without mutating git seed catalog.json)
  const localOverrides = readCommerceJson<Record<string, CommerceCatalogItem>>(CATALOG_OVERRIDES_FILE, {});
  const localDeleted = new Set<string>(readCommerceJson<string[]>(CATALOG_DELETED_FILE, []));
  const orders = readCommerceJson<CommerceOrder[]>(ORDERS_FILE, []);
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
  for (const [sku, lock] of localUniqueSkuLocks.entries()) {
    if (lock.expiresAt > now) reservedUniqueSkus.add(sku);
    else localUniqueSkuLocks.delete(sku);
  }

  return hydrateCatalogWithVaultAndLocks(
    mergeBaseAndOverrides(baseItems, localOverrides, localDeleted),
    soldUniqueSkus,
    reservedUniqueSkus
  );
}

export async function getCommerceProductBySku(sku: string): Promise<CommerceCatalogItem | null> {
  const all = await getCommerceCatalog();
  return all.find((p) => p.sku === sku) || null;
}

export async function getCommerceProductsForWork(
  collection: CommerceCatalogItem['collection'],
  slug: string
): Promise<CommerceCatalogItem[]> {
  const all = await getCommerceCatalog();
  return all.filter((p) => p.collection === collection && p.slug === slug);
}

export async function upsertCommerceCatalogItem(
  item: CommerceCatalogItem
): Promise<CommerceCatalogItem[]> {
  const stamped: CommerceCatalogItem = {
    ...item,
    updatedAt: new Date().toISOString(),
  };

  if (isNeonDatabaseConfigured()) {
    await ensureCommerceSchema();
    const sql = getNeonSql();
    const [overrideRowsRaw, deletedRowsRaw] = await Promise.all([
      sql`SELECT value_json FROM commerce_settings WHERE key = 'catalog_overrides' LIMIT 1`,
      sql`SELECT value_json FROM commerce_settings WHERE key = 'catalog_deleted_skus' LIMIT 1`,
    ]);
    const overrideRows = overrideRowsRaw as Array<{ value_json?: Record<string, CommerceCatalogItem> }>;
    const deletedRows = deletedRowsRaw as Array<{ value_json?: string[] }>;

    const overrides = { ...(overrideRows[0]?.value_json || {}) };
    overrides[stamped.sku] = stamped;

    await sql`
      INSERT INTO commerce_settings (key, value_json, updated_at)
      VALUES ('catalog_overrides', ${JSON.stringify(overrides)}::jsonb, NOW())
      ON CONFLICT (key) DO UPDATE
      SET value_json = EXCLUDED.value_json, updated_at = NOW()
    `;

    const existingDeleted = Array.isArray(deletedRows[0]?.value_json) ? deletedRows[0].value_json : [];
    if (existingDeleted.includes(stamped.sku)) {
      const nextDeleted = existingDeleted.filter((s) => s !== stamped.sku);
      await sql`
        INSERT INTO commerce_settings (key, value_json, updated_at)
        VALUES ('catalog_deleted_skus', ${JSON.stringify(nextDeleted)}::jsonb, NOW())
        ON CONFLICT (key) DO UPDATE
        SET value_json = EXCLUDED.value_json, updated_at = NOW()
      `;
    }

    return getCommerceCatalog();
  }

  const overrides = { ...readCommerceJson<Record<string, CommerceCatalogItem>>(CATALOG_OVERRIDES_FILE, {}) };
  overrides[stamped.sku] = stamped;
  writeCommerceJson(CATALOG_OVERRIDES_FILE, overrides);

  const deleted = readCommerceJson<string[]>(CATALOG_DELETED_FILE, []);
  if (deleted.includes(stamped.sku)) {
    writeCommerceJson(
      CATALOG_DELETED_FILE,
      deleted.filter((s) => s !== stamped.sku)
    );
  }
  return getCommerceCatalog();
}

export async function deleteCommerceCatalogItem(sku: string): Promise<CommerceCatalogItem[]> {
  const cleanSku = sku.trim();
  if (!cleanSku) return getCommerceCatalog();

  if (isNeonDatabaseConfigured()) {
    await ensureCommerceSchema();
    const sql = getNeonSql();
    const [overrideRowsRaw, deletedRowsRaw] = await Promise.all([
      sql`SELECT value_json FROM commerce_settings WHERE key = 'catalog_overrides' LIMIT 1`,
      sql`SELECT value_json FROM commerce_settings WHERE key = 'catalog_deleted_skus' LIMIT 1`,
    ]);
    const overrideRows = overrideRowsRaw as Array<{ value_json?: Record<string, CommerceCatalogItem> }>;
    const deletedRows = deletedRowsRaw as Array<{ value_json?: string[] }>;

    const overrides = { ...(overrideRows[0]?.value_json || {}) };
    if (cleanSku in overrides) {
      delete overrides[cleanSku];
      await sql`
        INSERT INTO commerce_settings (key, value_json, updated_at)
        VALUES ('catalog_overrides', ${JSON.stringify(overrides)}::jsonb, NOW())
        ON CONFLICT (key) DO UPDATE
        SET value_json = EXCLUDED.value_json, updated_at = NOW()
      `;
    }

    const baseItems = readCommerceJson<CommerceCatalogItem[]>(CATALOG_FILE, []);
    const isInBase = baseItems.some((b) => b.sku === cleanSku);
    if (isInBase) {
      const deletedSet = new Set<string>(
        Array.isArray(deletedRows[0]?.value_json) ? deletedRows[0].value_json : []
      );
      deletedSet.add(cleanSku);
      await sql`
        INSERT INTO commerce_settings (key, value_json, updated_at)
        VALUES ('catalog_deleted_skus', ${JSON.stringify(Array.from(deletedSet))}::jsonb, NOW())
        ON CONFLICT (key) DO UPDATE
        SET value_json = EXCLUDED.value_json, updated_at = NOW()
      `;
    }

    return getCommerceCatalog();
  }

  const overrides = { ...readCommerceJson<Record<string, CommerceCatalogItem>>(CATALOG_OVERRIDES_FILE, {}) };
  if (cleanSku in overrides) {
    delete overrides[cleanSku];
    writeCommerceJson(CATALOG_OVERRIDES_FILE, overrides);
  }

  const baseItems = readCommerceJson<CommerceCatalogItem[]>(CATALOG_FILE, []);
  if (baseItems.some((b) => b.sku === cleanSku)) {
    const deletedSet = new Set<string>(readCommerceJson<string[]>(CATALOG_DELETED_FILE, []));
    deletedSet.add(cleanSku);
    writeCommerceJson(CATALOG_DELETED_FILE, Array.from(deletedSet));
  }

  return getCommerceCatalog();
}

export async function getCommerceOrders(): Promise<CommerceOrder[]> {
  if (isNeonDatabaseConfigured()) {
    await ensureCommerceSchema();
    const sql = getNeonSql();
    const rows = (await sql`
      SELECT * FROM commerce_orders ORDER BY created_at DESC LIMIT 500
    `) as Record<string, unknown>[];
    return rows.map(mapRowToOrder);
  }
  return readCommerceJson<CommerceOrder[]>(ORDERS_FILE, []);
}

export async function getCommerceOrderByNumber(orderNumber: string): Promise<CommerceOrder | null> {
  const clean = orderNumber.trim().toUpperCase();
  if (isNeonDatabaseConfigured()) {
    await ensureCommerceSchema();
    const sql = getNeonSql();
    const rows = (await sql`
      SELECT * FROM commerce_orders WHERE UPPER(order_number) = ${clean} LIMIT 1
    `) as Record<string, unknown>[];
    return rows[0] ? mapRowToOrder(rows[0]) : null;
  }
  const orders = readCommerceJson<CommerceOrder[]>(ORDERS_FILE, []);
  return orders.find((o) => o.orderNumber.toUpperCase() === clean) || null;
}

export async function getCommerceOrderById(orderId: string): Promise<CommerceOrder | null> {
  if (isNeonDatabaseConfigured()) {
    await ensureCommerceSchema();
    const sql = getNeonSql();
    const rows = (await sql`
      SELECT * FROM commerce_orders WHERE id = ${orderId}::uuid LIMIT 1
    `) as Record<string, unknown>[];
    return rows[0] ? mapRowToOrder(rows[0]) : null;
  }
  const orders = readCommerceJson<CommerceOrder[]>(ORDERS_FILE, []);
  return orders.find((o) => o.id === orderId) || null;
}

export async function createCommerceOrder(input: {
  paymentMethod: CommercePaymentMethod;
  locale: Locale;
  customer: CommerceCustomerInfo;
  quote: CommerceQuote;
  digitalWithdrawalWaived: boolean;
  customOrderWaived: boolean;
  stripeSessionId?: string | null;
}): Promise<CommerceOrder> {
  const nowIso = new Date().toISOString();
  const id = crypto.randomUUID();
  const catalog = await getCommerceCatalog();
  const bySku = new Map(catalog.map((c) => [c.sku, c]));

  for (const line of input.quote.lines) {
    const prod = bySku.get(line.sku);
    if (!prod || prod.availability !== 'available') {
      throw new Error(`Item ${line.sku} is no longer available (${prod?.availability || 'missing'})`);
    }
  }

  const initialStatus: CommerceOrderStatus =
    input.paymentMethod === 'sepa_wire' ? 'awaiting_sepa_transfer' : 'pending_payment';

  if (isNeonDatabaseConfigured()) {
    await ensureCommerceSchema();
    const sql = getNeonSql();

    // Distributed atomic unique-artwork locking in Postgres (prevents multi-instance double-sell)
    const acquiredUniqueSkus: string[] = [];
    const lockExpiresSql = input.paymentMethod === 'sepa_wire' ? null : new Date(Date.now() + 30 * 60 * 1000).toISOString();

    try {
      for (const line of input.quote.lines) {
        if (line.kind !== 'original_artwork') continue;
        const lockRows = (await sql`
          INSERT INTO commerce_unique_locks (sku, order_id, status, expires_at, updated_at)
          VALUES (${line.sku}, ${id}::uuid, 'reserved', ${lockExpiresSql}::timestamptz, NOW())
          ON CONFLICT (sku) DO UPDATE
          SET order_id = EXCLUDED.order_id,
              status = 'reserved',
              expires_at = EXCLUDED.expires_at,
              updated_at = NOW()
          WHERE commerce_unique_locks.status = 'reserved'
            AND commerce_unique_locks.expires_at IS NOT NULL
            AND commerce_unique_locks.expires_at < NOW()
          RETURNING sku
        `) as Array<{ sku: string }>;

        if (lockRows.length === 0) {
          throw new Error(`Original artwork ${line.sku} is currently reserved or already sold`);
        }
        acquiredUniqueSkus.push(line.sku);
      }

      const seqRows = (await sql`SELECT nextval('commerce_invoice_seq') AS seq`) as Array<{ seq: string | number }>;
      const seq = Number(seqRows[0]?.seq || 1);
      const year = new Date().getUTCFullYear();
      const padded = String(seq).padStart(4, '0');
      const orderNumber = `MKM-${year}-${padded}`;
      const invoiceNumber = `FACT-${year}-${padded}`;

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

      await sql`
        INSERT INTO commerce_orders (
          id, order_number, invoice_number, status, payment_method,
          stripe_session_id, stripe_payment_intent_id, locale,
          customer_json, quote_json, certificate_ids, download_tokens_json,
          artiste_auteur_total_cents, commercial_bic_total_cents,
          shipping_cents, tax_cents, total_cents, loi_darcos_applied,
          cgv_accepted_at, digital_withdrawal_waived_at, custom_order_waived_at,
          paid_at, created_at, updated_at
        ) VALUES (
          ${order.id}::uuid, ${order.orderNumber}, ${order.invoiceNumber}, ${order.status}, ${order.paymentMethod},
          ${order.stripeSessionId}, NULL, ${order.locale},
          ${JSON.stringify(order.customer)}::jsonb, ${JSON.stringify(order.quote)}::jsonb,
          '[]'::jsonb, '[]'::jsonb,
          ${order.quote.artisteAuteurTotalCents}, ${order.quote.commercialBicTotalCents},
          ${order.quote.shippingCents}, ${order.quote.taxCents}, ${order.quote.totalCents}, ${order.quote.loiDarcosApplied},
          ${order.cgvAcceptedAt}::timestamptz,
          ${order.digitalWithdrawalWaivedAt}::timestamptz,
          ${order.customOrderWaivedAt}::timestamptz,
          NULL, ${order.createdAt}::timestamptz, ${order.updatedAt}::timestamptz
        )
      `;

      return order;
    } catch (err) {
      // Release any locks claimed before the error
      for (const sku of acquiredUniqueSkus) {
        await sql`DELETE FROM commerce_unique_locks WHERE sku = ${sku} AND order_id = ${id}::uuid`.catch(
          () => { }
        );
      }
      throw err;
    }
  }

  // Local fallback path
  const orders = readCommerceJson<CommerceOrder[]>(ORDERS_FILE, []);
  const now = Date.now();
  for (const line of input.quote.lines) {
    if (line.kind === 'original_artwork') {
      const existingLock = localUniqueSkuLocks.get(line.sku);
      if (existingLock && existingLock.expiresAt > now) {
        throw new Error(`Original artwork ${line.sku} is currently reserved in another active checkout`);
      }
    }
  }

  const year = new Date().getUTCFullYear();
  const padded = String(orders.length + 1).padStart(4, '0');
  const orderNumber = `MKM-${year}-${padded}`;
  const invoiceNumber = `FACT-${year}-${padded}`;

  for (const line of input.quote.lines) {
    if (line.kind === 'original_artwork') {
      localUniqueSkuLocks.set(line.sku, { orderId: id, expiresAt: now + 30 * 60 * 1000 });
    }
  }

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

export async function attachStripeSessionToOrder(
  orderId: string,
  stripeSessionId: string
): Promise<CommerceOrder | null> {
  if (isNeonDatabaseConfigured()) {
    await ensureCommerceSchema();
    const sql = getNeonSql();
    const rows = (await sql`
      UPDATE commerce_orders
      SET stripe_session_id = ${stripeSessionId}, updated_at = NOW()
      WHERE id = ${orderId}::uuid
      RETURNING *
    `) as Record<string, unknown>[];
    return rows[0] ? mapRowToOrder(rows[0]) : null;
  }

  const orders = readCommerceJson<CommerceOrder[]>(ORDERS_FILE, []);
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx < 0) return null;
  orders[idx] = { ...orders[idx], stripeSessionId, updatedAt: new Date().toISOString() };
  writeCommerceJson(ORDERS_FILE, orders);
  return orders[idx];
}

export function buildCertificateCanonicalString(
  cert: Omit<ArtworkAuthenticityCertificate, 'canonicalSha256' | 'signatureEd25519'>
): string {
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

export async function getAuthenticityCertificates(): Promise<ArtworkAuthenticityCertificate[]> {
  if (isNeonDatabaseConfigured()) {
    await ensureCommerceSchema();
    const sql = getNeonSql();
    const rows = (await sql`
      SELECT payload_json FROM commerce_certificates ORDER BY issued_at DESC LIMIT 500
    `) as Array<{ payload_json: ArtworkAuthenticityCertificate }>;
    return rows.map((r) => r.payload_json);
  }
  return readCommerceJson<ArtworkAuthenticityCertificate[]>(CERTIFICATES_FILE, []);
}

export async function getAuthenticityCertificateById(
  certificateId: string
): Promise<ArtworkAuthenticityCertificate | null> {
  const clean = certificateId.trim().toUpperCase();
  if (isNeonDatabaseConfigured()) {
    await ensureCommerceSchema();
    const sql = getNeonSql();
    const rows = (await sql`
      SELECT payload_json FROM commerce_certificates WHERE UPPER(certificate_id) = ${clean} LIMIT 1
    `) as Array<{ payload_json: ArtworkAuthenticityCertificate }>;
    return rows[0]?.payload_json || null;
  }
  const all = readCommerceJson<ArtworkAuthenticityCertificate[]>(CERTIFICATES_FILE, []);
  return all.find((c) => c.certificateId.toUpperCase() === clean) || null;
}

export async function markCommerceOrderPaid(input: {
  orderId?: string;
  orderNumber?: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string | null;
}): Promise<CommerceOrder | null> {
  let existing: CommerceOrder | null = null;

  if (isNeonDatabaseConfigured()) {
    await ensureCommerceSchema();
    const sql = getNeonSql();
    if (input.orderId) {
      existing = await getCommerceOrderById(input.orderId);
    } else if (input.orderNumber) {
      existing = await getCommerceOrderByNumber(input.orderNumber);
    } else if (input.stripeSessionId) {
      const rows = (await sql`
        SELECT * FROM commerce_orders WHERE stripe_session_id = ${input.stripeSessionId} LIMIT 1
      `) as Record<string, unknown>[];
      existing = rows[0] ? mapRowToOrder(rows[0]) : null;
    }
  } else {
    const orders = readCommerceJson<CommerceOrder[]>(ORDERS_FILE, []);
    existing =
      orders.find(
        (o) =>
          (input.orderId && o.id === input.orderId) ||
          (input.orderNumber && o.orderNumber === input.orderNumber) ||
          (input.stripeSessionId && o.stripeSessionId === input.stripeSessionId)
      ) || null;
  }

  if (!existing) return null;
  if (existing.status === 'paid' || existing.status === 'fulfilled') {
    return existing;
  }

  const nowIso = new Date().toISOString();
  const catalog = await getCommerceCatalog();
  const bySku = new Map(catalog.map((c) => [c.sku, c]));
  const issuedCertificateIds: string[] = [...existing.certificateIds];
  const mintedCerts: ArtworkAuthenticityCertificate[] = [];
  const downloadTokens = [...existing.downloadTokens];

  for (const line of existing.quote.lines) {
    const prod = bySku.get(line.sku);

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

      mintedCerts.push(signedCert);
      issuedCertificateIds.push(certId);
    }

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

  const updatedOrder: CommerceOrder = {
    ...existing,
    status: 'paid',
    stripePaymentIntentId: input.stripePaymentIntentId ?? existing.stripePaymentIntentId,
    certificateIds: issuedCertificateIds,
    downloadTokens,
    paidAt: nowIso,
    updatedAt: nowIso,
  };

  if (isNeonDatabaseConfigured()) {
    await ensureCommerceSchema();
    const sql = getNeonSql();

    for (const cert of mintedCerts) {
      await sql`
        INSERT INTO commerce_certificates (
          certificate_id, order_number, invoice_number, sku, artwork_slug,
          plate_image_id, kind, buyer_name, canonical_sha256, signature_ed25519,
          payload_json, issued_at
        ) VALUES (
          ${cert.certificateId}, ${cert.orderNumber}, ${cert.invoiceNumber}, ${cert.sku}, ${cert.artworkSlug},
          ${cert.plateImageId ?? null}, ${cert.kind}, ${cert.buyerName}, ${cert.canonicalSha256}, ${cert.signatureEd25519},
          ${JSON.stringify(cert)}::jsonb, ${cert.issuedAt}::timestamptz
        )
        ON CONFLICT (certificate_id) DO NOTHING
      `;
    }

    for (const line of existing.quote.lines) {
      if (line.kind === 'original_artwork') {
        await sql`
          INSERT INTO commerce_unique_locks (sku, order_id, status, expires_at, updated_at)
          VALUES (${line.sku}, ${existing.id}::uuid, 'sold', NULL, NOW())
          ON CONFLICT (sku) DO UPDATE
          SET order_id = EXCLUDED.order_id, status = 'sold', expires_at = NULL, updated_at = NOW()
        `;
      }
    }

    await sql`
      UPDATE commerce_orders
      SET status = 'paid',
          stripe_payment_intent_id = ${updatedOrder.stripePaymentIntentId},
          certificate_ids = ${JSON.stringify(updatedOrder.certificateIds)}::jsonb,
          download_tokens_json = ${JSON.stringify(updatedOrder.downloadTokens)}::jsonb,
          paid_at = ${nowIso}::timestamptz,
          updated_at = NOW()
      WHERE id = ${existing.id}::uuid
    `;

    return updatedOrder;
  }

  // Local fallback path
  const certificates = readCommerceJson<ArtworkAuthenticityCertificate[]>(CERTIFICATES_FILE, []);
  certificates.unshift(...mintedCerts);
  writeCommerceJson(CERTIFICATES_FILE, certificates);

  for (const line of existing.quote.lines) {
    localUniqueSkuLocks.delete(line.sku);
  }

  const orders = readCommerceJson<CommerceOrder[]>(ORDERS_FILE, []);
  const idx = orders.findIndex((o) => o.id === existing!.id);
  if (idx >= 0) {
    orders[idx] = updatedOrder;
    writeCommerceJson(ORDERS_FILE, orders);
  }
  return updatedOrder;
}

export async function updateCommerceOrderStatus(
  orderId: string,
  status: CommerceOrderStatus
): Promise<CommerceOrder | null> {
  if (status === 'paid') {
    return markCommerceOrderPaid({ orderId });
  }

  if (isNeonDatabaseConfigured()) {
    await ensureCommerceSchema();
    const sql = getNeonSql();
    const rows = (await sql`
      UPDATE commerce_orders
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${orderId}::uuid
      RETURNING *
    `) as Record<string, unknown>[];
    if (!rows[0]) return null;

    if (status === 'cancelled' || status === 'refunded') {
      await sql`DELETE FROM commerce_unique_locks WHERE order_id = ${orderId}::uuid`;
    }
    return mapRowToOrder(rows[0]);
  }

  const orders = readCommerceJson<CommerceOrder[]>(ORDERS_FILE, []);
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx < 0) return null;

  if (status === 'cancelled' || status === 'refunded') {
    for (const line of orders[idx].quote.lines) {
      localUniqueSkuLocks.delete(line.sku);
    }
  }
  orders[idx] = { ...orders[idx], status, updatedAt: new Date().toISOString() };
  writeCommerceJson(ORDERS_FILE, orders);
  return orders[idx];
}

export async function consumeDownloadToken(token: string): Promise<{
  valid: boolean;
  error?: string;
  order?: CommerceOrder;
  assetUrl?: string;
  title?: string;
  remainingDownloads?: number;
}> {
  const orders = await getCommerceOrders();
  for (const ord of orders) {
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

      const product = await getCommerceProductBySku(entry.sku);
      entry.downloadsUsed += 1;
      ord.updatedAt = new Date().toISOString();

      if (isNeonDatabaseConfigured()) {
        await ensureCommerceSchema();
        const sql = getNeonSql();
        await sql`
          UPDATE commerce_orders
          SET download_tokens_json = ${JSON.stringify(ord.downloadTokens)}::jsonb,
              updated_at = NOW()
          WHERE id = ${ord.id}::uuid
        `;
      } else {
        writeCommerceJson(ORDERS_FILE, orders);
      }

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

export async function getCommerceWithdrawals(): Promise<CommerceWithdrawalRequest[]> {
  if (isNeonDatabaseConfigured()) {
    await ensureCommerceSchema();
    const sql = getNeonSql();
    const rows = (await sql`
      SELECT * FROM commerce_withdrawals ORDER BY submitted_at DESC LIMIT 500
    `) as Record<string, unknown>[];
    return rows.map(mapRowToWithdrawal);
  }
  return readCommerceJson<CommerceWithdrawalRequest[]>(WITHDRAWALS_FILE, []);
}

export async function createWithdrawalRequest(input: {
  orderNumber: string;
  customerFullName: string;
  customerEmail: string;
  reason?: string;
}): Promise<CommerceWithdrawalRequest> {
  const existingWithdrawals = await getCommerceWithdrawals();
  const matchedOrder = await getCommerceOrderByNumber(input.orderNumber);
  const nowIso = new Date().toISOString();
  const ref = `RET-${new Date().getUTCFullYear()}-${String(existingWithdrawals.length + 1).padStart(4, '0')}`;

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
      await updateCommerceOrderStatus(matchedOrder.id, 'withdrawal_requested');
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

  if (isNeonDatabaseConfigured()) {
    await ensureCommerceSchema();
    const sql = getNeonSql();
    await sql`
      INSERT INTO commerce_withdrawals (
        id, reference_code, order_number, customer_full_name, customer_email,
        reason, status, legal_basis_note_fr, receipt_email_sent, submitted_at, confirmed_at
      ) VALUES (
        ${record.id}::uuid, ${record.referenceCode}, ${record.orderNumber}, ${record.customerFullName}, ${record.customerEmail},
        ${record.reason ?? null}, ${record.status}, ${record.legalBasisNoteFr}, FALSE,
        ${record.submittedAt}::timestamptz, ${record.confirmedAt}::timestamptz
      )
    `;
    return record;
  }

  existingWithdrawals.unshift(record);
  writeCommerceJson(WITHDRAWALS_FILE, existingWithdrawals);
  return record;
}

export async function markWithdrawalReceiptSent(withdrawalId: string): Promise<void> {
  if (isNeonDatabaseConfigured()) {
    await ensureCommerceSchema();
    const sql = getNeonSql();
    await sql`
      UPDATE commerce_withdrawals SET receipt_email_sent = TRUE WHERE id = ${withdrawalId}::uuid
    `;
    return;
  }

  const withdrawals = readCommerceJson<CommerceWithdrawalRequest[]>(WITHDRAWALS_FILE, []);
  const idx = withdrawals.findIndex((w) => w.id === withdrawalId);
  if (idx >= 0) {
    withdrawals[idx].receiptEmailSent = true;
    writeCommerceJson(WITHDRAWALS_FILE, withdrawals);
  }
}

export async function buildFrenchAccountingLedgerCsv(
  bucketFilter?: 'all' | 'artiste_auteur' | 'commercial_bic'
): Promise<string> {
  const orders = (await getCommerceOrders()).filter(
    (o) => o.status === 'paid' || o.status === 'fulfilled'
  );
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
