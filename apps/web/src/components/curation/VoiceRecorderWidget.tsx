'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Upload, Volume2, Sparkles, CheckCircle2 } from 'lucide-react';

export interface RecordedAudioAsset {
  id: string;
  mode: 'site_intro' | 'editorial_note';
  label: string;
  durationSec: number;
  mimeType: string;
  dataUrl?: string; // Base64 or object URL for preview/export
  fileName?: string;
  createdAt: string;
}

interface VoiceRecorderWidgetProps {
  itemId: string;
  itemTitle: string;
  mode: 'site_intro' | 'editorial_note';
  existingAudio?: RecordedAudioAsset | null;
  onSaveAudio: (audio: RecordedAudioAsset | null) => void;
  onTranscriptAppended?: (transcriptText: string) => void;
  compact?: boolean;
}

export function VoiceRecorderWidget({
  itemId,
  itemTitle,
  mode,
  existingAudio,
  onSaveAudio,
  onTranscriptAppended,
  compact = false,
}: VoiceRecorderWidgetProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechRecognizing, setIsSpeechRecognizing] = useState(false);
  const [speechLang, setSpeechLang] = useState<'fa-IR' | 'fr-FR'>('fa-IR');
  const [seconds, setSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const startRecording = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64DataUrl = typeof reader.result === 'string' ? reader.result : '';
          const asset: RecordedAudioAsset = {
            id: `${itemId}-${mode}-${Date.now()}`,
            mode,
            label:
              mode === 'site_intro'
                ? `صدای استاد برای نمایش در سایت: ${itemTitle}`
                : `یادداشت صوتی استاد برای تیم فنی: ${itemTitle}`,
            durationSec: seconds || 1,
            mimeType: blob.type || 'audio/webm',
            dataUrl: base64DataUrl,
            fileName: `makaremi-${mode}-${itemId}.webm`,
            createdAt: new Date().toISOString(),
          };
          onSaveAudio(asset);
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      setErrorMsg('دسترسی به میکروفون امکان‌پذیر نشد. لطفاً مجوز میکروفون مرورگر را تایید کنید یا فایل صوتی را بارگذاری نمایید.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64DataUrl = typeof reader.result === 'string' ? reader.result : '';
      const asset: RecordedAudioAsset = {
        id: `${itemId}-${mode}-${Date.now()}`,
        mode,
        label:
          mode === 'site_intro'
            ? `فایل صوتی استاد برای سایت (${file.name})`
            : `فایل صوتی یادداشت (${file.name})`,
        durationSec: 0,
        mimeType: file.type || 'audio/mpeg',
        dataUrl: base64DataUrl,
        fileName: file.name,
        createdAt: new Date().toISOString(),
      };
      onSaveAudio(asset);
    };
    reader.readAsDataURL(file);
  };

  const toggleSpeechToText = () => {
    setErrorMsg(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMsg('مرورگر شما از تایپ صوتی خودکار پشتیبانی نمی‌کند؛ می‌توانید از دکمه «ضبط مستقیم صدا» استفاده فرمایید.');
      return;
    }

    if (isSpeechRecognizing && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsSpeechRecognizing(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = speechLang;
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          text += event.results[i][0].transcript + ' ';
        }
      }
      if (text.trim() && onTranscriptAppended) {
        onTranscriptAppended(text.trim());
      }
    };

    recognition.onerror = () => {
      setIsSpeechRecognizing(false);
    };

    recognition.onend = () => {
      setIsSpeechRecognizing(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsSpeechRecognizing(true);
  };

  const togglePlay = () => {
    if (!existingAudio?.dataUrl) return;
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio(existingAudio.dataUrl);
      audioPlayerRef.current.onended = () => setIsPlaying(false);
    }
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.src = existingAudio.dataUrl;
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const isSiteIntro = mode === 'site_intro';

  return (
    <div
      className={`rounded-xl border transition-all ${
        isSiteIntro
          ? 'bg-amber-50/70 border-amber-300/80 p-3.5'
          : 'bg-slate-50 border-slate-200 p-3'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${
              isSiteIntro ? 'bg-amber-600 text-white' : 'bg-teal-700 text-white'
            }`}
          >
            {isSiteIntro ? <Volume2 className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </span>
          <div>
            <div className="text-sm font-bold text-slate-900">
              {isSiteIntro
                ? '🎙️ ضبط صدای استاد برای پخش در سایت جدید (معرفی کوتاه اثر / دکلمه)'
                : '🎙️ یادداشت صوتی یا تایپ گفتاری استاد برای تیم فنی'}
            </div>
            {!compact && (
              <p className="text-xs text-slate-600">
                {isSiteIntro
                  ? 'صدایی که اینجا ضبط یا بارگذاری کنید، در صفحه این اثر در سایت جدید با نام «بشنوید با صدای دکتر حسن مکارمی» قرار می‌گیرد.'
                  : 'می‌توانید به جای تایپ کردن، نظر یا دستور اصلاحی خود را با میکروفون بیان فرمایید.'}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm transition ${
                isSiteIntro
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-teal-700 hover:bg-teal-800'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{existingAudio ? 'ضبط مجدد صدا' : 'شروع ضبط صدای استاد'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-sm"
            >
              <Square className="w-3.5 h-3.5" />
              <span>توقف و ذخیره ضبط ({formatTime(seconds)})</span>
            </button>
          )}

          {/* Upload audio file fallback */}
          <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>بارگذاری فایل صوتی</span>
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Speech-to-Text button if onTranscriptAppended is provided */}
          {onTranscriptAppended && (
            <div className="inline-flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-0.5">
              <button
                type="button"
                onClick={toggleSpeechToText}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                  isSpeechRecognizing
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{isSpeechRecognizing ? 'در حال تبدیل گفتار به متن...' : 'تایپ صوتی خودکار'}</span>
              </button>
              <select
                value={speechLang}
                onChange={(e) => setSpeechLang(e.target.value as 'fa-IR' | 'fr-FR')}
                className="text-xs bg-transparent border-r border-slate-200 px-1.5 py-1 text-slate-700 font-medium focus:outline-none"
                title="زبان گفتار"
              >
                <option value="fa-IR">فارسی</option>
                <option value="fr-FR">Français</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Existing recorded audio preview bar */}
      {existingAudio && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 bg-white border border-emerald-300 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-emerald-900">
              {existingAudio.fileName || 'فایل صوتی ضبط‌شده آماده انتقال به سایت جدید'}
            </span>
            {existingAudio.durationSec > 0 && (
              <span className="text-xs text-slate-500">({formatTime(existingAudio.durationSec)})</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'توقف پخش' : 'پخش صدای ضبط‌شده'}</span>
            </button>
            {existingAudio.dataUrl && (
              <a
                href={existingAudio.dataUrl}
                download={existingAudio.fileName || `makaremi-audio-${itemId}.webm`}
                className="text-xs font-semibold text-teal-700 hover:underline px-2 py-1"
              >
                دانلود فایل صوتی
              </a>
            )}
            <button
              type="button"
              onClick={() => {
                if (audioPlayerRef.current) {
                  audioPlayerRef.current.pause();
                  setIsPlaying(false);
                }
                onSaveAudio(null);
              }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف</span>
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <p className="mt-2 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
          {errorMsg}
        </p>
      )}
    </div>
  );
}

