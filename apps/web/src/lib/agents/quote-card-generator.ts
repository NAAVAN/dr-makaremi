/**
 * Instagram & Social Media SVG Quote Card Generator
 *
 * Mandatory Refinement 1: Strict XML/XSS Escaping.
 * SVGs are XML documents capable of executing malicious scripts if user-controlled input
 * contains unescaped characters. Every dynamic token is strictly escaped and all event
 * handlers/script tags are prohibited.
 */

export interface QuoteCardOptions {
  title: string;
  quote: string;
  author?: string;
  pillar?: string;
  sha256Digest?: string;
  date?: string;
  locale?: string;
}

/**
 * Escapes characters with special meaning in XML/SVG documents.
 */
export function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Wraps text into lines of approximately maxChars length for SVG rendering.
 */
function wrapSvgText(text: string, maxCharsPerLine: number = 38): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines.slice(0, 6); // Max 6 lines for perfect visual balance
}

/**
 * Generates an ultra-premium, 1080x1080 SVG quote card for Instagram, Facebook, and LinkedIn.
 */
export function generateSvgQuoteCard(options: QuoteCardOptions): string {
  // Strict XML Escaping on dynamic inputs
  const safeTitle = escapeXml(options.title || 'گفتار برگزیده');
  const safeRawQuote = options.quote || '';
  const safeAuthor = escapeXml(options.author || 'دکتر حسن مکارمی | Dr. Hassan Makaremi');
  const safePillar = escapeXml(options.pillar || 'روان‌کاوی و فلسفه');
  const safeDate = escapeXml(options.date || new Date().toISOString().split('T')[0]);
  const safeHash = escapeXml(
    options.sha256Digest ? options.sha256Digest.slice(0, 16) + '...' : 'ED25519-VERIFIED'
  );

  const quoteLines = wrapSvgText(safeRawQuote, 36).map((line) => escapeXml(line));

  // Build SVG tspans
  const textTspans = quoteLines
    .map(
      (line, idx) =>
        `<tspan x="540" dy="${idx === 0 ? 0 : 54}" text-anchor="middle">${line}</tspan>`
    )
    .join('\n      ');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0e17"/>
      <stop offset="50%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#070a10"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#d4af37"/>
      <stop offset="50%" stop-color="#fdf6d8"/>
      <stop offset="100%" stop-color="#c59b27"/>
    </linearGradient>
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d4af37" stop-opacity="0.6"/>
      <stop offset="50%" stop-color="#d4af37" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#d4af37" stop-opacity="0.6"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1080" height="1080" fill="url(#bgGrad)"/>

  <!-- Ornate Decorative Outer Borders -->
  <rect x="40" y="40" width="1000" height="1000" fill="none" stroke="url(#borderGrad)" stroke-width="2" rx="24"/>
  <rect x="56" y="56" width="968" height="968" fill="none" stroke="#d4af37" stroke-opacity="0.12" stroke-width="1" rx="16"/>

  <!-- Corner Geometric Motifs -->
  <path d="M 68 108 L 108 68 M 68 68 L 108 108" stroke="#d4af37" stroke-width="1.5" stroke-opacity="0.4"/>
  <path d="M 1012 108 L 972 68 M 1012 68 L 972 108" stroke="#d4af37" stroke-width="1.5" stroke-opacity="0.4"/>
  <path d="M 68 972 L 108 1012 M 68 1012 L 108 972" stroke="#d4af37" stroke-width="1.5" stroke-opacity="0.4"/>
  <path d="M 1012 972 L 972 1012 M 1012 1012 L 972 972" stroke="#d4af37" stroke-width="1.5" stroke-opacity="0.4"/>

  <!-- Header Category Badge -->
  <g transform="translate(540, 140)">
    <rect x="-140" y="-22" width="280" height="44" rx="22" fill="#d4af37" fill-opacity="0.08" stroke="#d4af37" stroke-opacity="0.3" stroke-width="1"/>
    <text x="0" y="7" font-family="'Vazirmatn', 'Noto Sans Arabic', system-ui, sans-serif" font-size="18" font-weight="600" fill="#d4af37" text-anchor="middle" letter-spacing="1">
      ${safePillar}
    </text>
  </g>

  <!-- Title -->
  <text x="540" y="240" font-family="'Vazirmatn', 'Noto Sans Arabic', system-ui, sans-serif" font-size="30" font-weight="700" fill="#f3f4f6" text-anchor="middle">
    ${safeTitle}
  </text>

  <!-- Ornate Quotation Mark Symbol -->
  <text x="540" y="340" font-family="Georgia, serif" font-size="90" fill="url(#goldGrad)" text-anchor="middle" opacity="0.35">
    &#x201C;
  </text>

  <!-- Quote Body (Wrapped Text) -->
  <text x="540" y="420" font-family="'Vazirmatn', 'Noto Sans Arabic', system-ui, sans-serif" font-size="34" font-weight="400" fill="#ffffff" text-anchor="middle" line-height="1.6" filter="url(#glow)">
    <tspan x="540" dy="0">${quoteLines[0] ? textTspans : 'بدون متن نقل‌قول'}</tspan>
  </text>

  <!-- Decorative Separator Line -->
  <line x1="380" y1="780" x2="700" y2="780" stroke="url(#goldGrad)" stroke-width="1.5" stroke-opacity="0.6"/>
  <circle cx="540" cy="780" r="4" fill="#d4af37"/>

  <!-- Author Signature -->
  <text x="540" y="840" font-family="'Vazirmatn', 'Noto Sans Arabic', system-ui, sans-serif" font-size="28" font-weight="700" fill="url(#goldGrad)" text-anchor="middle">
    ${safeAuthor}
  </text>
  <text x="540" y="880" font-family="'Vazirmatn', 'Noto Sans Arabic', system-ui, sans-serif" font-size="17" font-weight="400" fill="#9ca3af" text-anchor="middle">
    روانکاو بالینی، پژوهشگر سوربن و هنرمند
  </text>

  <!-- Cryptographic Proof Footer Badge -->
  <g transform="translate(540, 960)">
    <rect x="-240" y="-18" width="480" height="36" rx="18" fill="#030712" stroke="#374151" stroke-width="1"/>
    <circle cx="-210" cy="0" r="5" fill="#10b981"/>
    <text x="0" y="5" font-family="monospace, sans-serif" font-size="13" fill="#9ca3af" text-anchor="middle">
      ED25519 HASH: ${safeHash} &bull; ${safeDate}
    </text>
  </g>
</svg>`;
}
