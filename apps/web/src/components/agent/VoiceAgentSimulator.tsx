'use client';

import React, { useState } from 'react';
import type { ArticleDraft, OmnichannelPublishResult } from '@/lib/agents/types';
import OmnichannelPreviewModal from './OmnichannelPreviewModal';

interface VoicePreset {
  id: string;
  title: string;
  topic: string;
  duration: string;
  presetUrl: string;
}

const PRESETS: VoicePreset[] = [
  {
    id: 'hafez',
    title: 'ویس ۱: روان‌کاوی حافظ و دگرشنیدن',
    topic: 'روان‌کاوی لکانی و ناخودآگاه',
    duration: '۰:۴۵',
    presetUrl: 'preset://voice-hafez-psychoanalysis',
  },
  {
    id: 'bordering',
    title: 'ویس ۲: نظریه مرزگستری و گسست نمادین',
    topic: 'نظریه مرزگستری و آسیب‌شناسی',
    duration: '۱:۰۲',
    presetUrl: 'preset://voice-bordering-theory',
  },
  {
    id: 'human_rights',
    title: 'ویس ۳: بیانیه دادخواهی و حقوق بشر',
    topic: 'دادخواهی و منشور جهانی حقوق بشر',
    duration: '۰:۳۸',
    presetUrl: 'preset://voice-human-rights-cnrs',
  },
];

export default function VoiceAgentSimulator() {
  const [activeChannel, setActiveChannel] = useState<'telegram' | 'whatsapp'>('telegram');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<VoicePreset>(PRESETS[0]!);
  const [draft, setDraft] = useState<ArticleDraft | null>(null);
  const [revisionText, setRevisionText] = useState('');
  const [isRevising, setIsRevising] = useState(false);
  const [pinChallenge, setPinChallenge] = useState<{ pin: string; expiresAt: number } | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [publishResult, setPublishResult] = useState<OmnichannelPublishResult | null>(null);
  const [showOmnichannelModal, setShowOmnichannelModal] = useState(false);

  // 1. Simulate sending voice note
  const handleSendVoice = async (preset: VoicePreset) => {
    setIsProcessing(true);
    setDraft(null);
    setPinChallenge(null);
    setPublishResult(null);
    setPinError('');

    try {
      const res = await fetch('/api/webhooks/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Bot-Api-Secret-Token': 'makaremi-tg-secret-2026',
        },
        body: JSON.stringify({
          update_id: Date.now(),
          message: {
            message_id: Math.floor(Math.random() * 100000),
            date: Math.floor(Date.now() / 1000),
            from: { id: 19501329, first_name: 'Dr. Hassan', username: 'hassan_makaremi' },
            voice: {
              file_id: preset.presetUrl,
              duration: 45,
            },
          },
        }),
      });

      const data = await res.json();
      if (data.ok && data.draft) {
        setDraft(data.draft);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Request PIN challenge
  const handleRequestPin = async () => {
    setIsProcessing(true);
    setPinError('');
    try {
      const res = await fetch('/api/webhooks/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Bot-Api-Secret-Token': 'makaremi-tg-secret-2026',
        },
        body: JSON.stringify({
          update_id: Date.now(),
          callback_query: {
            id: `cb_${Date.now()}`,
            from: { id: 19501329, username: 'hassan_makaremi' },
            data: 'request_publish_pin',
          },
        }),
      });

      const data = await res.json();
      if (data.ok && data.message) {
        const pinMatch = data.message.match(/\d{6}/);
        if (pinMatch) {
          setPinChallenge({ pin: pinMatch[0], expiresAt: data.expiresAt });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Verify PIN and Publish
  const handleVerifyAndPublish = async () => {
    if (!enteredPin) return;
    setIsProcessing(true);
    setPinError('');

    try {
      const res = await fetch('/api/webhooks/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Bot-Api-Secret-Token': 'makaremi-tg-secret-2026',
        },
        body: JSON.stringify({
          update_id: Date.now(),
          callback_query: {
            id: `cb_${Date.now()}`,
            from: { id: 19501329, username: 'hassan_makaremi' },
            data: `verify_pin:${enteredPin}`,
          },
        }),
      });

      const data = await res.json();
      if (data.ok && data.results) {
        setPublishResult(data.results);
        setPinChallenge(null);
        setShowOmnichannelModal(true);
      } else {
        setPinError(data.error || 'کد پین نامعتبر است');
      }
    } catch (err) {
      console.error(err);
      setPinError('خطا در برقراری ارتباط با سرور');
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Submit Voice Revision
  const handleSubmitRevision = async () => {
    if (!revisionText) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/webhooks/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Bot-Api-Secret-Token': 'makaremi-tg-secret-2026',
        },
        body: JSON.stringify({
          update_id: Date.now(),
          message: {
            message_id: Math.floor(Math.random() * 100000),
            date: Math.floor(Date.now() / 1000),
            from: { id: 19501329, username: 'hassan_makaremi' },
            text: `/revise ${revisionText}`,
          },
        }),
      });

      const data = await res.json();
      if (data.ok && data.draft) {
        setDraft(data.draft);
        setIsRevising(false);
        setRevisionText('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
      {/* Header and Channel Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <span className="text-xs uppercase tracking-wider font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Zero-Trust Personal AI Agent Studio
          </span>
          <h2 className="text-xl font-bold text-white mt-1">
            شبیه‌ساز تعاملی ایجنت صوتی دکتر حسن مکارمی
          </h2>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveChannel('telegram')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeChannel === 'telegram'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            تلگرام (@hassan_makaremi)
          </button>
          <button
            onClick={() => setActiveChannel('whatsapp')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeChannel === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            واتس‌اپ (+33619501329)
          </button>
        </div>
      </div>

      {/* Preset Voice Selector */}
      <div className="mt-6">
        <label className="block text-xs font-medium text-slate-400 mb-2">
          انتخاب پیام صوتی نمونه استاد برای آزمایش تبدیل ویس به مقاله:
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedPreset(p);
                handleSendVoice(p);
              }}
              disabled={isProcessing}
              className={`p-3 text-right rounded-xl border transition-all text-xs flex flex-col justify-between ${
                selectedPreset.id === p.id
                  ? 'border-amber-500/50 bg-amber-500/10 text-white'
                  : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="font-semibold text-slate-100">{p.title}</div>
              <div className="text-[11px] text-slate-400 mt-1">{p.topic}</div>
              <div className="text-[10px] text-amber-400 font-mono mt-2 flex items-center justify-between">
                <span>مدت: {p.duration}</span>
                <span>ارسال ویس 🎙️</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isProcessing && (
        <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800 text-center animate-pulse">
          <span className="text-amber-400 font-medium text-sm">
            در حال پردازش پیام صوتی با مدل Whisper Large-v3، اعمال واژه‌نامه لکانی و امضای Ed25519...
          </span>
        </div>
      )}

      {/* Draft Preview Card */}
      {draft && !isProcessing && (
        <div className="mt-6 bg-slate-950 border border-amber-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-full">
              Ed25519 Signed: {draft.sha256Digest.slice(0, 16)}...
            </span>
            <span className="text-xs text-slate-400">ستارگان لکانی اعمال‌شده</span>
          </div>

          <h3 className="text-lg font-bold text-white mt-3">{draft.title}</h3>
          <p className="text-xs text-slate-300 leading-relaxed mt-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800/60">
            {draft.executiveSummary}
          </p>

          {/* Interactive Glass Buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={handleRequestPin}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-lg shadow-amber-500/20"
            >
              تأیید و دریافت پین انتشار
            </button>
            <button
              onClick={() => setIsRevising(!isRevising)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-lg transition-colors border border-slate-700"
            >
              ویرایش صوتی / دستوری
            </button>
            <button
              onClick={() => setShowOmnichannelModal(true)}
              className="px-4 py-2 bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 font-medium text-xs rounded-lg transition-colors border border-sky-500/30"
            >
              پیش‌نمایش توزیع چندکاناله
            </button>
          </div>

          {/* Revision Input Box */}
          {isRevising && (
            <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                دستور اصلاحی صوتی یا متنی استاد:
              </label>
              <textarea
                value={revisionText}
                onChange={(e) => setRevisionText(e.target.value)}
                placeholder="مثال: در پاراگراف دوم به مفهوم عملیات نام‌پدر لکان و آمار CNRS هم اشاره کن..."
                className="w-full h-20 p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-500"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={() => setIsRevising(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  انصراف
                </button>
                <button
                  onClick={handleSubmitRevision}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg"
                >
                  اعمال اصلاحیه
                </button>
              </div>
            </div>
          )}

          {/* 2FA PIN Challenge Input */}
          {pinChallenge && (
            <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/40">
              <div className="text-xs text-amber-300 font-medium">
                رمز تأیید یک‌بارمصرف (PIN) به تلگرام استاد ارسال شد:
                <span className="font-mono font-bold text-white text-sm mx-2 bg-slate-950 px-2 py-0.5 rounded border border-amber-500/40">
                  {pinChallenge.pin}
                </span>
                (مهلت: ۳ دقیقه)
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  placeholder="کد ۶ رقمی را وارد کنید"
                  className="px-3 py-1.5 text-xs font-mono bg-slate-950 border border-slate-700 rounded-lg text-white text-center tracking-widest focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={handleVerifyAndPublish}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors"
                >
                  تأیید نهایی و انتشار اتمیک
                </button>
              </div>
              {pinError && <div className="text-xs text-rose-400 mt-2">{pinError}</div>}
            </div>
          )}
        </div>
      )}

      {/* Omnichannel Modal */}
      {showOmnichannelModal && (
        <OmnichannelPreviewModal
          isOpen={showOmnichannelModal}
          onClose={() => setShowOmnichannelModal(false)}
          draft={draft}
          publishResult={publishResult}
        />
      )}
    </div>
  );
}
