#!/usr/bin/env python3
"""
Option A (Zero-Cost Local Resumable ASR Pipeline) — MAKAREMI-CORE-2026
----------------------------------------------------------------------
Transcribes remaining uncaptioned Persian/French YouTube lectures in
packages/shared/src/data/transcripts/asr-pending-queue.json using:
  1. yt-dlp (downloads lightweight audio only into a temp folder, auto-cleaned)
  2. ffmpeg (normalizes audio to 16kHz mono WAV)
  3. faster-whisper (large-v3-turbo / medium) primed with Dr. Hassan Makaremi's
     Lacanian & archival glossary lock prompt for high Persian accuracy.

Features:
  - 100% resumable: checkpoints after EVERY single video into
    packages/shared/src/data/transcripts/videos.json (never loses progress).
  - Never mutates packages/shared/src/data/vault/videos.json.
  - Applies Persian normalization + glossary-lock corrections automatically.

Usage:
  python scripts/transcribe-audio-asr.py --setup
  python scripts/transcribe-audio-asr.py --limit 10
  python scripts/transcribe-audio-asr.py --model large-v3-turbo --device auto
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TRANSCRIPTS_DIR = ROOT / "packages" / "shared" / "src" / "data" / "transcripts"
TRANSCRIPTS_FILE = TRANSCRIPTS_DIR / "videos.json"
QUEUE_FILE = TRANSCRIPTS_DIR / "asr-pending-queue.json"
GLOSSARY_FILE = ROOT / "packages" / "shared" / "src" / "data" / "glossary-lock.json"


def normalize_persian(text: str) -> str:
    if not text:
        return ""
    out = (
        text.replace("\u064A", "\u06CC")
        .replace("\u0643", "\u06A9")
        .replace("\u0640", "")
        .replace("\u00A0", " ")
    )
    out = re.sub(r"[ \t]{2,}", " ", out)
    out = re.sub(r"\b(ن?می)\s+([\u0600-\u06FF]{2,})", r"\1\u200c\2", out)
    out = re.sub(r"([\u0600-\u06FF])\s+(ها|های|هایی|هایش|هایم|هایتان)\b", r"\1\u200c\2", out)

    corrections = [
        (r"دگر\s*شنیدن", "دگرشنیدن"),
        (r"دیگر\s*شنیدن", "دگرشنیدن"),
        (r"ژاک\s+لاکان", "ژاک لکان"),
        (r"روان\s*کاوی", "روان‌کاوی"),
        (r"روان\s*پریشی", "روان‌پریشی"),
        (r"روان\s*نژندی", "روان‌نژندی"),
        (r"روان\s*پژوهی", "روان‌پژوهی"),
        (r"سرزمین\s+فرهنگی\s+ایران", "سرزمین فرهنگی ایران"),
        (r"عملیات\s+نام\s+پدر", "عملیات نام پدر"),
        (r"گره\s+ب[و]?رومه\s*ای", "گره بورومه‌ای"),
        (r"حالت\s+مرزی", "حالت مرزی"),
        (r"دکتر\s+مکارمی", "دکتر مکارمی"),
    ]
    for pat, repl in corrections:
        out = re.sub(pat, repl, out)
    return out.strip()


def format_timestamp(sec: float) -> str:
    s = max(0, int(sec))
    h = s // 3600
    m = (s % 3600) // 60
    r = s % 60
    if h > 0:
        return f"{h:02d}:{m:02d}:{r:02d}"
    return f"{m:02d}:{r:02d}"


def build_glossary_prompt(lang: str) -> str:
    if lang == "fr":
        return (
            "Conférence du Dr Hassan Makaremi : psychanalyse lacanienne, Jacques Lacan, "
            "Écouter autrement, Opération Nom-du-Père, État limite, Nœud borroméen, "
            "Le Symbolique, L'Imaginaire, Le Réel, Hafez de Chiraz, Terre culturelle de l'Iran, "
            "calligraphie persane contemporaine, LDDHI, Khavaran."
        )
    return (
        "سخنرانی دکتر حسن مکارمی: روان‌کاوی لکانی، ژاک لکان، فروید، دگرشنیدن، "
        "عملیات نام پدر، حالت مرزی، روان‌پریشی، روان‌نژندی، گره بورومه‌ای، ساحت نمادین، "
        "ساحت خیالی، ساحت واقعی، تورس، فورکلوژن، حافظ شیرازی، سرزمین فرهنگی ایران، "
        "خوشنویسی نوگرا، دادخواهی، خاوران، جامعه دفاع از حقوق بشر در ایران."
    )


def build_markdown_and_chapters(segments, lang: str):
    paragraphs = []
    chapters = []
    bucket = []
    bucket_start = segments[0]["startSec"] if segments else 0.0
    last_chapter_sec = -999.0

    for i, seg in enumerate(segments):
        text = normalize_persian(seg["text"]) if lang == "fa" else seg["text"].strip()
        if not text:
            continue
        if not bucket:
            bucket_start = seg["startSec"]
        bucket.append(text)
        joined = " ".join(bucket)
        elapsed = seg["endSec"] - bucket_start
        is_last = i == len(segments) - 1
        ends_sentence = bool(re.search(r"[.!?؟…]$", text))

        if is_last or (elapsed >= 42 and (ends_sentence or len(joined) >= 360)) or len(joined) >= 520:
            stamp = format_timestamp(bucket_start)
            paragraphs.append(f"**[{stamp}]** {joined}")
            if bucket_start - last_chapter_sec >= 300 or not chapters:
                chapters.append(
                    {
                        "startSec": int(bucket_start),
                        "title": " ".join(joined.split()[:9]),
                    }
                )
                last_chapter_sec = bucket_start
            bucket = []

    return "\n\n".join(paragraphs), chapters[:12]


def download_audio_wav(
    youtube_id: str,
    work_dir: Path,
    cookies_from_browser: str = "",
    cookies_file: str = "",
    sleep_sec: int = 5,
) -> Path:
    url = f"https://www.youtube.com/watch?v={youtube_id}"
    raw_out = work_dir / f"{youtube_id}.%(ext)s"
    wav_out = work_dir / f"{youtube_id}.wav"

    yt_dlp_cmd = [
        sys.executable,
        "-m",
        "yt_dlp",
        "-f",
        "bestaudio/best",
        "--no-playlist",
        "--js-runtimes",
        "node",
        "--sleep-requests",
        str(max(1, sleep_sec)),
        "--quiet",
        "--no-warnings",
    ]
    if cookies_from_browser:
        yt_dlp_cmd.extend(["--cookies-from-browser", cookies_from_browser])
    elif cookies_file:
        yt_dlp_cmd.extend(["--cookies", cookies_file])
    yt_dlp_cmd.extend(["-o", str(raw_out), url])

    subprocess.run(yt_dlp_cmd, check=True)

    downloaded = [p for p in work_dir.glob(f"{youtube_id}.*") if p.suffix != ".wav"]
    if not downloaded:
        raise RuntimeError(f"yt-dlp produced no audio file for {youtube_id}")

    ffmpeg_cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(downloaded[0]),
        "-ac",
        "1",
        "-ar",
        "16000",
        "-vn",
        str(wav_out),
    ]
    subprocess.run(ffmpeg_cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    downloaded[0].unlink(missing_ok=True)
    return wav_out


def install_dependencies():
    print("Installing yt-dlp and faster-whisper into current Python environment...")
    subprocess.run(
        [sys.executable, "-m", "pip", "install", "--upgrade", "yt-dlp", "faster-whisper"],
        check=True,
    )
    print("Setup complete. Verify ffmpeg is available:", shutil.which("ffmpeg"))


def main():
    parser = argparse.ArgumentParser(description="Local zero-cost resumable ASR for Dr. Makaremi videos")
    parser.add_argument("--setup", action="store_true", help="Install yt-dlp and faster-whisper")
    parser.add_argument("--model", default="large-v3-turbo", help="Whisper model size (e.g. large-v3-turbo, medium, small)")
    parser.add_argument("--device", default="auto", choices=["auto", "cpu", "cuda"], help="Execution device")
    parser.add_argument("--compute-type", default="auto", help="Compute type (int8 for CPU, float16 for CUDA)")
    parser.add_argument("--limit", type=int, default=0, help="Max videos to process in this run (0 = all)")
    parser.add_argument("--only-id", default="", help="Transcribe a single specific YouTube video ID")
    parser.add_argument(
        "--cookies-from-browser",
        default="",
        help="Optional browser name for yt-dlp authenticated session (e.g. chrome, edge, firefox)",
    )
    parser.add_argument("--cookies", default="", help="Optional Netscape cookies.txt path for yt-dlp")
    parser.add_argument("--sleep", type=int, default=5, help="Polite delay in seconds between YouTube requests")
    args = parser.parse_args()

    if args.setup:
        install_dependencies()
        return

    if not shutil.which("ffmpeg"):
        print("ERROR: ffmpeg is not on PATH.", file=sys.stderr)
        sys.exit(1)

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print("faster-whisper is not installed yet. Run: python scripts/transcribe-audio-asr.py --setup", file=sys.stderr)
        sys.exit(1)

    if not QUEUE_FILE.exists():
        print(f"Queue file missing ({QUEUE_FILE}). Run `node scripts/extract-youtube-transcripts.mjs` first.", file=sys.stderr)
        sys.exit(1)

    queue_data = json.loads(QUEUE_FILE.read_text(encoding="utf-8"))
    items = queue_data.get("items", [])
    transcripts = json.loads(TRANSCRIPTS_FILE.read_text(encoding="utf-8")) if TRANSCRIPTS_FILE.exists() else {}

    if args.only_id:
        pending = [it for it in items if it["youtubeVideoId"] == args.only_id]
    else:
        pending = [it for it in items if it["youtubeVideoId"] not in transcripts]

    if args.limit > 0:
        pending = pending[: args.limit]

    if not pending:
        print("All queued videos already have transcripts in transcripts/videos.json!")
        return

    device = args.device
    compute_type = args.compute_type
    if device == "auto":
        try:
            import ctranslate2
            device = "cuda" if ctranslate2.get_cuda_device_count() > 0 else "cpu"
        except Exception:
            device = "cpu"
    if compute_type == "auto":
        compute_type = "float16" if device == "cuda" else "int8"

    print(f"Loading faster-whisper model={args.model} device={device} compute_type={compute_type}...")
    model = WhisperModel(args.model, device=device, compute_type=compute_type)
    print(f"Ready! Processing {len(pending)} videos (resumable checkpoint saved after each video).")

    completed = 0
    failed = 0
    for idx, item in enumerate(pending, start=1):
        yt_id = item["youtubeVideoId"]
        lang = item.get("sourceLang", "fa")
        title = item.get("titleFa", item.get("slug", yt_id))
        t0 = time.time()
        print(f"\n[{idx}/{len(pending)}] {yt_id} ({lang}, {item.get('durationSec', 0)}s) — {title}")

        with tempfile.TemporaryDirectory(prefix="makaremi_asr_") as tmp:
            try:
                wav_path = download_audio_wav(
                    yt_id,
                    Path(tmp),
                    cookies_from_browser=args.cookies_from_browser,
                    cookies_file=args.cookies,
                    sleep_sec=args.sleep,
                )
                seg_iter, info = model.transcribe(
                    str(wav_path),
                    language=lang if lang in ("fa", "fr", "en") else "fa",
                    beam_size=5,
                    vad_filter=True,
                    initial_prompt=build_glossary_prompt(lang),
                )
                segments = []
                for s in seg_iter:
                    txt = normalize_persian(s.text) if lang == "fa" else s.text.strip()
                    if txt:
                        segments.append(
                            {
                                "startSec": round(float(s.start), 2),
                                "endSec": round(float(s.end), 2),
                                "text": txt,
                            }
                        )

                markdown, chapters = build_markdown_and_chapters(segments, lang)
                if len(markdown.strip()) < 80:
                    print(f"  WARN: Transcript too short ({len(markdown)} chars); skipping save.")
                    failed += 1
                    continue

                transcripts[yt_id] = {
                    "key": yt_id,
                    "sourceLang": lang,
                    "method": "asr_verified",
                    "durationSec": int(info.duration or item.get("durationSec") or 0),
                    "wordCount": len(markdown.split()),
                    "chapters": chapters,
                    "segments": segments,
                    "transcriptMarkdown": markdown,
                    "updatedAt": datetime.now(timezone.utc).isoformat(),
                }

                # Atomic checkpoint save after EVERY video
                tmp_out = TRANSCRIPTS_FILE.with_suffix(".json.tmp")
                tmp_out.write_text(json.dumps(transcripts, ensure_ascii=False, indent=2), encoding="utf-8")
                tmp_out.replace(TRANSCRIPTS_FILE)

                completed += 1
                print(
                    f"  OK: {len(segments)} segments, {transcripts[yt_id]['wordCount']} words "
                    f"in {time.time() - t0:.1f}s (saved checkpoint)"
                )
            except Exception as exc:
                failed += 1
                print(f"  ERROR on {yt_id}: {exc}", file=sys.stderr)

    print(f"\n=== ASR RUN SUMMARY: completed={completed}, failed={failed}, total_saved={len(transcripts)} ===")


if __name__ == "__main__":
    main()
