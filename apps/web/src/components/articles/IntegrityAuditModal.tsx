'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Key, Terminal, Check, Copy, ExternalLink, Loader2 } from 'lucide-react';
import type { Locale } from '@makaremi/shared';

interface IntegrityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  locale: Locale;
}

interface IntegrityData {
  slug: string;
  locale: string;
  algorithm: string;
  canonical_sha256: string;
  signature_ed25519: string;
  public_key_url: string;
  verified: boolean;
  signed_at: string;
  cli_verification_cmd: string;
}

export function IntegrityAuditModal({ isOpen, onClose, slug, locale }: IntegrityAuditModalProps) {
  const [data, setData] = useState<IntegrityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const tx = (fa: string, fr: string, en: string) => (isFa ? fa : isFr ? fr : en);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    setLoading(true);

    fetch(`/api/integrity?slug=${encodeURIComponent(slug)}&locale=${encodeURIComponent(locale)}`)
      .then((res) => res.json())
      .then((json) => {
        if (active) {
          setData(json);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      active = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, slug, locale, onClose]);

  if (!isOpen) return null;

  const copyCliCmd = () => {
    if (!data?.cli_verification_cmd) return;
    navigator.clipboard.writeText(data.cli_verification_cmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 id="audit-modal-title" className="font-bold text-base md:text-lg">
                {tx('راستی‌آزمایی رمزنگاری و امضای دیجیتال', 'Vérification Cryptographique Ed25519', 'Ed25519 Cryptographic Verification')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {tx('اثبات ریاضی عدم تحریف و تغییرناپذیری سند', 'Preuve mathématique d’intégrité immuable', 'Mathematical proof of immutable archival authenticity')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={tx('بستن پنجره', 'Fermer la fenêtre', 'Close window')}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-sm max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 size={28} className="animate-spin text-emerald-600" />
              <span>{tx('در حال استعلام کلید عمومی و محاسبه امضا...', 'Calcul de l’empreinte en cours...', 'Verifying public key and computing digest...')}</span>
            </div>
          ) : data ? (
            <>
              {/* Verification status badge */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-semibold text-xs md:text-sm">
                    {data.verified
                      ? tx(
                          'امضای دیجیتال معتبر است: سند ۱۰۰٪ اصیل و بدون تحریف',
                          'Signature Ed25519 valide : document 100% authentique',
                          'Valid Ed25519 signature: document 100% authentic and unaltered'
                        )
                      : tx(
                          'هشدار: امضای دیجیتال تطابق ندارد',
                          'Attention : signature invalide',
                          'Warning: cryptographic signature mismatch'
                        )}
                  </span>
                </div>
                <span className="text-[11px] font-mono bg-emerald-500/20 px-2 py-0.5 rounded">
                  {data.algorithm}
                </span>
              </div>

              {/* SHA-256 Digest */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  {tx('چکیده کانونیکال (SHA-256 Canonical Digest):', 'Empreinte canonique SHA-256 :', 'SHA-256 Canonical Digest:')}
                </label>
                <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-950 font-mono text-xs break-all border border-slate-200 dark:border-slate-800">
                  {data.canonical_sha256}
                </div>
              </div>

              {/* Ed25519 Signature */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  {tx('امضای نامتقارن (Ed25519 Asymmetric Signature):', 'Signature asymétrique Ed25519 :', 'Ed25519 Asymmetric Signature:')}
                </label>
                <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-950 font-mono text-xs break-all border border-slate-200 dark:border-slate-800 max-h-24 overflow-y-auto">
                  {data.signature_ed25519}
                </div>
              </div>

              {/* Public key */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
                <div className="flex items-center gap-2">
                  <Key size={16} className="text-amber-500 shrink-0" />
                  <span>
                    {tx('کلید عمومی رسمی دکتر حسن مکارمی:', 'Clé publique officielle :', 'Official Public Key (Dr Hassan Makaremi):')}
                  </span>
                </div>
                <a
                  href={data.public_key_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline font-mono"
                >
                  makaremi-public-key.pem <ExternalLink size={12} />
                </a>
              </div>

              {/* Terminal command for independent verification */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Terminal size={14} />
                    {tx('فرمان خط فرمان جهت راستی‌آزمایی مستقل:', 'Commande CLI de vérification :', 'CLI Command for Independent Verification:')}
                  </label>
                  <button
                    type="button"
                    onClick={copyCliCmd}
                    className="inline-flex items-center gap-1 text-[11px] text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    {copiedCmd ? <Check size={12} /> : <Copy size={12} />}
                    {copiedCmd ? tx('کپی شد', 'Copié', 'Copied') : tx('کپی فرمان', 'Copier', 'Copy command')}
                  </button>
                </div>
                <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800">
                  {data.cli_verification_cmd}
                </pre>
              </div>
            </>
          ) : (
            <div className="py-6 text-center text-slate-500">
              {tx('خطا در دریافت اطلاعات امضای دیجیتال', 'Erreur lors de la récupération des données', 'Failed to retrieve cryptographic signature data')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            {tx('بستن', 'Fermer', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
}
