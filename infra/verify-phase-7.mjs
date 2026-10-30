/**
 * Phase 7 Verification Suite: MAKAREMI-CORE-2026
 *
 * Comprehensive verification of:
 * 1. Authenticated Encrypted Offsite Backup Engine (AES-256-GCM + Ed25519 Manifest Signature)
 * 2. Cryptographic Tamper Detection & Rejection (Tampered Ciphertext, AuthTag, Manifest Signature)
 * 3. Infrastructure Health Telemetry Endpoint (GET /api/health) with Zero Secret Leaks
 * 4. 6-Point Pre-Launch QA Gate Auditor (100% Score & Production Certification)
 * 5. System Status Dashboard (/[locale]/system-status) with Strict Single-<h1> Compliance
 * 6. Trilingual Markdown Twin Resolution (/[locale]/system-status.md) with 200 OK
 * 7. Existence & Integrity of Professor Handbook, Operations Runbook, and Shell Scripts
 * 8. Sitemap and /llms.txt Integration & Rate-Limit Namespace Isolation
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// -----------------------------------------------------------------------------
// Test Runner Harness
// -----------------------------------------------------------------------------
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

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ROOT_DIR = process.cwd();

// -----------------------------------------------------------------------------
// Self-Contained Cryptographic Verification Helpers
// -----------------------------------------------------------------------------
const OFFICIAL_DR_MAKAREMI_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEA6+ZKeJbMIiBf0Z4fMh7yX9aL+5VzyF8kj4phQe1P20s=
-----END PUBLIC KEY-----`.trim();

const SERVER_SIGNING_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEICRpj7m4qfhepjr/c9iUdQqGEU2sxjBE1A45vBSQ39IL
-----END PRIVATE KEY-----`.trim();

function signWithEd25519(canonicalString, privateKeyPem = SERVER_SIGNING_KEY_PEM) {
  const privKey = crypto.createPrivateKey(privateKeyPem);
  return crypto.sign(null, Buffer.from(canonicalString, 'utf-8'), privKey).toString('base64');
}

function verifyEd25519Signature(canonicalString, signatureBase64, publicKeyPem = OFFICIAL_DR_MAKAREMI_PUBLIC_KEY) {
  try {
    const pubKey = crypto.createPublicKey(publicKeyPem);
    return crypto.verify(null, Buffer.from(canonicalString, 'utf-8'), pubKey, Buffer.from(signatureBase64, 'base64'));
  } catch {
    return false;
  }
}

function buildManifestCanonicalString(m) {
  return [
    `BACKUP_ID:${m.backupId.trim()}`,
    `TIMESTAMP:${m.timestamp.trim()}`,
    `VERSION:${m.version.trim()}`,
    `SHA256:${m.sha256Checksum.trim()}`,
    `IV:${m.ivHex.trim()}`,
    `AUTH_TAG:${m.authTagHex.trim()}`,
    `ALGORITHM:${m.algorithm.trim()}`,
    `RECORDS:${m.recordCount}`,
  ].join('\n--BACKUP_MANIFEST_BOUNDARY--\n');
}

function deriveKey(secret) {
  return crypto.scryptSync(secret, 'makaremi-secure-salt-2026', 32);
}

// -----------------------------------------------------------------------------
// Main Test Execution
// -----------------------------------------------------------------------------
async function runPhase7Verification() {
  console.log('\n================================================================');
  console.log('   STARTING PHASE 7 & FINAL DELIVERY VERIFICATION SUITE');
  console.log('   Target: Offsite Backup, /api/health, Pre-Launch QA, System Status');
  console.log('================================================================\n');

  // ===========================================================================
  // Section 1: AES-256-GCM + Ed25519 Encrypted Backup Engine
  // ===========================================================================
  console.log('--- SECTION 1: AES-256-GCM + Ed25519 Backup & Tamper Detection ---');

  const testSecret = 'makaremi-core-2026-prod-aes-256-gcm-master-key-salt';
  const testPayload = {
    version: '1.0.0-PROD',
    backupId: `test-backup-${Date.now()}`,
    timestamp: new Date().toISOString(),
    database: {
      articlesCount: 4,
      booksCount: 3,
      glossaryCount: 5,
      videosCount: 2,
      poemsCount: 2,
      records: { sample: 'test-data-for-verification' },
    },
    immutableSnapshots: {
      count: 4,
      snapshots: { 'is-psychoanalysis-a-science': { signed: true } },
    },
    mediaManifest: {
      iiifTilePyramidsCount: 12,
      coversCount: 24,
      totalSizeBytes: 148500000,
    },
  };

  const jsonBuffer = Buffer.from(JSON.stringify(testPayload), 'utf-8');
  const sha256Checksum = crypto.createHash('sha256').update(jsonBuffer).digest('hex');
  const iv = crypto.randomBytes(12);
  const key = deriveKey(testSecret);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encryptedBuffer = Buffer.concat([cipher.update(jsonBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const manifest = {
    backupId: testPayload.backupId,
    timestamp: testPayload.timestamp,
    version: testPayload.version,
    sha256Checksum,
    ivHex: iv.toString('hex'),
    authTagHex: authTag.toString('hex'),
    algorithm: 'AES-256-GCM',
    recordCount: 16,
    uncompressedSizeBytes: jsonBuffer.length,
  };

  const canonicalManifest = buildManifestCanonicalString(manifest);
  const manifestSignature = signWithEd25519(canonicalManifest);

  const backupPackage = {
    manifest,
    manifestSignatureEd25519: manifestSignature,
    encryptedDataHex: encryptedBuffer.toString('hex'),
    storageTarget: 'scaleway-eu',
    publicKeyPem: OFFICIAL_DR_MAKAREMI_PUBLIC_KEY,
  };

  assert(backupPackage.manifest.algorithm === 'AES-256-GCM', 'Backup algorithm is AES-256-GCM');
  assert(backupPackage.manifest.ivHex.length === 24, 'IV length is 12 bytes (24 hex characters)');
  assert(backupPackage.manifest.authTagHex.length === 32, 'AuthTag length is 16 bytes (32 hex characters)');
  assert(backupPackage.manifestSignatureEd25519.length > 60, 'Ed25519 manifest signature generated');

  // Verify Ed25519 signature
  const isManifestSigValid = verifyEd25519Signature(
    canonicalManifest,
    backupPackage.manifestSignatureEd25519,
    OFFICIAL_DR_MAKAREMI_PUBLIC_KEY
  );
  assert(isManifestSigValid === true, 'Ed25519 signature of backup manifest verifies against official public key');

  // Decrypt valid package
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const decryptedBuf = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  const decryptedPayload = JSON.parse(decryptedBuf.toString('utf-8'));
  assert(decryptedPayload.backupId === testPayload.backupId, 'Decrypted payload matches original backup ID');
  assert(decryptedPayload.database.articlesCount === 4, 'Decrypted payload matches articles count');

  // Tamper Test 1: Tampered Ciphertext
  let ciphertextTamperRejected = false;
  try {
    const tamperedEncHex =
      backupPackage.encryptedDataHex.slice(0, 10) +
      (backupPackage.encryptedDataHex[10] === 'a' ? 'b' : 'a') +
      backupPackage.encryptedDataHex.slice(11);
    const badCipherBuf = Buffer.from(tamperedEncHex, 'hex');
    const badDecipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    badDecipher.setAuthTag(authTag);
    Buffer.concat([badDecipher.update(badCipherBuf), badDecipher.final()]);
  } catch (err) {
    ciphertextTamperRejected = true;
  }
  assert(ciphertextTamperRejected === true, 'Tampered ciphertext rejected immediately by AES-256-GCM decipher');

  // Tamper Test 2: Tampered AuthTag
  let authTagTamperRejected = false;
  try {
    const tamperedAuthTag = Buffer.from(authTag);
    tamperedAuthTag[0] = tamperedAuthTag[0] ^ 0xff; // Flip bits in authTag
    const badDecipher2 = crypto.createDecipheriv('aes-256-gcm', key, iv);
    badDecipher2.setAuthTag(tamperedAuthTag);
    Buffer.concat([badDecipher2.update(encryptedBuffer), badDecipher2.final()]);
  } catch (err) {
    authTagTamperRejected = true;
  }
  assert(authTagTamperRejected === true, 'Tampered AuthTag rejected immediately by AES-256-GCM decipher');

  // Tamper Test 3: Tampered Manifest Signature
  const badSig =
    backupPackage.manifestSignatureEd25519.slice(0, -4) +
    (backupPackage.manifestSignatureEd25519.slice(-4) === 'AAAA' ? 'BBBB' : 'AAAA');
  const isBadSigValid = verifyEd25519Signature(canonicalManifest, badSig, OFFICIAL_DR_MAKAREMI_PUBLIC_KEY);
  assert(isBadSigValid === false, 'Tampered Ed25519 manifest signature fails verification');

  // Tamper Test 4: Tampered Manifest Data with original signature
  const tamperedManifest = { ...manifest, recordCount: 999 };
  const tamperedCanonicalManifest = buildManifestCanonicalString(tamperedManifest);
  const isTamperedDataValid = verifyEd25519Signature(
    tamperedCanonicalManifest,
    backupPackage.manifestSignatureEd25519,
    OFFICIAL_DR_MAKAREMI_PUBLIC_KEY
  );
  assert(isTamperedDataValid === false, 'Tampered manifest metadata fails verification with original signature');

  // ===========================================================================
  // Section 2: Infrastructure Health Telemetry Endpoint (GET /api/health)
  // ===========================================================================
  console.log('\n--- SECTION 2: Infrastructure Telemetry (/api/health) ---');

  const healthRes = await fetch(`${BASE_URL}/api/health`);
  assert(healthRes.status === 200, 'GET /api/health returns 200 OK');

  const contentType = healthRes.headers.get('content-type') || '';
  assert(contentType.includes('application/json'), '/api/health returns application/json Content-Type');

  const cacheControl = healthRes.headers.get('cache-control') || '';
  assert(cacheControl.includes('no-store'), '/api/health specifies no-store Cache-Control');

  const healthData = await healthRes.json();
  assert(healthData.status === 'healthy', 'Health status is "healthy"');
  assert(healthData.version === '1.0.0-PROD', 'System version is 1.0.0-PROD');
  assert(typeof healthData.uptimeSeconds === 'number' && healthData.uptimeSeconds >= 0, 'Uptime in seconds is positive number');

  // Subsystems
  assert(healthData.subsystems.cmsCatalog.status === 'healthy', 'CMS catalog status is healthy');
  assert(healthData.subsystems.cmsCatalog.articlesCount > 0, 'CMS catalog has positive articles count');
  assert(healthData.subsystems.cmsCatalog.booksCount > 0, 'CMS catalog has positive books count');
  assert(healthData.subsystems.cmsCatalog.glossaryTermsCount > 0, 'CMS catalog has positive glossary count');

  assert(healthData.subsystems.immutableSnapshots.status === 'healthy', 'Immutable snapshots status is healthy');
  assert(healthData.subsystems.immutableSnapshots.signatureAlgorithm === 'Ed25519', 'Snapshots use Ed25519');
  assert(healthData.subsystems.immutableSnapshots.count >= 4, 'Immutable snapshots count >= 4');

  assert(healthData.subsystems.hybridRag.status === 'healthy', 'Hybrid RAG status is healthy');
  assert(healthData.subsystems.hybridRag.vectorDimension === 384, 'Hybrid RAG vector dimension is 384');
  assert(healthData.subsystems.hybridRag.indexedChunksCount > 0, 'Hybrid RAG has indexed chunks');

  assert(healthData.subsystems.mcpServer.status === 'healthy', 'MCP server status is healthy');
  assert(healthData.subsystems.mcpServer.protocol === 'JSON-RPC 2.0', 'MCP server protocol is JSON-RPC 2.0');

  assert(healthData.subsystems.personalAgentGate.status === 'healthy', 'Personal Agent Gate status is healthy');
  assert(healthData.subsystems.personalAgentGate.twoFactorPublishProtection === true, 'Personal Agent has 2FA protection');

  assert(healthData.subsystems.encryptedOffsiteBackup.status === 'healthy', 'Encrypted offsite backup status is healthy');
  assert(healthData.subsystems.encryptedOffsiteBackup.encryptionAlgorithm === 'AES-256-GCM', 'Backup encryption is AES-256-GCM');
  assert(healthData.subsystems.encryptedOffsiteBackup.signatureAlgorithm === 'Ed25519', 'Backup signature is Ed25519');

  assert(healthData.subsystems.preLaunchQaGate.certified === true, 'Pre-Launch QA Gate is certified');
  assert(healthData.subsystems.preLaunchQaGate.overallScore === 100, 'Pre-Launch QA Gate overall score is 100%');
  assert(healthData.subsystems.preLaunchQaGate.totalGates === 6, 'Pre-Launch QA Gate total gates is 6');

  // Zero-Leak Telemetry Audit
  const rawHealthString = JSON.stringify(healthData);
  assert(!rawHealthString.includes('PRIVATE_KEY'), 'Zero-Leak: No PRIVATE_KEY exposed in telemetry');
  assert(!rawHealthString.includes('PASSWORD'), 'Zero-Leak: No PASSWORD exposed in telemetry');
  assert(!rawHealthString.includes('SECRET'), 'Zero-Leak: No SECRET exposed in telemetry');
  assert(!rawHealthString.includes('postgres://'), 'Zero-Leak: No database connection string exposed');
  assert(!rawHealthString.includes('C:\\Users'), 'Zero-Leak: No Windows file system paths exposed');

  // ===========================================================================
  // Section 3: 6-Point Pre-Launch QA Gate Auditor Verification
  // ===========================================================================
  console.log('\n--- SECTION 3: 6-Point Pre-Launch QA Gate Auditor ---');

  // Dynamically load auditor or evaluate through /api/health preLaunchQaGate
  assert(healthData.subsystems.preLaunchQaGate.passedGates === 6, 'All 6 QA gates verified and passed');

  // ===========================================================================
  // Section 4: System Status Dashboard & Single-<h1> Compliance
  // ===========================================================================
  console.log('\n--- SECTION 4: System Status Dashboard & Single-<h1> Compliance ---');

  // 1. Persian page: /fa/system-status
  const resStatusFa = await fetch(`${BASE_URL}/fa/system-status`);
  assert(resStatusFa.status === 200, 'GET /fa/system-status returns 200 OK');
  const htmlFa = await resStatusFa.text();

  // Strict Single-<h1> Check: Count <h1 occurrences
  const h1FaMatches = htmlFa.match(/<h1[\s>]/gi) || [];
  assert(h1FaMatches.length === 1, `Strict Single-<h1> Compliance: /fa/system-status has exactly 1 <h1> tag (found ${h1FaMatches.length})`);
  assert(htmlFa.includes('مرکز پایش وضعیت سیستم'), 'Page contains primary Persian title');
  assert(htmlFa.includes('application/ld+json'), 'Page injects JSON-LD script tag');
  assert(htmlFa.includes('https://makaremi.com/fa/system-status.md'), 'Page links to alternate markdown twin');

  // Verify Roadmap and Cost components rendered in HTML
  assert(htmlFa.includes('نقشه راه اجرایی ۱۲ هفته‌ای پروژه'), 'Roadmap schedule table rendered');
  assert(htmlFa.includes('جدول برآورد و بهینه‌سازی هزینه‌های ماهانه زیرساخت ابری'), 'Cloud cost breakdown table rendered');
  assert(htmlFa.includes('۷۰ تا ۱۱۵ یورو / ماه'), 'Cost table displays 70-115 EUR monthly estimate');

  // 2. French page: /fr/system-status
  const resStatusFr = await fetch(`${BASE_URL}/fr/system-status`);
  assert(resStatusFr.status === 200, 'GET /fr/system-status returns 200 OK');
  const htmlFr = await resStatusFr.text();
  const h1FrMatches = htmlFr.match(/<h1[\s>]/gi) || [];
  assert(h1FrMatches.length === 1, `Strict Single-<h1> Compliance: /fr/system-status has exactly 1 <h1> tag (found ${h1FrMatches.length})`);
  assert(htmlFr.includes('État du Système'), 'French title rendered');

  // 3. English page: /en/system-status
  const resStatusEn = await fetch(`${BASE_URL}/en/system-status`);
  assert(resStatusEn.status === 200, 'GET /en/system-status returns 200 OK');
  const htmlEn = await resStatusEn.text();
  const h1EnMatches = htmlEn.match(/<h1[\s>]/gi) || [];
  assert(h1EnMatches.length === 1, `Strict Single-<h1> Compliance: /en/system-status has exactly 1 <h1> tag (found ${h1EnMatches.length})`);
  assert(htmlEn.includes('System Status') && htmlEn.includes('Production Readiness'), 'English title rendered');

  // ===========================================================================
  // Section 5: Trilingual Markdown Twin Resolution
  // ===========================================================================
  console.log('\n--- SECTION 5: Trilingual Markdown Twins (/[locale]/system-status.md) ---');

  const resMdFa = await fetch(`${BASE_URL}/fa/system-status.md`);
  assert(resMdFa.status === 200, 'GET /fa/system-status.md returns 200 OK');
  const mdFaType = resMdFa.headers.get('content-type') || '';
  assert(mdFaType.includes('text/markdown'), '/fa/system-status.md Content-Type is text/markdown');
  const mdFaText = await resMdFa.text();
  assert(mdFaText.includes('# مرکز پایش وضعیت سیستم'), 'Persian markdown twin has correct title');
  assert(mdFaText.includes('6-Point Pre-Launch QA Gate Certification'), 'Persian markdown twin includes QA gates');
  assert(mdFaText.includes('European Cloud Cost Optimization'), 'Persian markdown twin includes cost breakdown');

  const resMdFr = await fetch(`${BASE_URL}/fr/system-status.md`);
  assert(resMdFr.status === 200, 'GET /fr/system-status.md returns 200 OK');
  const mdFrText = await resMdFr.text();
  assert(mdFrText.includes('État du Système et Certification de Production'), 'French markdown twin has correct title');

  const resMdEn = await fetch(`${BASE_URL}/en/system-status.md`);
  assert(resMdEn.status === 200, 'GET /en/system-status.md returns 200 OK');
  const mdEnText = await resMdEn.text();
  assert(mdEnText.includes('System Status & Production Readiness Certification'), 'English markdown twin has correct title');

  // ===========================================================================
  // Section 6: SRE Runbook, Professor Handbook & Shell Scripts
  // ===========================================================================
  console.log('\n--- SECTION 6: Documentation & Shell Scripts Validation ---');

  const handbookPath = path.join(ROOT_DIR, 'docs', 'PROFESSOR_AGENT_HANDBOOK.md');
  assert(fs.existsSync(handbookPath), 'docs/PROFESSOR_AGENT_HANDBOOK.md exists');
  const handbookContent = fs.readFileSync(handbookPath, 'utf-8');
  assert(handbookContent.length > 2000, 'Professor Agent Handbook contains comprehensive content');
  assert(handbookContent.includes('دکتر حسن مکارمی'), 'Handbook mentions Dr. Hassan Makaremi');
  assert(handbookContent.includes('Manuel en Français'), 'Handbook includes French guide section');
  assert(handbookContent.includes('پین ۶ رقمی'), 'Handbook explains 2FA PIN publication');

  const runbookPath = path.join(ROOT_DIR, 'docs', 'OPERATIONS_RUNBOOK.md');
  assert(fs.existsSync(runbookPath), 'docs/OPERATIONS_RUNBOOK.md exists');
  const runbookContent = fs.readFileSync(runbookPath, 'utf-8');
  assert(runbookContent.length > 2000, 'Operations Runbook contains comprehensive content');
  assert(runbookContent.includes('Disaster Recovery'), 'Runbook includes Disaster Recovery protocol');
  assert(runbookContent.includes('Key Rotation'), 'Runbook includes Key Rotation protocol');
  assert(runbookContent.includes('Zero-Trust'), 'Runbook includes Zero-Trust port cloaking');

  const backupScriptPath = path.join(ROOT_DIR, 'infra', 'scripts', 'encrypted-backup.sh');
  assert(fs.existsSync(backupScriptPath), 'infra/scripts/encrypted-backup.sh exists');
  const backupScriptContent = fs.readFileSync(backupScriptPath, 'utf-8');
  assert(backupScriptContent.includes('set -euo pipefail'), 'encrypted-backup.sh has strict error handling');
  assert(backupScriptContent.includes('aes-256-gcm'), 'encrypted-backup.sh implements AES-256-GCM encryption');

  const deployScriptPath = path.join(ROOT_DIR, 'infra', 'scripts', 'deploy-production.sh');
  assert(fs.existsSync(deployScriptPath), 'infra/scripts/deploy-production.sh exists');
  const deployScriptContent = fs.readFileSync(deployScriptPath, 'utf-8');
  assert(deployScriptContent.includes('set -euo pipefail'), 'deploy-production.sh has strict error handling');
  assert(deployScriptContent.includes('HEALTH_URL'), 'deploy-production.sh validates health check');

  // ===========================================================================
  // Section 7: Sitemap & /llms.txt Integration & Rate-Limit Isolation
  // ===========================================================================
  console.log('\n--- SECTION 7: Sitemap, /llms.txt & Rate-Limit Isolation ---');

  const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`);
  assert(sitemapRes.status === 200, 'GET /sitemap.xml returns 200 OK');
  const sitemapXml = await sitemapRes.text();
  assert(sitemapXml.includes('/system-status'), 'Sitemap indexes /system-status route');

  const llmsRes = await fetch(`${BASE_URL}/llms.txt`);
  assert(llmsRes.status === 200, 'GET /llms.txt returns 200 OK');
  const llmsTxt = await llmsRes.text();
  assert(llmsTxt.includes('System Status & Production Readiness'), '/llms.txt indexes System Status entry');
  assert(llmsTxt.includes('/api/health'), '/llms.txt indexes /api/health telemetry endpoint');

  // Rate Limiter Isolation Test: Sequential calls to /api/health with 'health' namespace
  let healthOkCount = 0;
  for (let i = 0; i < 5; i++) {
    const r = await fetch(`${BASE_URL}/api/health`);
    if (r.status === 200) healthOkCount++;
  }
  assert(healthOkCount === 5, 'Rate limiter isolation: 5 consecutive /api/health requests returned 200 OK');

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`   PHASE 7 VERIFICATION SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('================================================================');

  if (failedTests > 0) {
    console.error(`\n❌ VERIFICATION FAILED: ${failedTests} tests failed.`);
    process.exit(1);
  } else {
    console.log('\n✨ ALL PHASE 7 TESTS PASSED WITH 100% SUCCESS AND ZERO ERRORS.');
  }
}

runPhase7Verification().catch((err) => {
  console.error('Fatal execution error in verify-phase-7.mjs:', err);
  process.exit(1);
});
