import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { FileCheck2, ArrowLeft, ArrowRight, RotateCcw, ShieldCheck } from 'lucide-react';
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import { buildTrilingualMetadata } from '@/lib/seo-helpers';
import { getCommerceLegalConfig } from '@/lib/commerce/store';
import { DestinationLinkButton } from '@/components/common/DestinationLinkButton';

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  return buildTrilingualMetadata({
    locale,
    path: '/legal/cgv',
    title: isFa
      ? 'شرایط عمومی فروش (CGV — منطبق با قوانین فرانسه ۲۰۲۶)'
      : isFr
        ? 'Conditions Générales de Vente (CGV) — Atelier & Éditions Dr Hassan Makaremi'
        : 'General Terms of Sale (French CGV) — Dr. Hassan Makaremi',
    description: isFa
      ? 'شرایط عمومی فروش آثار هنری اصل، چاپ‌های موزه‌ای شماره‌دار، کتاب‌های چاپی و دیجیتال مطابق قوانین فرانسه (Loi Lang، Loi Darcos، Décret Marcus و حق انصراف ۱۴ روزه).'
      : isFr
        ? 'CGV conformes au Code de la consommation français : œuvres originales (Décret Marcus), tirages Fine Art, livres (Loi Lang & Loi Darcos), rétractation en ligne.'
        : 'French Consumer Code compliant General Terms of Sale covering original artworks, Fine Art prints, books (Loi Lang & Loi Darcos), payments, and online withdrawal.',
    includeMarkdownTwin: false,
  });
}

export default async function CgvPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  if (!isValidLocale(locale)) notFound();

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const tx = (fa: string, fr: string, en: string) => (isFa ? fa : isFr ? fr : en);
  const cfg = await getCommerceLegalConfig();

  const clauses = [
    {
      num: '1',
      title: tx('موضوع و هویت فروشنده', 'Objet et identité du vendeur', 'Scope & Seller Identity'),
      body: tx(
        `این شرایط عمومی فروش (CGV) تمامی سفارش‌های آنلاین ثبت‌شده در وب‌سایت makaremi.com را برای تملک آثار هنری اصل نقاشی‌خط، چاپ‌های موزه‌ای شماره‌دار، کتاب‌های چاپی امضاشده و نسخه‌های دیجیتال توسط ${cfg.sellerName} (${cfg.legalStatusFa}) تنظیم می‌کند.`,
        `Les présentes Conditions Générales de Vente (CGV) régissent l’ensemble des ventes conclues sur makaremi.com par ${cfg.sellerName} (${cfg.legalStatusFr}, SIRET : ${cfg.siret}, ${cfg.postalCodeCity}, ${cfg.email}).`,
        `These General Terms of Sale (CGV) govern all online purchases of original artworks, numbered Fine Art prints, signed physical books, and digital editions sold on makaremi.com by ${cfg.sellerName} (${cfg.postalCodeCity}, France).`
      ),
    },
    {
      num: '2',
      title: tx('تفکیک حقوقی آثار اصل از چاپ‌های موزه‌ای (Décret Marcus & CGI Art. 98 A)', 'Qualification des œuvres — Décret Marcus & Art. 98 A CGI', 'Artwork Authenticity & Classification (Décret Marcus)'),
      body: tx(
        'آثار مشخص‌شده با عنوان «اثر اصل یکتا (Œuvre originale)» کاملاً با دست توسط دکتر حسن مکارمی خلق شده و همراه با گواهی اصالت Décret Marcus (شماره ۸۱-۲۵۵) و امضای رمزنگاری‌شده Ed25519 عرضه می‌شوند. چاپ‌های موزه‌ای شماره‌دار روی کاغذ Hahnemühle (Tirages Fine Art) به‌صراحت به‌عنوان «بازتولید هنری شماره‌دار و امضاشده» عرضه می‌شوند و با اثر اصل دستی تفکیک شده‌اند.',
        'Les pièces identifiées « Œuvre originale » sont entièrement exécutées à la main par l’artiste et livrées avec un certificat d’authenticité conforme au décret n° 81-255 du 3 mars 1981 (décret Marcus) doté d’une signature numérique Ed25519 vérifiable. Les « Tirages Fine Art » numérotés sur papier Hahnemühle constituent des reproductions d’art signées et numérotées, distinctes des œuvres originales au sens de l’article 98 A de l’annexe III du CGI.',
        'Items designated as "Original Artwork" are unique hand-executed works accompanied by a French Décret Marcus Certificate of Authenticity with verifiable Ed25519 signature. Numbered Hahnemühle "Fine Art Prints" are explicitly designated as signed limited-edition art reproductions.'
      ),
    },
    {
      num: '3',
      title: tx('قیمت‌ها، مالیات (TVA) و قانون کتاب فرانسه (Loi Lang & Loi Darcos)', 'Prix, TVA, Loi Lang & Frais de port Loi Darcos', 'Pricing, VAT, Loi Lang & Loi Darcos Book Shipping'),
      body: tx(
        `تمامی قیمت‌ها به یورو (€) درج شده‌اند. در وضعیت فعلی: «${cfg.taxMode === 'franchise_en_base' ? cfg.franchiseMentionFr : 'TVA française applicable (5,5 % livres & œuvres originales, 20 % reproductions)'}». برای کتاب‌های چاپی نو در فرانسه، قیمت واحد ناشر (Loi Lang) و حداقل هزینه ارسال ۳.۰۰ یورو برای سفارش‌های زیر ۳۵ یورو (Loi Darcos) به‌صورت خودکار در سبد خرید اعمال می‌شود. ارسال به خارج از اتحادیه اروپا معاف از TVA و همراه اظهارنامه گمرکی CN23 است (عوارض احتمالی گمرک کشور مقصد بر عهده خریدار است).`,
        `Les prix sont indiqués en euros (€) toutes taxes comprises. Régime fiscal applicable : « ${cfg.taxMode === 'franchise_en_base' ? cfg.franchiseMentionFr : 'TVA 5,5 % (œuvres originales et livres papier/numériques) / 20 % (reproductions Fine Art)'} ». Conformément à la loi Lang et à la loi Darcos, toute commande de livres neufs expédiée en France d’un montant inférieur à 35 € inclut des frais de port minimaux obligatoires de 3,00 €. Les exportations hors UE font l’objet d’une déclaration douanière CN23 (droits et taxes locaux à la charge du destinataire).`,
        `All prices are listed in Euros (EUR). Current French VAT status: "${cfg.taxMode === 'franchise_en_base' ? cfg.franchiseMentionFr : 'French VAT included (5.5% originals & books, 20% Fine Art prints)'}". In compliance with French Loi Lang and Loi Darcos, new physical books shipped within France under €35 carry a mandatory minimum €3.00 shipping fee. Non-EU shipments include CN23 customs declarations.`
      ),
    },
    {
      num: '4',
      title: tx('روش‌های پرداخت امن و پیروی از مقررات بین‌المللی', 'Paiement sécurisé (Stripe CB, Alma, Virement SEPA) & Conformité', 'Secure Payments & International Compliance'),
      body: tx(
        'پرداخت آنلاین از طریق درگاه امن Stripe France (کارت‌های شبکه CB فرانسه، Visa، Mastercard، Apple Pay، Google Pay و پرداخت قسطی Alma در اروپا) و برای آثار کلکسیونی بالای ۲٬۵۰۰ یورو از طریق واریز بانکی SEPA با کارمزد ۰٪ انجام می‌شود. تأیید نهایی سفارش مستلزم کلیک روی دکمه قانونی «Commande avec obligation de paiement» است. به‌موجب مقررات بانکی اتحادیه اروپا، پردازش مالی بین‌المللی صرفاً برای کشورهای مجاز در لیست ارسال امکان‌پذیر است؛ مخاطبان داخل ایران برای کتاب‌های منتشرشده در ایران از پیوندهای ناشران داخلی بهره‌مند می‌شوند.',
        'Le règlement s’effectue par carte bancaire via Stripe France (réseau Cartes Bancaires CB, Visa, Mastercard, Apple Pay, Google Pay), en 2x/3x/4x avec Alma (selon éligibilité UE), ou par virement bancaire SEPA (recommandé sans frais pour les œuvres originales supérieures à 2 500 €). La validation finale entraîne obligation de paiement (art. L.221-14). Conformément aux règlements européens applicables, les paiements et livraisons ne sont disponibles que pour les pays autorisés.',
        'Payments are securely processed via Stripe France (Cartes Bancaires CB, Visa, Mastercard, Apple Pay, Google Pay, and Alma installments for eligible EU orders) or 0%-fee SEPA wire transfer (recommended for original artworks over €2,500). Final checkout confirmation constitutes a binding order with obligation to pay (Art. L.221-14).'
      ),
    },
    {
      num: '5',
      title: tx('ارسال، بیمه و مهلت قانونی تحویل', 'Livraison, assurance et délais', 'Shipping, Insurance & Delivery Deadlines'),
      body: tx(
        'آثار اصل با بسته‌بندی موزه‌ای بیمه‌شده، چاپ‌های شماره‌دار در لوله/بسته محافظ بدون اسید، و کتاب‌ها از پاریس ارسال می‌شوند. مهلت تحویل معمولاً ۵ تا ۱۴ روز کاری و در هر صورت حداکثر ظرف ۳۰ روز قانونی (ماده L.216-1) است. فایل‌های دیجیتال بلافاصله پس از تسویه از طریق لینک امن زمان‌دار در دسترس قرار می‌گیرند.',
        'Les œuvres originales voyagent en emballage muséal assuré, les tirages Fine Art en emballage rigide sans acide, et les livres depuis Paris. Sauf mention particulière, la livraison intervient sous 5 à 14 jours ouvrés et au plus tard dans le délai légal de 30 jours (art. L.216-1). Les éditions numériques sont accessibles immédiatement via un lien sécurisé temporaire.',
        'Original artworks ship from Paris in insured museum packaging, Fine Art prints in rigid acid-free mailers, and books via tracked post within 5–14 business days (and never later than the statutory 30-day deadline under Art. L.216-1). Digital books are delivered instantly via expiring secure download links.'
      ),
    },
    {
      num: '6',
      title: tx('حق انصراف ۱۴ روزه، دکمه آنلاین ۱۹ ژوئن ۲۰۲۶ و استثناهای قانونی', 'Droit de rétractation (14 jours), bouton en ligne & exceptions (Art. L.221-28)', '14-Day Right of Withdrawal, Online Button & Legal Exceptions'),
      body: tx(
        'خریدار مصرف‌کننده برای کالاهای فیزیکی استاندارد (کتاب، چاپ شماره‌دار، اثر اصل غیرسفارشی) از مهلت قانونی ۱۴ روز پس از تحویل جهت انصراف بدون دلیل برخوردار است و می‌تواند از دکمه اختصاصی «انصراف از خرید / Renoncer au contrat ici» در پایین تمام صفحات استفاده کند (مطابق فرمان ۲۰۲۶-۲ و مصوبه ۲۰۲۶-۳ فرانسه). مطابق ماده L.221-28، محتوای دیجیتال تحویل‌داده‌شده فوری (بند ۱۳° با رضایت صریح پیش از پرداخت) و آثار خوشنویسی سفارشی اختصاصی (بند ۳°) مشمول حق انصراف نیستند.',
        'Le consommateur dispose d’un délai légal de 14 jours à compter de la réception des biens physiques standards pour exercer son droit de rétractation sans motif, notamment via la fonctionnalité dédiée « Renoncer au contrat ici » accessible en permanence sur le site (art. L.221-21 et D.221-5 du Code de la consommation, décret n° 2026-3). Un accusé de réception horodaté est délivré sans délai. Conformément à l’article L.221-28, le droit de rétractation ne s’applique pas aux contenus numériques fournis immédiatement après accord exprès et renonciation préalable (13°), ni aux œuvres confectionnées sur mesure selon les spécifications du client (3°).',
        'Consumers have a statutory 14-day withdrawal period after receiving standard physical goods, exercisable via our permanent online "Withdraw from Contract / Renoncer au contrat ici" feature (French Decree No. 2026-3), with immediate timestamped confirmation. Under Art. L.221-28, immediate digital downloads consented to prior to checkout (13°) and custom bespoke calligraphy commissions (3°) are exempt from withdrawal.'
      ),
    },
    {
      num: '7',
      title: tx('ضمانت‌های قانونی، میانجی مصرف‌کننده و قانون حاکم', 'Garanties légales, Médiation & Droit applicable', 'Statutory Warranties, Mediation & Governing Law'),
      body: tx(
        `تمامی کالاهای فیزیکی مشمول ضمانت قانونی انطباق ۲ ساله (مواد L.217-3 به بعد) و ضمانت عیوب پنهان (ماده ۱۶۴۱ قانون مدنی فرانسه) هستند. در صورت بروز هرگونه اختلاف، خریدار می‌تواند به‌طور رایگان به میانجی مصرف‌کننده (${cfg.mediatorName}) مراجعه کند. این شرایط تابع قوانین کشور فرانسه است.`,
        `Les biens vendus bénéficient de la garantie légale de conformité de 2 ans (art. L.217-3 et s. du Code de la consommation) et de la garantie contre les vices cachés (art. 1641 du Code civil). En cas de litige non résolu amiablement, le consommateur peut saisir gratuitement ${cfg.mediatorName} (${cfg.mediatorAddress}). Les présentes CGV sont soumises au droit français.`,
        `Physical goods benefit from the 2-year French statutory warranty of conformity (Art. L.217-3) and the hidden defects warranty (Art. 1641 French Civil Code). Unresolved disputes may be referred free of charge to ${cfg.mediatorName}. Governed by French law.`
      ),
    },
  ];

  return (
    <article className="max-w-4xl mx-auto space-y-10">
      <nav aria-label={tx('راهنمای مسیر', 'Fil d’Ariane', 'Breadcrumb')} className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--foreground-muted)]">
        <Link href={`/${locale}/shop`} className="inline-flex items-center gap-1.5 font-bold hover:text-[var(--primary)]">
          {isFa ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          <span>{tx('بازگشت به گالری تملک آثار و فروشگاه', 'Retour à la Boutique & Éditions', 'Back to Shop & Editions')}</span>
        </Link>
        <Link
          href={`/${locale}/legal/retractation`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 text-white font-bold shadow-sm hover:bg-amber-700 transition-colors"
        >
          <RotateCcw size={13} />
          <span>{tx('انصراف از خرید (Renoncer au contrat ici)', 'Renoncer au contrat ici', 'Withdraw from Contract')}</span>
        </Link>
      </nav>

      <header className="space-y-4 border-b border-[var(--border-subtle)] pb-6">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-[var(--primary)] font-bold">
          <FileCheck2 size={16} />
          <span>{tx('شرایط قانونی فروش در فرانسه و اتحادیه اروپا (۲۰۲۶)', 'Code de la consommation • France & UE (2026)', 'French & EU E-Commerce Terms (2026)')}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight">
          {tx('شرایط عمومی فروش (CGV)', 'Conditions Générales de Vente (CGV)', 'General Terms of Sale (CGV)')}
        </h1>
        <p className="text-xs text-[var(--foreground-muted)] font-mono">
          {tx('نسخه لازم‌الاجرا:', 'Version en vigueur :', 'Effective version:')} {cfg.updatedAt.slice(0, 10)} • {cfg.tradeName}
        </p>
      </header>

      <div className="space-y-5">
        {clauses.map((c) => (
          <section key={c.num} className="p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-2.5">
            <h2 className="text-base sm:text-lg font-extrabold text-[var(--foreground)]">
              {tx(`ماده ${c.num} — `, `Article ${c.num} — `, `Article ${c.num} — `)}
              {c.title}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed">{c.body}</p>
          </section>
        ))}
      </div>

      <footer className="p-6 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--foreground)]">
          <ShieldCheck size={16} className="text-emerald-600" />
          <span>{cfg.mediatorName}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <DestinationLinkButton
            href={cfg.mediatorUrl}
            locale={locale}
            label={tx('درگاه میانجی مصرف‌کننده (CM2C)', 'Médiateur CM2C', 'CM2C Mediator Portal')}
            compact
          />
          <Link
            href={`/${locale}/legal/mentions-legales`}
            className="px-3 py-1.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs font-bold hover:border-[var(--primary)]"
          >
            {tx('اطلاعات حقوقی (Mentions légales)', 'Mentions légales', 'Legal Notices')}
          </Link>
        </div>
      </footer>
    </article>
  );
}
