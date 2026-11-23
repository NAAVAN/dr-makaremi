import type { Locale } from './i18n';

export type CommerceProductKind =
  | 'original_artwork'
  | 'fine_art_print'
  | 'book_physical_signed'
  | 'book_digital_ebook'
  | 'commission_inquiry'
  | 'patronage_edition';

/**
 * Dual-bucket French social & tax classification:
 * - artiste_auteur: URSSAF Limousin (Décret 2020-1095) — original hand-executed artworks, self-published books, royalties
 * - commercial_bic: Micro-entreprise / BIC — digital Fine Art reproductions (CGI Annexe III Art. 98 A), publisher stock resale
 */
export type LegalEntityBucket = 'artiste_auteur' | 'commercial_bic';

export type CommerceAvailability =
  | 'available'
  | 'reserved'
  | 'sold'
  | 'inquiry_only'
  | 'external_publisher'
  | 'not_for_sale';

export type CommerceTaxMode = 'franchise_en_base' | 'tva_active';

export type CommercePaymentMethod = 'stripe_card' | 'stripe_alma' | 'sepa_wire';

export interface LocalizedTextMap {
  fa: string;
  fr: string;
  en: string;
}

export interface CommercePhysicalSpecs {
  dimensionsCm?: string | null;
  medium?: LocalizedTextMap | null;
  weightGrams?: number | null;
  framed?: boolean;
  paperOrSupport?: string | null;
  signedByArtist?: boolean;
  numberedEdition?: boolean;
}

export interface CommerceCatalogItem {
  sku: string;
  collection: 'artworks' | 'books' | 'poems' | 'videos' | 'patronage';
  slug: string;
  plateImageId?: number | null;
  imageUrl?: string | null;
  kind: CommerceProductKind;
  legalBucket: LegalEntityBucket;
  availability: CommerceAvailability;
  /** Price in EUR cents (TTC). Null when availability is inquiry_only or external_publisher. */
  priceEurCents: number | null;
  /** Applicable VAT basis points when taxMode === 'tva_active': 550 (5.5%) or 2000 (20%) or 0. */
  vatRateBasisPoints: 0 | 550 | 2000;
  editionSize?: number | null;
  editionRemaining?: number | null;
  title: LocalizedTextMap;
  subtitle?: LocalizedTextMap | null;
  description?: LocalizedTextMap | null;
  physicalSpecs?: CommercePhysicalSpecs | null;
  /** Private or archival asset reference for digital deliveries */
  digitalAssetKey?: string | null;
  /** Verified external publisher link (e.g. L'Harmattan, Amazon, Jeihoon) */
  externalPublisherUrl?: string | null;
  externalPublisherLabel?: string | null;
  /** True for digital downloads (Art. L221-28 13°) and bespoke commissions (Art. L221-28 3°) */
  requiresWithdrawalWaiver: boolean;
  /** Customs HS code for international CN23 exports (9701.91 artworks, 4901.99 books, 4911.91 prints) */
  hsCode: string;
  featured?: boolean;
  year?: number | null;
  updatedAt: string;
}

export interface CommerceLegalConfig {
  sellerName: string;
  tradeName: string;
  legalStatusFr: string;
  legalStatusFa: string;
  legalStatusEn: string;
  siret: string;
  siretConfigured: boolean;
  urssafArtisteAuteurRef: string;
  apeCode: string;
  addressLine1: string;
  postalCodeCity: string;
  country: string;
  email: string;
  phone: string;
  directorOfPublication: string;
  hostName: string;
  hostAddress: string;
  hostWebsite: string;
  taxMode: CommerceTaxMode;
  vatNumber: string | null;
  franchiseMentionFr: string;
  mediatorName: string;
  mediatorUrl: string;
  mediatorAddress: string;
  sepaAccountHolder: string;
  sepaIban: string;
  sepaBic: string;
  sepaBankName: string;
  /** Above this amount (EUR cents), SEPA wire is highlighted as primary 0%-fee option */
  sepaRecommendedThresholdEurCents: number;
  /** Mandatory EU/FR e-invoicing readiness notice (Sept 2026 reception / Sept 2027 e-reporting) */
  eInvoicingPlatformName: string;
  updatedAt: string;
}

export interface CommerceCartItemInput {
  sku: string;
  quantity: number;
  customDedication?: string;
}

export interface CommerceQuoteLine {
  sku: string;
  title: LocalizedTextMap;
  kind: CommerceProductKind;
  legalBucket: LegalEntityBucket;
  quantity: number;
  unitPriceCents: number;
  lineSubtotalCents: number;
  vatRateBasisPoints: 0 | 550 | 2000;
  vatAmountCents: number;
  hsCode: string;
  requiresWithdrawalWaiver: boolean;
  customDedication?: string;
}

export interface CommerceQuote {
  currency: 'EUR';
  countryCode: string;
  shippingZone: 'FR' | 'EU' | 'INTL' | 'DIGITAL_ONLY';
  taxMode: CommerceTaxMode;
  taxNoticeFr: string;
  lines: CommerceQuoteLine[];
  subtotalCents: number;
  shippingCents: number;
  loiDarcosApplied: boolean;
  loiDarcosBookSubtotalCents: number;
  taxCents: number;
  totalCents: number;
  artisteAuteurTotalCents: number;
  commercialBicTotalCents: number;
  requiresDigitalWaiver: boolean;
  requiresCustomWaiver: boolean;
  hasPhysicalGoods: boolean;
  hasOriginalArtwork: boolean;
  sepaRecommended: boolean;
  eligiblePaymentMethods: CommercePaymentMethod[];
}

export type CommerceOrderStatus =
  | 'pending_payment'
  | 'awaiting_sepa_transfer'
  | 'paid'
  | 'fulfilled'
  | 'withdrawal_requested'
  | 'refunded'
  | 'cancelled';

export interface CommerceCustomerInfo {
  fullName: string;
  email: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  city?: string;
  countryCode: string;
  notes?: string;
}

export interface CommerceOrder {
  id: string;
  orderNumber: string;
  invoiceNumber: string;
  status: CommerceOrderStatus;
  paymentMethod: CommercePaymentMethod;
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  locale: Locale;
  customer: CommerceCustomerInfo;
  quote: CommerceQuote;
  cgvAcceptedAt: string;
  digitalWithdrawalWaivedAt?: string | null;
  customOrderWaivedAt?: string | null;
  certificateIds: string[];
  downloadTokens: Array<{
    token: string;
    sku: string;
    title: string;
    expiresAt: string;
    downloadsUsed: number;
    maxDownloads: number;
  }>;
  createdAt: string;
  updatedAt: string;
  paidAt?: string | null;
}

export interface CommerceWithdrawalRequest {
  id: string;
  referenceCode: string;
  orderNumber: string;
  customerFullName: string;
  customerEmail: string;
  reason?: string;
  submittedAt: string;
  confirmedAt: string;
  receiptEmailSent: boolean;
  status: 'received' | 'approved' | 'refunded' | 'excluded_by_law';
  legalBasisNoteFr: string;
}

export interface ArtworkAuthenticityCertificate {
  certificateId: string;
  orderNumber: string;
  invoiceNumber: string;
  sku: string;
  artworkSlug: string;
  plateImageId?: number | null;
  artworkTitle: LocalizedTextMap;
  artistName: string;
  creationYear?: number | null;
  kind: 'original_artwork' | 'fine_art_print';
  editionLabel: string;
  dimensionsCm: string;
  medium: LocalizedTextMap;
  buyerName: string;
  issuedAt: string;
  canonicalSha256: string;
  signatureEd25519: string;
  publicKeyUrl: string;
  decretMarcusStatementFr: string;
}

export interface CommerceArchivePlateOption {
  id: number;
  title: string;
  imageUrl: string;
}

export interface CommerceArchiveWorkOption {
  collection: CommerceCatalogItem['collection'];
  slug: string;
  title: LocalizedTextMap;
  year?: number | null;
  imageUrl?: string | null;
  medium?: string | null;
  dimensions?: string | null;
  publisherName?: string | null;
  isbn?: string | null;
  pdfUrls?: string[];
  externalLinks?: Array<{ platform: string; url: string; label: string }>;
  plates?: CommerceArchivePlateOption[];
}

export interface CommerceArchiveOptionsPayload {
  counts: {
    artworks: number;
    artworkPlates: number;
    books: number;
    poems: number;
    videos: number;
  };
  artworks: CommerceArchiveWorkOption[];
  books: CommerceArchiveWorkOption[];
  poems: CommerceArchiveWorkOption[];
  videos: CommerceArchiveWorkOption[];
}
