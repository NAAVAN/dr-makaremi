// infra/verify-phase-2.mjs
// Phase 2 Comprehensive End-to-End Verification Suite: UI/UX, Routes, Single-H1, .md Twins & Cloudflare Security Audit

const BASE_URL = 'http://127.0.0.1:3000';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

function countH1Tags(html) {
  const matches = html.match(/<\s*h1\b[^>]*>/gi);
  return matches ? matches.length : 0;
}

async function runTests() {
  console.log('\n======================================================');
  console.log('RUNNING PHASE 2 END-TO-END VERIFICATION SUITE');
  console.log('======================================================\n');

  // Test Suite 1: Route Resolution for 100% Phase 1 Target Permalinks & Localized Slugs
  console.log('[Test Suite 1: Route Resolution for 100% Target Routes]');
  const routesToTest = [
    { url: '/fa/books', name: 'Books Catalog (FA)' },
    { url: '/fa/books/lacan-seminar-3-psychoses', name: 'Lacan Seminar III Book Detail' },
    { url: '/fa/books/strategic-look-at-transition', name: 'Strategic Look at Transition Book Detail' },
    { url: '/fa/gallery', name: 'IIIF Museum Gallery Overview' },
    { url: '/fa/art/exhibitions/pompadour-2002-between-sign-and-symbol', name: 'Pompadour 2002 Exhibition Hall' },
    { url: '/fa/poetry', name: 'Poetry Overview' },
    { url: '/fa/poetry/poems/caress-me', name: 'Caress Me Poem Detail' },
    { url: '/fa/psychoanalysis/articles/is-psychoanalysis-a-science', name: 'Is Psychoanalysis a Science (FA)' },
    { url: '/fr/psychanalyse/articles/etat-limite-concept-psychanalytique', name: 'État Limite Article (FR)' },
    { url: '/fr/psychanalyse/articles/topologie-des-lieux-saints', name: 'Topologie des lieux saints (FR)' },
    { url: '/fr/psychanalyse/articles/relation-cavalier-cheval', name: 'Relation cavalier cheval (FR)' },
    { url: '/fa/human-rights/speeches/khavaran-justice-session', name: 'Khavaran Justice Speech' },
    { url: '/fr/media/videos/hafez-de-chiraz', name: 'Hafez de Chiraz Video Speech (FR)' },
  ];

  for (const item of routesToTest) {
    try {
      const res = await fetch(`${BASE_URL}${item.url}`);
      assert(res.status === 200, `${item.name} (${item.url}) returns 200 OK (actual: ${res.status})`);
    } catch (e) {
      assert(false, `${item.name} failed with network error: ${e.message}`);
    }
  }

  // Test Suite 2: Strict Single-H1 Semantic Hierarchy Compliance
  console.log('\n[Test Suite 2: Strict Single-H1 Semantic Compliance]');
  for (const item of routesToTest) {
    try {
      const res = await fetch(`${BASE_URL}${item.url}`);
      const html = await res.text();
      const h1Count = countH1Tags(html);
      assert(h1Count === 1, `${item.name} has exactly ONE <h1> tag (actual: ${h1Count})`);
    } catch (e) {
      assert(false, `Failed checking H1 on ${item.name}: ${e.message}`);
    }
  }

  // Test Suite 3: Exact .md Twin URL Resolution (AEO / GEO Engine)
  console.log('\n[Test Suite 3: .md Twin Rewrite & Markdown Content Negotiation]');
  try {
    // 3.1 Article Markdown Twin
    const resArtMd = await fetch(`${BASE_URL}/fa/psychoanalysis/articles/is-psychoanalysis-a-science.md`);
    assert(resArtMd.status === 200, `/is-psychoanalysis-a-science.md returns 200 OK`);
    assert(
      resArtMd.headers.get('content-type')?.includes('text/markdown'),
      `Content-Type is text/markdown`
    );
    const mdText = await resArtMd.text();
    assert(mdText.includes('# آیا روانکاوی علم است؟'), `Contains article H1 markdown title`);
    assert(mdText.includes('CNRS'), `Contains CNRS empirical survey text`);
    assert(/[0-9a-f]{64}/.test(mdText) && mdText.includes('SHA-256 Digital Fingerprint'), `Contains SHA-256 fingerprint`);

    // 3.2 Book Markdown Twin
    const resBookMd = await fetch(`${BASE_URL}/fa/books/lacan-seminar-3-psychoses.md`);
    assert(resBookMd.status === 200, `/lacan-seminar-3-psychoses.md returns 200 OK`);
    const bookMdText = await resBookMd.text();
    assert(bookMdText.includes('سمینار سوم ژاک لکان'), `Contains book title in markdown`);
    assert(bookMdText.includes('Table of Contents'), `Contains Table of Contents section`);
  } catch (e) {
    assert(false, `Markdown Twin test error: ${e.message}`);
  }

  // Test Suite 4: Lacanian Glossary Popover, 3D Showcase & SHA-256 Badges
  console.log('\n[Test Suite 4: Interactive Lacanian Glossary, 3D Showcase & Digital Signatures]');
  try {
    // 4.1 Article page contains glossary trigger and content integrity
    const resArticle = await fetch(`${BASE_URL}/fa/psychoanalysis/articles/is-psychoanalysis-a-science`);
    const artHtml = await resArticle.text();
    assert(artHtml.includes('دگرشنیدن'), `Article text renders Lacanian glossary term «دگرشنیدن»`);
    assert(artHtml.includes('عملیات نام پدر'), `Article text renders Lacanian glossary term «عملیات نام پدر»`);
    assert(artHtml.includes('امضای دیجیتال تغییرناپذیر'), `Digital signature badge is present`);
    assert(/امضای دیجیتال تغییرناپذیر/.test(artHtml) && /[0-9a-f]{10}/.test(artHtml), `SHA-256 fingerprint displayed`);

    // 4.2 Book 3D Showcase & Citation Card
    const resBook = await fetch(`${BASE_URL}/fa/books/lacan-seminar-3-psychoses`);
    const bookHtml = await resBook.text();
    assert(bookHtml.includes('preserve-3d'), `3D book showcase container uses preserve-3d`);
    assert(bookHtml.includes('شناسنامه کتابشناختی و ارجاع علمی'), `Bibliographic metadata passport is present`);
    assert(bookHtml.includes('BibTeX'), `BibTeX copy citation button is available`);
    assert(bookHtml.includes('طاقچه'), `Iran purchase platform link is present`);

    // 4.3 Exhibition IIIF Viewer
    const resExpo = await fetch(`${BASE_URL}/fa/art/exhibitions/pompadour-2002-between-sign-and-symbol`);
    const expoHtml = await resExpo.text();
    assert(expoHtml.includes('openseadragon-'), `Contains OpenSeadragon IIIF viewer id`);
    assert(expoHtml.includes('MUSEUM CANVAS FALLBACK'), `Interactive high-res canvas fallback is armed`);
  } catch (e) {
    assert(false, `Interactive component test error: ${e.message}`);
  }

  // Test Suite 5: Cloudflare Security Audit Gate (cloudflare/security-audit-skill)
  console.log('\n[Test Suite 5: Cloudflare Security Audit Gate]');
  try {
    // 5.1 CSP Header Audit: Verify frame-src and media-src permissions
    const resCsp = await fetch(`${BASE_URL}/fa`);
    const csp = resCsp.headers.get('content-security-policy') || '';
    assert(csp.includes("frame-src 'self' https://www.youtube-nocookie.com"), `CSP contains frame-src https://www.youtube-nocookie.com`);
    assert(csp.includes("media-src 'self' blob: data:"), `CSP contains media-src 'self' blob: data:`);
    assert(csp.includes("object-src 'none'"), `CSP enforces object-src 'none'`);

    // 5.2 Path Traversal & Injection in /api/markdown
    const resTraversal = await fetch(`${BASE_URL}/api/markdown?path=/../etc/passwd`);
    assert(resTraversal.status === 400, `/api/markdown with path traversal (/../) rejected with 400 Bad Request`);

    const resInvalidFormat = await fetch(`${BASE_URL}/api/markdown?path=invalid-no-leading-slash`);
    assert(resInvalidFormat.status === 400, `/api/markdown with invalid format rejected with 400 Bad Request`);

    // 5.3 Safe Markdown Rendering & XSS Immunity
    // Verify that rendered HTML on articles has no raw <script> injection
    const resXss = await fetch(`${BASE_URL}/fa/psychoanalysis/articles/is-psychoanalysis-a-science`);
    const bodyHtml = await resXss.text();
    assert(!bodyHtml.includes('<script>alert'), `No unescaped script injection in article content`);
    assert(bodyHtml.includes('rel="noopener noreferrer"'), `External links enforce rel="noopener noreferrer"`);
  } catch (e) {
    assert(false, `Security audit gate error: ${e.message}`);
  }

  console.log('\n======================================================');
  console.log(`PHASE 2 VERIFICATION SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
