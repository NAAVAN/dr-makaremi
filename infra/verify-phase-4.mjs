/**
 * Phase 4 Verification Suite: MAKAREMI-CORE-2026
 *
 * Verifies:
 * 1. JSON-LD Semantic Knowledge Graph (@graph, Person credentials, WebSite, Book workTranslation, ScholarlyArticle SHA-256, DefinedTermSet)
 * 2. Academic Metadata (HighWire Press citation_* & Dublin Core DC.* with CRLF immunity)
 * 3. AEO / GEO Markdown Twins (<link rel="alternate" type="text/markdown"> & /[locale]/glossary.md)
 * 4. Strict Single-<h1> Architecture on Glossary & Article pages
 * 5. AEO Key Takeaways Box with CNRS Empirical Data (3,954 research projects)
 * 6. Dynamic /llms.txt & /llms-full.txt (Backward-compatible with Phase 1 assertions)
 * 7. /api/knowledge-graph REST Endpoint (Zod validation, rate limiting, and safe JSON-LD)
 * 8. SEO Discovery (/sitemap.xml dynamic routes with hreflang & /robots.txt AI crawler rules)
 * 9. Cloudflare Security Audit Gate (serializeSafeJsonLd breakout immunity & CRLF stripping)
 */

import { serializeSafeJsonLd } from '../apps/web/src/lib/schema-org.ts';
import { sanitizeMetaString } from '../apps/web/src/lib/academic-metadata.ts';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runPhase4Verification() {
  console.log('================================================================');
  console.log('   MAKAREMI-CORE-2026: PHASE 4 AUTOMATED VERIFICATION SUITE   ');
  console.log('================================================================');
  console.log(`Target Base URL: ${BASE_URL}\n`);

  // ---------------------------------------------------------------------------
  // Suite 1: JSON-LD Semantic Knowledge Graph
  // ---------------------------------------------------------------------------
  console.log('[Test Suite 1: JSON-LD Semantic Knowledge Graph (@graph)]');
  try {
    // 1.1 Root Layout Person & WebSite
    const resHome = await fetch(`${BASE_URL}/fa`);
    assert(resHome.status === 200, `GET /fa returns 200 OK`);
    const htmlHome = await resHome.text();
    
    // Extract JSON-LD scripts
    const jsonLdRegex = /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
    const jsonLdMatches = [...htmlHome.matchAll(jsonLdRegex)];
    assert(jsonLdMatches.length >= 1, `Rendered HTML contains at least one <script type="application/ld+json">`);

    let foundPerson = false;
    let foundWebSite = false;
    for (const match of jsonLdMatches) {
      try {
        const parsed = JSON.parse(match[1]);
        const graph = parsed['@graph'] || [parsed];
        for (const node of graph) {
          if (node['@type'] === 'Person' && node['@id'] === 'https://makaremi.com/#hassan-makaremi') {
            foundPerson = true;
            assert(node.name === 'Hassan Makaremi', `Person node name is "Hassan Makaremi"`);
            assert(node.birthDate === '1950', `Person node birthDate is 1950`);
            assert(Array.isArray(node.alumniOf) && node.alumniOf.length >= 3, `Person node contains alumniOf credentials (Sorbonne, École Centrale, etc.)`);
            assert(Array.isArray(node.memberOf) && node.memberOf.some(m => m.name.includes('LDDHI')), `Person node contains memberOf LDDHI/FIDH`);
            assert(Array.isArray(node.hasOccupation) && node.hasOccupation.length >= 3, `Person node contains hasOccupation (Psychoanalyst, Researcher, Calligrapher)`);
          }
          if (node['@type'] === 'WebSite' && node['@id'] === 'https://makaremi.com/#website') {
            foundWebSite = true;
            assert(node.inLanguage.includes('fa'), `WebSite node indicates multilingual support`);
          }
        }
      } catch (err) {
        // Continue checking other tags
      }
    }
    assert(foundPerson, `Found valid Schema.org Person node with @id https://makaremi.com/#hassan-makaremi`);
    assert(foundWebSite, `Found valid Schema.org WebSite node with @id https://makaremi.com/#website`);

    // 1.2 Article Detail ScholarlyArticle Node
    const resArticle = await fetch(`${BASE_URL}/fa/psychoanalysis/articles/is-psychoanalysis-a-science`);
    assert(resArticle.status === 200, `GET article returns 200 OK`);
    const htmlArticle = await resArticle.text();
    const articleJsonMatches = [...htmlArticle.matchAll(jsonLdRegex)];
    let foundArticleNode = false;
    for (const match of articleJsonMatches) {
      try {
        const parsed = JSON.parse(match[1]);
        const graph = parsed['@graph'] || [parsed];
        for (const node of graph) {
          if (node['@type'] === 'ScholarlyArticle') {
            foundArticleNode = true;
            assert(node.author?.['@id'] === 'https://makaremi.com/#hassan-makaremi', `ScholarlyArticle author links to #hassan-makaremi`);
            assert(node.identifier?.propertyID === 'SHA-256', `ScholarlyArticle includes cryptographic SHA-256 identifier`);
          }
        }
      } catch (e) {}
    }
    assert(foundArticleNode, `Found valid ScholarlyArticle node on article page`);

    // 1.3 Book Detail Node with workTranslation for Seminar III
    const resBook = await fetch(`${BASE_URL}/fa/books/lacan-seminar-3-psychoses`);
    assert(resBook.status === 200, `GET book returns 200 OK`);
    const htmlBook = await resBook.text();
    const bookJsonMatches = [...htmlBook.matchAll(jsonLdRegex)];
    let foundBookTranslation = false;
    for (const match of bookJsonMatches) {
      try {
        const parsed = JSON.parse(match[1]);
        const graph = parsed['@graph'] || [parsed];
        for (const node of graph) {
          if (node['@type'] === 'Book' && node.workTranslation) {
            foundBookTranslation = true;
            assert(node.workTranslation.name.includes('Les Psychoses'), `Book workTranslation name includes "Les Psychoses"`);
            assert(node.workTranslation.author.name === 'Jacques Lacan', `Book workTranslation author is Jacques Lacan`);
            assert(node.translator?.['@id'] === 'https://makaremi.com/#hassan-makaremi', `Book translator links to #hassan-makaremi`);
          }
        }
      } catch (e) {}
    }
    assert(foundBookTranslation, `Found Book node with Jacques Lacan workTranslation metadata`);

    // 1.4 DefinedTermSet on Glossary Page
    const resGlossary = await fetch(`${BASE_URL}/fa/glossary`);
    assert(resGlossary.status === 200, `GET /fa/glossary returns 200 OK`);
    const htmlGlossary = await resGlossary.text();
    const glossaryJsonMatches = [...htmlGlossary.matchAll(jsonLdRegex)];
    let foundDefinedTermSet = false;
    for (const match of glossaryJsonMatches) {
      try {
        const parsed = JSON.parse(match[1]);
        const graph = parsed['@graph'] || [parsed];
        for (const node of graph) {
          if (node['@type'] === 'DefinedTermSet') {
            foundDefinedTermSet = true;
            assert(Array.isArray(node.hasDefinedTerm), `DefinedTermSet has defined terms array`);
            assert(node.hasDefinedTerm.length >= 5, `DefinedTermSet contains at least 5 concepts (found ${node.hasDefinedTerm.length})`);
            const listeningDiff = node.hasDefinedTerm.find(t => t.termCode === 'ecouter-autrement');
            assert(!!listeningDiff, `DefinedTermSet includes "ecouter-autrement"`);
            if (listeningDiff) {
              assert(listeningDiff.alternateName.length >= 2, `"ecouter-autrement" includes multilingual alternate names`);
            }
          }
        }
      } catch (e) {}
    }
    assert(foundDefinedTermSet, `Found valid DefinedTermSet node on /fa/glossary`);
  } catch (err) {
    assert(false, `Suite 1 error: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // Suite 2: Academic Citation Metadata (HighWire Press & Dublin Core)
  // ---------------------------------------------------------------------------
  console.log('\n[Test Suite 2: Academic Metadata (Google Scholar & Dublin Core)]');
  try {
    const resArticle = await fetch(`${BASE_URL}/fa/psychoanalysis/articles/is-psychoanalysis-a-science`);
    const htmlArticle = await resArticle.text();

    assert(htmlArticle.includes('name="citation_title"'), `Includes HighWire Press citation_title tag`);
    assert(htmlArticle.includes('content="Makaremi, Hassan"'), `Includes citation_author "Makaremi, Hassan"`);
    assert(htmlArticle.includes('name="citation_publication_date"'), `Includes citation_publication_date tag`);
    assert(htmlArticle.includes('name="citation_markdown_url"'), `Includes citation_markdown_url tag pointing to .md twin`);
    assert(htmlArticle.includes('name="DC.title"'), `Includes Dublin Core DC.title tag`);
    assert(htmlArticle.includes('name="DC.creator" content="Dr. Hassan Makaremi"'), `Includes DC.creator tag`);
    assert(htmlArticle.includes('name="DC.identifier"'), `Includes DC.identifier tag`);

    // Verify absence of unescaped CRLF control characters in meta tags
    const metaTags = htmlArticle.match(/<meta\s+[^>]*name="(?:citation_|DC\.)[^>]*>/gi) || [];
    let hasCrlfInMeta = false;
    for (const tag of metaTags) {
      if (tag.includes('\r') || tag.includes('\n')) {
        hasCrlfInMeta = true;
      }
    }
    assert(!hasCrlfInMeta, `All HighWire & Dublin Core meta tags are sanitized against CRLF injection`);
  } catch (err) {
    assert(false, `Suite 2 error: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // Suite 3: AEO / GEO Markdown Twins & Discovery
  // ---------------------------------------------------------------------------
  console.log('\n[Test Suite 3: AEO & GEO Markdown Twins]');
  try {
    // 3.1 Check <link rel="alternate" type="text/markdown"> on article page
    const resArticle = await fetch(`${BASE_URL}/fa/psychoanalysis/articles/is-psychoanalysis-a-science`);
    const htmlArticle = await resArticle.text();
    assert(
      htmlArticle.includes('rel="alternate"') && htmlArticle.includes('type="text/markdown"'),
      `Article HTML includes <link rel="alternate" type="text/markdown">`
    );

    // 3.2 Check <link rel="alternate" type="text/markdown"> on glossary page
    const resGlossary = await fetch(`${BASE_URL}/fa/glossary`);
    const htmlGlossary = await resGlossary.text();
    assert(
      htmlGlossary.includes('rel="alternate"') && htmlGlossary.includes('type="text/markdown"'),
      `Glossary HTML includes <link rel="alternate" type="text/markdown">`
    );

    // 3.3 Fetch /fa/glossary.md
    const resGlossaryMd = await fetch(`${BASE_URL}/fa/glossary.md`);
    assert(resGlossaryMd.status === 200, `GET /fa/glossary.md returns 200 OK`);
    assert(resGlossaryMd.headers.get('content-type')?.includes('text/markdown'), `/fa/glossary.md Content-Type is text/markdown`);
    const mdGlossaryText = await resGlossaryMd.text();
    assert(mdGlossaryText.includes('Lacanian & Strategic Controlled Vocabulary'), `/fa/glossary.md contains title header`);
    assert(mdGlossaryText.includes('دگرشنیدن'), `/fa/glossary.md contains Persian concept "دگرشنیدن"`);
    assert(mdGlossaryText.includes('Écouter autrement'), `/fa/glossary.md contains French equivalent`);

    // 3.4 Fetch /fr/glossary.md
    const resGlossaryFrMd = await fetch(`${BASE_URL}/fr/glossary.md`);
    assert(resGlossaryFrMd.status === 200, `GET /fr/glossary.md returns 200 OK`);
  } catch (err) {
    assert(false, `Suite 3 error: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // Suite 4: Strict Single-<h1> Architecture
  // ---------------------------------------------------------------------------
  console.log('\n[Test Suite 4: Strict Single-<h1> Rule Architecture]');
  try {
    // 4.1 Article Page
    const resArticle = await fetch(`${BASE_URL}/fa/psychoanalysis/articles/is-psychoanalysis-a-science`);
    const htmlArticle = await resArticle.text();
    const h1ArticleMatches = htmlArticle.match(/<h1[\s>]/gi) || [];
    assert(h1ArticleMatches.length === 1, `Article page contains EXACTLY ONE <h1> tag (found ${h1ArticleMatches.length})`);

    // 4.2 Glossary Page
    const resGlossary = await fetch(`${BASE_URL}/fa/glossary`);
    const htmlGlossary = await resGlossary.text();
    const h1GlossaryMatches = htmlGlossary.match(/<h1[\s>]/gi) || [];
    assert(h1GlossaryMatches.length === 1, `Glossary page contains EXACTLY ONE <h1> tag (found ${h1GlossaryMatches.length})`);

    // 4.3 Book Page
    const resBook = await fetch(`${BASE_URL}/fa/books/lacan-seminar-3-psychoses`);
    const htmlBook = await resBook.text();
    const h1BookMatches = htmlBook.match(/<h1[\s>]/gi) || [];
    assert(h1BookMatches.length === 1, `Book page contains EXACTLY ONE <h1> tag (found ${h1BookMatches.length})`);
  } catch (err) {
    assert(false, `Suite 4 error: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // Suite 5: AEO Key Takeaways Box & CNRS Empirical Data
  // ---------------------------------------------------------------------------
  console.log('\n[Test Suite 5: AEO Key Takeaways Box & CNRS Data]');
  try {
    const resArticle = await fetch(`${BASE_URL}/fa/psychoanalysis/articles/is-psychoanalysis-a-science`);
    const htmlArticle = await resArticle.text();

    assert(htmlArticle.includes('data-aeo-block="key-takeaways"'), `Contains data-aeo-block="key-takeaways" attribute`);
    assert(htmlArticle.includes('<h2'), `Key Takeaways uses <h2> heading (preserving single-<h1>)`);
    assert(
      htmlArticle.includes('3 954') || htmlArticle.includes('۳٬۹۵۴'),
      `Contains CNRS empirical survey data on 3,954 research projects`
    );
    assert(
      htmlArticle.includes('۳٬۷۵۵') || htmlArticle.includes('3 755') || htmlArticle.includes('95%'),
      `Contains interdisciplinary projects statistics (95%)`
    );
  } catch (err) {
    assert(false, `Suite 5 error: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // Suite 6: Dynamic /llms.txt & /llms-full.txt
  // ---------------------------------------------------------------------------
  console.log('\n[Test Suite 6: Dynamic /llms.txt and /llms-full.txt]');
  try {
    // 6.1 /llms.txt
    const resLlms = await fetch(`${BASE_URL}/llms.txt`);
    assert(resLlms.status === 200, `GET /llms.txt returns 200 OK`);
    assert(resLlms.headers.get('content-type')?.includes('text/plain'), `/llms.txt Content-Type is text/plain`);
    const llmsText = await resLlms.text();
    assert(llmsText.includes('Dr. Hassan Makaremi'), `/llms.txt contains official biography string (Phase 1 backward compat)`);
    assert(llmsText.includes('is-psychoanalysis-a-science.md'), `/llms.txt dynamically lists psychoanalysis article`);
    assert(llmsText.includes('lacan-seminar-3-psychoses.md'), `/llms.txt dynamically lists Seminar III book`);
    assert(llmsText.includes('/fa/glossary.md'), `/llms.txt links to Lacanian Glossary`);

    // 6.2 /llms-full.txt
    const resLlmsFull = await fetch(`${BASE_URL}/llms-full.txt`);
    assert(resLlmsFull.status === 200, `GET /llms-full.txt returns 200 OK`);
    assert(resLlmsFull.headers.get('content-type')?.includes('text/plain'), `/llms-full.txt Content-Type is text/plain`);
    const fullText = await resLlmsFull.text();
    assert(fullText.includes('SECTION 1: BIOGRAPHY & ACADEMIC CREDENTIALS'), `/llms-full.txt contains Section 1`);
    assert(fullText.includes('SECTION 2: LACANIAN & STRATEGIC CONTROLLED VOCABULARY'), `/llms-full.txt contains Section 2`);
    assert(fullText.includes('SECTION 3: ARTICLES & RESEARCH PAPERS'), `/llms-full.txt contains Section 3`);
    assert(fullText.includes('SECTION 4: BOOKS & MONOGRAPHS'), `/llms-full.txt contains Section 4`);
  } catch (err) {
    assert(false, `Suite 6 error: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // Suite 7: /api/knowledge-graph REST Endpoint
  // ---------------------------------------------------------------------------
  console.log('\n[Test Suite 7: /api/knowledge-graph Endpoint]');
  try {
    // 7.1 Valid Query
    const resKg = await fetch(`${BASE_URL}/api/knowledge-graph?locale=fa`);
    assert(resKg.status === 200, `GET /api/knowledge-graph?locale=fa returns 200 OK`);
    assert(resKg.headers.get('content-type')?.includes('application/ld+json'), `Content-Type is application/ld+json`);
    const kgJson = await resKg.json();
    assert(Array.isArray(kgJson['@graph']), `Root object contains @graph array`);
    assert(kgJson['@graph'].length >= 5, `Knowledge graph contains full graph items (found ${kgJson['@graph'].length})`);

    // 7.2 Strict Zod Validation Check
    const resKgMalicious = await fetch(`${BASE_URL}/api/knowledge-graph?locale=<script>alert(1)</script>`);
    assert(resKgMalicious.status === 400, `Malicious query param ?locale=<script> returns 400 Bad Request`);
  } catch (err) {
    assert(false, `Suite 7 error: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // Suite 8: SEO Discovery (robots.txt & sitemap.xml)
  // ---------------------------------------------------------------------------
  console.log('\n[Test Suite 8: SEO Discovery (robots.txt & sitemap.xml)]');
  try {
    // 8.1 robots.txt
    const resRobots = await fetch(`${BASE_URL}/robots.txt`);
    assert(resRobots.status === 200, `GET /robots.txt returns 200 OK`);
    const robotsText = await resRobots.text();
    assert(robotsText.includes('GPTBot') || robotsText.includes('ClaudeBot'), `robots.txt defines AI crawler user-agents`);
    assert(robotsText.includes('/llms.txt'), `robots.txt allows /llms.txt`);
    assert(robotsText.includes('/api/knowledge-graph'), `robots.txt allows /api/knowledge-graph`);

    // 8.2 sitemap.xml
    const resSitemap = await fetch(`${BASE_URL}/sitemap.xml`);
    assert(resSitemap.status === 200, `GET /sitemap.xml returns 200 OK`);
    const sitemapText = await resSitemap.text();
    assert(sitemapText.includes('<urlset'), `sitemap.xml is valid urlset XML`);
    assert(sitemapText.includes('/fa/glossary'), `sitemap.xml indexes /glossary`);
    assert(sitemapText.includes('is-psychoanalysis-a-science'), `sitemap.xml indexes psychoanalysis articles`);
    assert(sitemapText.includes('lacan-seminar-3-psychoses'), `sitemap.xml indexes books`);
    assert(sitemapText.includes('hreflang="fa-IR"') || sitemapText.includes('hreflang="fa"'), `sitemap.xml includes hreflang attributes`);
  } catch (err) {
    assert(false, `Suite 8 error: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // Suite 9: Cloudflare Security Audit Gate
  // ---------------------------------------------------------------------------
  console.log('\n[Test Suite 9: Cloudflare Security Audit Gate]');
  try {
    // 9.1 Test serializeSafeJsonLd breakout immunity directly
    const maliciousPayload = {
      title: '</script><script>alert("xss")</script>',
      tag: '<img src=x onerror=alert(1)>',
      amp: 'Lacan & Freud',
    };
    const serialized = serializeSafeJsonLd(maliciousPayload);
    assert(!serialized.includes('<script>'), `serializeSafeJsonLd escapes <script> tag`);
    assert(!serialized.includes('</script>'), `serializeSafeJsonLd escapes </script> breakout tag`);
    assert(serialized.includes('\\u003c'), `Raw < replaced with \\u003c unicode escape`);
    assert(serialized.includes('\\u003e'), `Raw > replaced with \\u003e unicode escape`);
    assert(serialized.includes('\\u0026'), `Raw & replaced with \\u0026 unicode escape`);

    // 9.2 Test sanitizeMetaString CRLF stripping directly
    const crlfAttack = 'Title\r\nSet-Cookie: sessionId=hacked\r\n\tAnotherLine';
    const sanitized = sanitizeMetaString(crlfAttack);
    assert(!sanitized.includes('\r'), `sanitizeMetaString strips \\r`);
    assert(!sanitized.includes('\n'), `sanitizeMetaString strips \\n`);
    assert(!sanitized.includes('\t'), `sanitizeMetaString strips \\t`);
    assert(sanitized === 'Title Set-Cookie: sessionId=hacked AnotherLine', `CRLF string normalized to clean single line`);
  } catch (err) {
    assert(false, `Suite 9 error: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`Phase 4 Verification Complete: ${passedTests}/${totalTests} tests passed`);
  if (failedTests > 0) {
    console.error(`Status: ${failedTests} FAILED`);
    process.exit(1);
  } else {
    console.log('Status: ALL SUITES PASSED (100%)');
  }
}

runPhase4Verification().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
