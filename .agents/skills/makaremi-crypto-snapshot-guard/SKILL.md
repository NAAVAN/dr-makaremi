---
name: makaremi-crypto-snapshot-guard
description: >-
  Use this skill whenever adding or modifying CMS content (articles, books,
  speeches, exhibitions), updating immutable snapshots, verifying Ed25519
  digital signatures, or managing AES-256-GCM encrypted offsite backups in the
  MAKAREMI-CORE-2026 platform.
---

# Makaremi Cryptographic Integrity & Encrypted Backup Guard

## Overview
Maintains the Zero-Trust cryptographic provenance of Dr. Hassan Makaremi's works using `Ed25519-SHA256` digital signatures ([`crypto.ts`](../../apps/web/src/lib/crypto.ts)), self-healing immutable snapshots ([`self-healing.ts`](../../apps/web/src/lib/self-healing.ts)), and authenticated `AES-256-GCM` offsite backups ([`backup-manager.ts`](../../apps/web/src/lib/backup/backup-manager.ts)).

## Workflow

### 1. Canonical SHA-256 & Ed25519 Signing for Content
Whenever adding or updating an article, book, or speech in [`cms.ts`](../../apps/web/src/lib/cms.ts) or [`immutable-snapshots.ts`](../../apps/web/src/lib/immutable-snapshots.ts):
1. Construct the canonical payload string using `buildCanonicalPayload({ slug, locale, title, body, published_at })`.
2. Compute the canonical SHA-256 hex digest via `computeCanonicalSha256()`.
3. Sign the canonical payload with `signCanonicalPayload()` using the official Ed25519 private key (`MAKAREMI_ED25519_PRIVATE_KEY_PEM` or deterministic seed in dev).
4. Update the corresponding entry in `VERIFIED_IMMUTABLE_SNAPSHOTS` so that [`verifyAndHealArticle()`](../../apps/web/src/lib/self-healing.ts) recognizes the updated state as authentic and does not revert it as unauthorized tampering.

### 2. Authenticated Offsite Backups (`AES-256-GCM` + `Ed25519`)
When creating or restoring backups via [`backup-manager.ts`](../../apps/web/src/lib/backup/backup-manager.ts) or [`encrypted-backup.sh`](../../infra/scripts/encrypted-backup.sh):
1. Always use a random 12-byte IV (`24` hex chars) and extract the 16-byte authentication tag (`32` hex chars).
2. Sign the manifest string `backupId|timestamp|sha256Checksum|ivHex|authTagHex` using `signCanonicalPayload()`.
3. During restoration (`verifyAndDecryptBackup()`), verify **both** the `Ed25519` manifest signature and the `AES-256-GCM` authentication tag before accepting decrypted data.

### 3. Validation
Run the Phase 3 and Phase 7 cryptographic verification suites after any content or key operation:
```powershell
node infra/verify-phase-3.mjs
node infra/verify-phase-7.mjs
```

## Common Mistakes
- **Editing Article Text Without Updating Snapshot:** If you edit an article in `cms.ts` without updating `immutable-snapshots.ts`, the self-healing engine will treat the edit as defacement and automatically restore the old snapshot.
- **Exposing Private Keys in Telemetry:** Never include `PRIVATE_KEY`, `SECRET`, or filesystem paths in `/api/health` responses.

