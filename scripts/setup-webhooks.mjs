#!/usr/bin/env node
/**
 * One-Command Telegram Webhook Registration & Production Credential Generator (Phase E)
 *
 * Usage:
 *   1) Generate strong production secrets (prints safely to terminal for pasting into Vercel):
 *        node scripts/setup-webhooks.mjs --generate-secrets
 *
 *   2) Register live Telegram Bot webhook once TELEGRAM_BOT_TOKEN & TELEGRAM_WEBHOOK_SECRET are set:
 *        node scripts/setup-webhooks.mjs --register-telegram --url https://makaremi.com
 */

import crypto from 'node:crypto';

const args = process.argv.slice(2);
const shouldGenerate = args.includes('--generate-secrets');
const shouldRegisterTg = args.includes('--register-telegram');
const urlFlagIdx = args.indexOf('--url');
const baseUrl =
  (urlFlagIdx >= 0 && args[urlFlagIdx + 1] ? args[urlFlagIdx + 1] : process.env.NEXT_PUBLIC_SITE_URL || 'https://dr-makaremi-alpha.vercel.app')
    .replace(/\/+$/, '');

if (!shouldGenerate && !shouldRegisterTg) {
  console.log(`
MAKAREMI-CORE-2026 Webhook & Production Security Helper
-------------------------------------------------------
Commands:
  node scripts/setup-webhooks.mjs --generate-secrets
      Generates cryptographically strong random secrets + a fresh Ed25519 keypair for Vercel Production.

  node scripts/setup-webhooks.mjs --register-telegram --url https://makaremi.com
      Registers /api/webhooks/telegram with Telegram Bot API using TELEGRAM_BOT_TOKEN & TELEGRAM_WEBHOOK_SECRET.
`);
  process.exit(0);
}

if (shouldGenerate) {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  console.log('=== COPY THESE VALUES INTO VERCEL -> SETTINGS -> ENVIRONMENT VARIABLES (PRODUCTION) ===\n');
  console.log(`SUPER_ADMIN_SECRET=${crypto.randomBytes(24).toString('base64url')}`);
  console.log(`MAKAREMI_PROFESSOR_PIN=${crypto.randomBytes(12).toString('base64url')}`);
  console.log(`TELEGRAM_WEBHOOK_SECRET=${crypto.randomBytes(24).toString('hex')}`);
  console.log(`WHATSAPP_VERIFY_TOKEN=${crypto.randomBytes(18).toString('hex')}`);
  console.log('\n# Optional: Replace dev Ed25519 signing key with fresh production keypair:');
  console.log(`# MAKAREMI_SIGNING_KEY="${privateKey.trim().replace(/\n/g, '\\n')}"`);
  console.log(`# Public Key for archive provenance:\n${publicKey.trim()}`);
  console.log('\n=======================================================================================');
}

if (shouldRegisterTg) {
  const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
  const webhookSecret = (process.env.TELEGRAM_WEBHOOK_SECRET || '').trim();
  if (!botToken || !webhookSecret) {
    console.error('ERROR: Set TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET in your environment first.');
    process.exit(1);
  }

  const webhookUrl = `${baseUrl}/api/webhooks/telegram`;
  console.log(`Registering Telegram webhook -> ${webhookUrl} ...`);
  const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: webhookSecret,
      allowed_updates: ['message', 'callback_query'],
      drop_pending_updates: false,
    }),
  });
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
  if (!json.ok) process.exit(1);
}
