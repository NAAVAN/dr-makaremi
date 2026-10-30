// infra/verify-phase-1.mjs
// Verification suite for Phase 1 endpoints, redirects, headers, and ISR webhook

const BASE_URL = 'http://127.0.0.1:3000';
const REVALIDATE_SECRET = 'makaremi_isr_secret_token_super_secure_2026';

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

async function runTests() {
  console.log('\n======================================================');
  console.log('RUNNING PHASE 1 END-TO-END VERIFICATION SUITE');
  console.log('======================================================\n');

  // Test 1: Canonical Domain Redirect (makaremi.net -> makaremi.com)
  console.log('[Test Suite 1: Domain Canonicalization]');
  try {
    const res = await fetch(`${BASE_URL}/home-persan/`, {
      headers: { Host: 'makaremi.net' },
      redirect: 'manual',
    });
    assert(res.status === 301, `Status is 301 Moved Permanently (actual: ${res.status})`);
    const location = res.headers.get('location');
    assert(location?.startsWith('https://makaremi.com'), `Redirect target is https://makaremi.com (actual: ${location})`);
  } catch (e) {
    assert(false, `Domain canonicalization error: ${e.message}`);
  }

  // Test 2: Legacy WordPress Permalinks Redirects
  console.log('\n[Test Suite 2: Legacy WordPress 301 Redirect Engine]');
  try {
    // 2.1 Psychoanalysis article
    const res1 = await fetch(`${BASE_URL}/aya-ravankavi-elm-ast-fa/`, { redirect: 'manual' });
    assert(res1.status === 301, `Status is 301 for /aya-ravankavi-elm-ast-fa/`);
    assert(
      res1.headers.get('location')?.includes('/fa/psychoanalysis/articles/is-psychoanalysis-a-science'),
      `Target matches canonical article route: ${res1.headers.get('location')}`
    );

    // 2.2 UTF-8 Encoded URL: Khavaran / 1988 Massacre
    const res2 = await fetch(`${BASE_URL}/%D8%A7neshast-paltaki-khavar-fa/`, { redirect: 'manual' });
    assert(res2.status === 301, `Status is 301 for encoded /%D8%A7neshast-paltaki-khavar-fa/`);
    assert(
      res2.headers.get('location')?.includes('/fa/human-rights/speeches/khavaran-justice-session'),
      `Target matches human rights route: ${res2.headers.get('location')}`
    );

    // 2.3 Art exhibition permalink
    const res3 = await fetch(`${BASE_URL}/nameyshgah-ir/fa-expo-8/`, { redirect: 'manual' });
    assert(res3.status === 301, `Status is 301 for /nameyshgah-ir/fa-expo-8/`);
    assert(
      res3.headers.get('location')?.includes('/fa/art/exhibitions/pompadour-2002-between-sign-and-symbol'),
      `Target matches Pompadour exhibition route: ${res3.headers.get('location')}`
    );
  } catch (e) {
    assert(false, `Legacy redirect error: ${e.message}`);
  }

  // Test 3: i18n Routing & Headers (RTL / LTR)
  console.log('\n[Test Suite 3: i18n Routing & RTL/LTR Direction Headers]');
  try {
    // 3.1 Default fallback to /fa
    const resRoot = await fetch(`${BASE_URL}/`, { redirect: 'manual' });
    assert(resRoot.status === 308, `Root / redirects with 308 to /fa (actual: ${resRoot.status})`);
    assert(resRoot.headers.get('location')?.endsWith('/fa'), `Redirect location ends with /fa`);

    // 3.2 Persian locale (fa)
    const resFa = await fetch(`${BASE_URL}/fa`);
    assert(resFa.status === 200, `/fa returns 200 OK`);
    assert(resFa.headers.get('x-content-direction') === 'rtl', `fa direction is rtl`);
    assert(resFa.headers.get('x-content-locale') === 'fa', `fa locale header is fa`);
    const faHtml = await resFa.text();
    assert(faHtml.includes('dir="rtl"'), `HTML tag contains dir="rtl"`);
    assert(faHtml.includes('lang="fa"'), `HTML tag contains lang="fa"`);
    assert(faHtml.includes('دکتر حسن مکارمی'), `Contains Dr. Makaremi Persian title`);

    // 3.3 French locale (fr)
    const resFr = await fetch(`${BASE_URL}/fr`);
    assert(resFr.status === 200, `/fr returns 200 OK`);
    assert(resFr.headers.get('x-content-direction') === 'ltr', `fr direction is ltr`);
    const frHtml = await resFr.text();
    assert(frHtml.includes('dir="ltr"'), `HTML tag contains dir="ltr"`);
    assert(frHtml.includes('lang="fr"'), `HTML tag contains lang="fr"`);
  } catch (e) {
    assert(false, `i18n test error: ${e.message}`);
  }

  // Test 4: AEO / GEO Routes (/llms.txt, robots.txt, sitemap.xml)
  console.log('\n[Test Suite 4: AEO / GEO Endpoints]');
  try {
    const resLlms = await fetch(`${BASE_URL}/llms.txt`);
    assert(resLlms.status === 200, `/llms.txt returns 200 OK`);
    const llmsText = await resLlms.text();
    assert(llmsText.includes('Dr. Hassan Makaremi'), `/llms.txt contains official biography`);
    assert(resLlms.headers.get('content-type')?.includes('text/plain'), `Content-Type is text/plain`);

    const resRobots = await fetch(`${BASE_URL}/robots.txt`);
    assert(resRobots.status === 200, `/robots.txt returns 200 OK`);

    const resSitemap = await fetch(`${BASE_URL}/sitemap.xml`);
    assert(resSitemap.status === 200, `/sitemap.xml returns 200 OK`);
  } catch (e) {
    assert(false, `AEO error: ${e.message}`);
  }

  // Test 5: On-Demand ISR Revalidation Webhook
  console.log('\n[Test Suite 5: On-Demand ISR Revalidation Endpoint]');
  try {
    // 5.1 Unauthorized without secret
    const resUnauth = await fetch(`${BASE_URL}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: '/fa' }),
    });
    assert(resUnauth.status === 401, `POST /api/revalidate without secret returns 401 Unauthorized`);

    // 5.2 Authorized with valid secret
    const resAuth = await fetch(`${BASE_URL}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': REVALIDATE_SECRET,
      },
      body: JSON.stringify({ path: '/fa' }),
    });
    assert(resAuth.status === 200, `POST /api/revalidate with valid secret returns 200 OK`);
    const jsonAuth = await resAuth.json();
    assert(jsonAuth.revalidated === true, `Response body confirms revalidated: true`);
    assert(jsonAuth.target === '/fa', `Response confirms target path is /fa`);
  } catch (e) {
    assert(false, `ISR Webhook error: ${e.message}`);
  }

  // Test 6: Cloudflare Security Audit Hardening
  console.log('\n[Test Suite 6: Cloudflare Security Audit Hardening]');
  try {
    // 6.1 Security Headers Verification
    const resHeaders = await fetch(`${BASE_URL}/fa`);
    const csp = resHeaders.headers.get('content-security-policy') || '';
    assert(csp.includes("default-src 'self'"), `CSP contains default-src 'self'`);
    assert(csp.includes("frame-ancestors 'self'"), `CSP restricts frame-ancestors`);
    assert(resHeaders.headers.get('x-content-type-options') === 'nosniff', `X-Content-Type-Options is nosniff`);
    assert(resHeaders.headers.get('x-frame-options') === 'SAMEORIGIN', `X-Frame-Options is SAMEORIGIN`);
    assert(resHeaders.headers.get('x-permitted-cross-domain-policies') === 'none', `X-Permitted-Cross-Domain-Policies is none`);
    assert(resHeaders.headers.get('cross-origin-opener-policy') === 'same-origin', `Cross-Origin-Opener-Policy is same-origin`);

    // 6.2 Host Header Poisoning Immunity
    const resEvilHost = await fetch(`${BASE_URL}/fa`, {
      headers: { Host: 'evil-makaremi.net' },
      redirect: 'manual',
    });
    // Should NOT be redirected to https://makaremi.com because host is forged
    const evilLocation = resEvilHost.headers.get('location') || '';
    assert(!evilLocation.startsWith('https://makaremi.com'), `Forged Host 'evil-makaremi.net' is rejected from canonical redirect`);

    // 6.3 Open Redirect Sanitization
    const resDoubleSlash = await fetch(`${BASE_URL}//attacker.com`, {
      redirect: 'manual',
    });
    const dsLocation = resDoubleSlash.headers.get('location') || '';
    assert(!dsLocation.startsWith('//attacker.com'), `Double slash protocol-relative redirect blocked (actual: ${dsLocation})`);

    // 6.4 Revalidate Webhook: Malformed JSON and Boundary Validation
    const resMalformed = await fetch(`${BASE_URL}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': REVALIDATE_SECRET,
      },
      body: JSON.stringify({ path: 'invalid-path-without-slash' }),
    });
    assert(resMalformed.status === 400, `POST /api/revalidate with invalid path format returns 400 Bad Request`);

    const resEmpty = await fetch(`${BASE_URL}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': REVALIDATE_SECRET,
      },
      body: JSON.stringify({}),
    });
    assert(resEmpty.status === 400, `POST /api/revalidate with empty payload returns 400 Bad Request`);
  } catch (e) {
    assert(false, `Security suite error: ${e.message}`);
  }

  console.log('\n======================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
