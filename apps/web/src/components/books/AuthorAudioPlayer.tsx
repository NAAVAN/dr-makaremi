'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Mic, RotateCcw } from 'lucide-react';
import type { Locale } from '@makaremi/shared';

interface AuthorAudioPlayerProps {
  bookTitle: string;
  audioSrc?: string;
  locale: Locale;
}

export function AuthorAudioPlayer({ bookTitle, audioSrc, locale }: AuthorAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(180); // 3 minutes default
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isFa = locale === 'fa';

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleRateChange = () => {
    const nextRate = playbackRate === 1 ? 1.25 : playbackRate === 1.25 ? 1.5 : 1;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      const dur = audioRef.current.duration || 180;
      setProgress((cur / dur) * 100);
      setDuration(dur);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  return (
    <div className="rounded-2xl bg-gradient-to-r from-[var(--surface-sunken)] to-[var(--surface-card)] border border-[var(--border-subtle)] p-5 space-y-3">
      {/* Audio element */}
      <audio
        ref={audioRef}
        src={audioSrc || 'https://makaremi.com/assets/audio/sample-commentary.mp3'}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        preload="metadata"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
            <Mic size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--foreground)]">
              {isFa ? 'چکیده و انگیزه نگارش به صدای مؤلف' : "Commentaire audio de l'auteur"}
            </h4>
            <p className="text-xs text-[var(--foreground-muted)]">
              {isFa ? 'دکتر حسن مکارمی (پاریس)' : 'Dr. Hassan Makaremi'}
            </p>
          </div>
        </div>

        {/* Speed toggle */}
        <button
          type="button"
          onClick={handleRateChange}
          className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--foreground)] hover:bg-[var(--surface-overlay)] transition-colors"
          title="سرعت پخش"
        >
          {playbackRate}x
        </button>
      </div>

      {/* Progress & Waveform bars simulation */}
      <div className="space-y-1.5">
        <div className="h-1.5 w-full bg-[var(--border-subtle)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--primary)] transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Fake decorative waveform */}
        <div className="flex items-center justify-between gap-1 h-6 px-1 opacity-70">
          {[40, 65, 30, 85, 95, 45, 60, 80, 50, 90, 70, 40, 100, 75, 55, 35, 80, 65, 50, 30].map(
            (val, idx) => (
              <span
                key={idx}
                className="w-1 rounded-full bg-[var(--foreground-muted)] transition-all"
                style={{
                  height: `${isPlaying ? (val * (0.5 + Math.random() * 0.5)) : val * 0.3}%`,
                }}
              />
            )
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={togglePlay}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold shadow-md hover:opacity-90 transition-all cursor-pointer"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          <span>{isPlaying ? (isFa ? 'توقف پخش' : 'Pause') : (isFa ? 'شنیدن صدای مؤلف' : 'Écouter')}</span>
        </button>

        <span className="text-[11px] text-[var(--foreground-muted)] font-mono">
          {Math.floor((duration * (progress / 100)) / 60)}:
          {String(Math.floor((duration * (progress / 100)) % 60)).padStart(2, '0')} / {Math.floor(duration / 60)}:00
        </span>
      </div>
    </div>
  );
}
