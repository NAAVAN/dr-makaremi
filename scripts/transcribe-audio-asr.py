#!/usr/bin/env python3
"""
Local + Cloud Resumable ASR Pipeline — MAKAREMI-CORE-2026
---------------------------------------------------------
Supports BOTH:
  - `--provider local` (zero-cost local faster-whisper on CPU/GPU)
  - `--provider groq`  (ultra-fast Groq Whisper API: whisper-large-v3 / whisper-large-v3-turbo)
  - `--provider openai` (OpenAI Audio API: whisper-1 / gpt-4o-mini-transcribe)

Features:
  - Automatically loads GROQ_API_KEY / OPENAI_API_KEY from `.env.local` or env vars.
  - Fast Path (`--prefer-captions`, default ON): Checks matching YouTube VTT captions first.
  - Automatic ffmpeg compression (16kHz mono 48kbps MP3) + 25-minute chunk slicing
    with exact timestamp offset stitching so even 90-minute lectures never exceed API limits.
  - Expanded Dr. Hassan Makaremi Lacanian & Persian phonetic ASR post-normalizer.
  - 100% resumable: atomic checkpoint saved after EVERY single video into
    packages/shared/src/data/transcripts/videos.json.
  - Never mutates packages/shared/src/data/vault/videos.json.
  - Circuit breaker: halts cleanly on YouTube 429/bot gate or Groq daily quota limit.
"""

import argparse
import html
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")

ROOT = Path(__file__).resolve().parent.parent
TRANSCRIPTS_DIR = ROOT / "packages" / "shared" / "src" / "data" / "transcripts"
TRANSCRIPTS_FILE = TRANSCRIPTS_DIR / "videos.json"
QUEUE_FILE = TRANSCRIPTS_DIR / "asr-pending-queue.json"
SKIPPED_FILE = TRANSCRIPTS_DIR / "asr-skipped-unavailable.json"
ENV_LOCAL_FILE = ROOT / ".env.local"


class YouTubeRateLimitError(RuntimeError):
    """Raised immediately if YouTube returns 429 or bot-check gate."""


class YouTubeUnavailableError(RuntimeError):
    """Raised if a video is private, deleted, or unavailable."""


class CloudQuotaExhaustedError(RuntimeError):
    """Raised when cloud STT daily quota or billing limit is reached."""


def load_dotenv_local():
    """Loads key=value lines from .env.local into os.environ without overriding existing env vars."""
    if not ENV_LOCAL_FILE.exists():
        return
    for raw_line in ENV_LOCAL_FILE.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, val = line.split("=", 1)
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        if key and val and key not in os.environ:
            os.environ[key] = val


def normalize_persian(text: str) -> str:
    if not text:
        return ""
    out = (
        text.replace("\u064A", "\u06CC")
        .replace("\u0643", "\u06A9")
        .replace("\u0640", "")
        .replace("\u00A0", " ")
    )
    zwnj = "\u200c"
    # Strip Whisper intro-music filler tags cleanly without harming genuine mentions of music
    if re.fullmatch(r"[\s\[\(\]\)\.,!،؟…\-]*(?:(?:موسیقی|موزیک)[\s\[\(\]\)\.,!،؟…\-]*)+", out):
        return ""
    out = re.sub(r"[\[\(]\s*(?:موسیقی|موزیک)\s*[\]\)]", " ", out)
    out = re.sub(r"\b(موسیقی|موزیک)(?:\s+\1)+\b", " ", out)
    out = re.sub(r"[ \t]{2,}", " ", out)
    out = re.sub(r"\b(ن?می)\s+([\u0600-\u06FF]{2,})", rf"\1{zwnj}\2", out)
    out = re.sub(r"([\u0600-\u06FF])\s+(ها|های|هایی|هایش|هایم|هایتان)\b", rf"\1{zwnj}\2", out)

    # Dr. Hassan Makaremi Lacanian & recurring Persian phonetic ASR corrections
    corrections = [
        (r"دگر\s*شنیدن", "دگرشنیدن"),
        (r"دیگر\s*شنیدن", "دگرشنیدن"),
        (r"ژاک\s+لکنیدن", "ژاک لکان"),
        (r"ژاک\s+لاکان", "ژاک لکان"),
        (r"\bلاکان\b", "لکان"),
        (r"جورج\s+پومیه", "ژرار پومیه"),
        (r"ژرار\s+پومیه", "ژرار پومیه"),
        (r"\bدلتو\b", "دولتو"),
        (r"ربان\s+کابل\s+لکنین", "روان‌کاو لکانی"),
        (r"روان\s+کابلکنی\s+چیمونه", "روان‌کاو لکانی چگونه"),
        (r"یک\s+روانکار\b", "یک روان‌کاو"),
        (r"روانکار\s+و\s+مراجع", "روان‌کاو و مراجع"),
        (r"ر[بو]ان\s*کا[بو]ی", "روان‌کاوی"),
        (r"ر[بو]ان\s*کا[بو]ان", "روان‌کاوان"),
        (r"ر[بو]ان\s*کا[بو]\b", "روان‌کاو"),
        (r"روان\s*[پب]جوهی", "روان‌پژوهی"),
        (r"روان\s*پژوهی", "روان‌پژوهی"),
        (r"روان\s*پریشی", "روان‌پریشی"),
        (r"روان\s*نژندی", "روان‌نژندی"),
        (r"\bلکنی\b", "لکانی"),
        (r"\bلکانیست\b", "لکانی"),
        (r"سلامی\s+جوگوی\s+خوش\s+آشنایی", "سلامی چو بوی خوش آشنایی"),
        (r"شستومین", "شصتمین"),
        (r"شست و پنجامی", "شصت و پنجمین"),
        (r"\bشست و (اول|دوم|سوم|چهارم|پنجم|ششم|هفتم|هشتم|نهم)(ین)?\b", r"شصت و \1\2"),
        (r"همیهنان", "هم‌میهنان"),
        (r"همه‌گی", "همگی"),
        (r"فصل\s+بحار", "فصل بهار"),
        (r"پارتی\s+زبانان", "پارسی‌زبانان"),
        (r"می‌?تمام\s+گفت", "می‌توان گفت"),
        (r"شراعت\s+بوهرانی", "شرایط بحرانی"),
        (r"شراعت", "شرایط"),
        (r"بوهرانی", "بحرانی"),
        (r"شراکعی", "شرایطی"),
        (r"گویزی", "گریزی"),
        (r"دروع", "دروغ"),
        (r"دریق", "دریغ"),
        (r"نامگزاری", "نام‌گذاری"),
        (r"جنابای\s+دکتر", "جناب آقای دکتر"),
        (r"آرز\s+اومندم", "آرزومندم"),
        (r"آقای\s+مکارم(?=\s|[،.؟!]|$)", "آقای مکارمی"),
        (r"دکتر\s+حسن\s+مکارم(?=\s|[،.؟!]|$)", "دکتر حسن مکارمی"),
        (r"دکتر\s+مکارم(?=\s|[،.؟!]|$)", "دکتر مکارمی"),
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
            "Françoise Dolto, Gérard Pommier, Écouter autrement, Opération Nom-du-Père, "
            "État limite, Nœud borroméen, Le Symbolique, L'Imaginaire, Le Réel, "
            "Hafez de Chiraz, Terre culturelle de l'Iran, calligraphie persane, LDDHI, Khavaran."
        )
    return (
        "سخنرانی دکتر حسن مکارمی: سلامی چو بوی خوش آشنایی، در روان‌پژوهی، نگاه روان‌کاو، "
        "روان‌کاوی لکانی، ژاک لکان، فروید، فرانسواز دولتو، ژرار پومیه، دگرشنیدن، "
        "عملیات نام پدر، حالت مرزی، روان‌پریشی، روان‌نژندی، گره بورومه‌ای، ساحت نمادین، "
        "ساحت خیالی، ساحت واقعی، تورس، فورکلوژن، حافظ شیرازی، سرزمین فرهنگی ایران، دادخواهی، خاوران."
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


def strip_rolling_overlap(prev_text: str, curr_text: str) -> str:
    """Removes rolling 2-line YouTube VTT overlap where suffix of prev_text repeats as prefix of curr_text."""
    if not prev_text or not curr_text:
        return curr_text
    if curr_text == prev_text:
        return ""
    if curr_text.startswith(prev_text):
        return curr_text[len(prev_text) :].strip()

    prev_words = prev_text.split()
    curr_words = curr_text.split()
    max_k = min(len(prev_words), len(curr_words), 20)
    for k in range(max_k, 1, -1):
        if prev_words[-k:] == curr_words[:k]:
            return " ".join(curr_words[k:]).strip()
    return curr_text


def dedupe_rolling_segments(segments, lang: str):
    cleaned = []
    rolling_window = ""
    for seg in segments:
        raw_txt = normalize_persian(seg.get("text", "")) if lang == "fa" else str(seg.get("text", "")).strip()
        if not raw_txt:
            continue
        dedup = strip_rolling_overlap(rolling_window, raw_txt)
        rolling_window = raw_txt
        if not dedup:
            continue
        cleaned.append(
            {
                "startSec": seg.get("startSec", 0.0),
                "endSec": seg.get("endSec", 0.0),
                "text": dedup,
            }
        )
    return cleaned


def parse_vtt_to_segments(vtt_text: str, lang: str):
    if not vtt_text:
        return []
    body = re.sub(r"^WEBVTT[^\n]*\n+", "", vtt_text, flags=re.IGNORECASE)
    blocks = [b.strip() for b in re.split(r"\r?\n\s*\r?\n", body) if b.strip()]

    def to_sec(raw: str) -> float:
        clean = raw.strip().replace(",", ".").split(" ")[0]
        parts = [float(p) for p in clean.split(":")]
        if len(parts) == 3:
            return parts[0] * 3600 + parts[1] * 60 + parts[2]
        if len(parts) == 2:
            return parts[0] * 60 + parts[1]
        return 0.0

    raw_segments = []
    for block in blocks:
        lines = [ln.strip() for ln in block.splitlines() if ln.strip()]
        time_idx = next((i for i, ln in enumerate(lines) if "-->" in ln), -1)
        if time_idx < 0:
            continue
        start_raw, end_raw = lines[time_idx].split("-->", 1)
        raw_txt = " ".join(lines[time_idx + 1 :])
        raw_txt = re.sub(r"<\d{2}:\d{2}:\d{2}\.\d{3}>", "", raw_txt)
        raw_txt = re.sub(r"<[^>]+>", " ", raw_txt)
        cleaned = re.sub(r"\s+", " ", html.unescape(raw_txt)).strip()
        if not cleaned or cleaned in ("[Music]", "[موسیقی]", "[Musique]", "[Applause]"):
            continue
        start_sec = round(to_sec(start_raw), 2)
        end_sec = round(max(start_sec + 0.5, to_sec(end_raw)), 2)
        raw_segments.append({"startSec": start_sec, "endSec": end_sec, "text": cleaned})

    return dedupe_rolling_segments(raw_segments, lang)


def check_yt_dlp_error(stderr_text: str):
    lower = (stderr_text or "").lower()
    if "429" in lower or "too many requests" in lower or "confirm you’re not a bot" in lower or "confirm you're not a bot" in lower:
        raise YouTubeRateLimitError(stderr_text.strip())
    if "private video" in lower or "video unavailable" in lower or "this video has been removed" in lower:
        raise YouTubeUnavailableError(stderr_text.strip())


def try_fetch_matching_captions(
    youtube_id: str,
    lang: str,
    work_dir: Path,
    cookies_from_browser: str = "",
    cookies_file: str = "",
    sleep_sec: int = 4,
):
    url = f"https://www.youtube.com/watch?v={youtube_id}"
    out_tpl = str(work_dir / f"{youtube_id}.%(ext)s")
    sub_langs = "fa,fa-IR" if lang == "fa" else ("fr,fr-FR" if lang == "fr" else "en,en-GB,en-US")

    cmd = [
        sys.executable,
        "-m",
        "yt_dlp",
        "--skip-download",
        "--write-subs",
        "--write-auto-subs",
        "--sub-langs",
        sub_langs,
        "--sub-format",
        "vtt",
        "--js-runtimes",
        "node",
        "--sleep-requests",
        str(max(1, sleep_sec)),
        "--no-warnings",
        "-o",
        out_tpl,
    ]
    if cookies_from_browser:
        cmd.extend(["--cookies-from-browser", cookies_from_browser])
    elif cookies_file:
        cmd.extend(["--cookies", cookies_file])
    cmd.append(url)

    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        check_yt_dlp_error(proc.stderr or proc.stdout)
        return []

    vtt_files = sorted(work_dir.glob(f"{youtube_id}*.vtt"))
    if not vtt_files:
        return []

    vtt_text = vtt_files[0].read_text(encoding="utf-8", errors="ignore")
    segments = parse_vtt_to_segments(vtt_text, lang)
    if not segments:
        return []

    joined_sample = " ".join(s["text"] for s in segments[:25])
    if lang == "fa":
        persian_chars = len(re.findall(r"[\u0600-\u06FF]", joined_sample))
        if persian_chars < 40:
            return []
    return segments


def download_raw_audio(
    youtube_id: str,
    work_dir: Path,
    cookies_from_browser: str = "",
    cookies_file: str = "",
    sleep_sec: int = 5,
) -> Path:
    url = f"https://www.youtube.com/watch?v={youtube_id}"
    raw_out = work_dir / f"{youtube_id}.%(ext)s"

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
        "--no-warnings",
    ]
    if cookies_from_browser:
        yt_dlp_cmd.extend(["--cookies-from-browser", cookies_from_browser])
    elif cookies_file:
        yt_dlp_cmd.extend(["--cookies", cookies_file])
    yt_dlp_cmd.extend(["-o", str(raw_out), url])

    proc = subprocess.run(yt_dlp_cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        check_yt_dlp_error(proc.stderr or proc.stdout)
        raise RuntimeError((proc.stderr or proc.stdout or f"yt-dlp exit {proc.returncode}").strip())

    downloaded = [p for p in work_dir.glob(f"{youtube_id}.*") if p.suffix not in (".wav", ".mp3", ".vtt", ".part")]
    if not downloaded:
        raise RuntimeError(f"yt-dlp produced no audio file for {youtube_id}")
    return downloaded[0]


def get_audio_duration_sec(audio_path: Path) -> float:
    proc = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(audio_path),
        ],
        capture_output=True,
        text=True,
    )
    try:
        return float((proc.stdout or "0").strip())
    except ValueError:
        return 0.0


def slice_audio_to_mp3_chunks(raw_audio: Path, work_dir: Path, chunk_sec: int = 1500):
    """
    Compresses audio to 16kHz mono 48kbps MP3 (~0.36 MB/min, so 25 min = ~9 MB, well under 25 MB limit)
    and returns list of (offset_sec, mp3_path).
    """
    total_dur = get_audio_duration_sec(raw_audio)
    if total_dur <= chunk_sec + 60:
        mp3_out = work_dir / "chunk_000.mp3"
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(raw_audio),
                "-ac",
                "1",
                "-ar",
                "16000",
                "-b:a",
                "48k",
                "-vn",
                str(mp3_out),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return [(0.0, mp3_out)], total_dur

    chunks = []
    offset = 0.0
    idx = 0
    while offset < total_dur:
        mp3_out = work_dir / f"chunk_{idx:03d}.mp3"
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-ss",
                str(offset),
                "-t",
                str(chunk_sec),
                "-i",
                str(raw_audio),
                "-ac",
                "1",
                "-ar",
                "16000",
                "-b:a",
                "48k",
                "-vn",
                str(mp3_out),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        if mp3_out.exists() and mp3_out.stat().st_size > 1000:
            chunks.append((offset, mp3_out))
        offset += chunk_sec
        idx += 1
    return chunks, total_dur


def post_multipart_transcription(endpoint_url: str, api_key: str, fields: dict, file_path: Path):
    boundary = f"----MakaremiBoundary{int(time.time() * 1000)}"
    body_parts = []
    for k, v in fields.items():
        if v is None or v == "":
            continue
        body_parts.append(
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="{k}"\r\n\r\n'
            f"{v}\r\n".encode("utf-8")
        )

    file_bytes = file_path.read_bytes()
    body_parts.append(
        (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="file"; filename="{file_path.name}"\r\n'
            f"Content-Type: audio/mpeg\r\n\r\n"
        ).encode("utf-8")
        + file_bytes
        + b"\r\n"
    )
    body_parts.append(f"--{boundary}--\r\n".encode("utf-8"))
    payload = b"".join(body_parts)

    req = urllib.request.Request(
        endpoint_url,
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "User-Agent": "MakaremiArchiveASR/1.0",
        },
    )

    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=240) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="ignore")
            if e.code == 429:
                retry_after = e.headers.get("Retry-After")
                # Check if daily audio-seconds limit is hit (retry > 120s)
                wait_sec = int(retry_after) if retry_after and retry_after.isdigit() else 15
                lower_body = err_body.lower()
                if "per day" in lower_body or "asd" in lower_body or wait_sec > 180:
                    raise CloudQuotaExhaustedError(
                        f"HTTP 429 Cloud daily/hourly audio quota reached (retry_after={retry_after}s): {err_body[:300]}"
                    )
                if attempt < 3:
                    print(f"  [API 429] Polite pause {wait_sec + 2}s before retry {attempt + 1}/3...", flush=True)
                    time.sleep(wait_sec + 2)
                    continue
                raise CloudQuotaExhaustedError(f"HTTP 429 after retries: {err_body[:300]}")
            if e.code in (401, 402, 403):
                raise CloudQuotaExhaustedError(f"HTTP {e.code} auth/billing error: {err_body[:300]}")
            if attempt < 2 and e.code >= 500:
                time.sleep(5 * (attempt + 1))
                continue
            raise RuntimeError(f"HTTP {e.code}: {err_body[:300]}")


def transcribe_via_cloud_api(
    provider: str,
    model_name: str,
    api_key: str,
    raw_audio: Path,
    lang: str,
    work_dir: Path,
):
    endpoint = (
        "https://api.groq.com/openai/v1/audio/transcriptions"
        if provider == "groq"
        else "https://api.openai.com/v1/audio/transcriptions"
    )
    chunks, total_dur = slice_audio_to_mp3_chunks(raw_audio, work_dir, chunk_sec=1500)
    all_segments = []

    for offset_sec, mp3_path in chunks:
        resp_fmt = "verbose_json" if (provider == "groq" or model_name == "whisper-1") else "json"
        fields = {
            "model": model_name,
            "language": lang if lang in ("fa", "fr", "en") else "fa",
            "response_format": resp_fmt,
            "temperature": "0",
            "prompt": build_glossary_prompt(lang),
        }
        data = post_multipart_transcription(endpoint, api_key, fields, mp3_path)

        raw_segs = data.get("segments")
        if isinstance(raw_segs, list) and len(raw_segs) > 0:
            for s in raw_segs:
                txt = normalize_persian(s.get("text", "")) if lang == "fa" else str(s.get("text", "")).strip()
                if txt:
                    all_segments.append(
                        {
                            "startSec": round(offset_sec + float(s.get("start", 0.0)), 2),
                            "endSec": round(offset_sec + float(s.get("end", 0.0)), 2),
                            "text": txt,
                        }
                    )
        else:
            full_text = str(data.get("text", "")).strip()
            if full_text:
                txt = normalize_persian(full_text) if lang == "fa" else full_text
                all_segments.append(
                    {
                        "startSec": round(offset_sec, 2),
                        "endSec": round(offset_sec + min(1500.0, max(1.0, total_dur - offset_sec)), 2),
                        "text": txt,
                    }
                )

    return all_segments, total_dur


def save_json_atomic(path_obj: Path, data):
    tmp = path_obj.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(path_obj)


def install_dependencies():
    print("Installing yt-dlp and faster-whisper into current Python environment...")
    subprocess.run(
        [sys.executable, "-m", "pip", "install", "--upgrade", "yt-dlp", "faster-whisper"],
        check=True,
    )
    print("Setup complete. Verify ffmpeg is available:", shutil.which("ffmpeg"))


def main():
    load_dotenv_local()

    parser = argparse.ArgumentParser(description="Local + Cloud Resumable ASR for Dr. Makaremi videos")
    parser.add_argument("--setup", action="store_true", help="Install yt-dlp and faster-whisper")
    parser.add_argument("--provider", default="local", choices=["local", "groq", "openai"], help="ASR engine provider")
    parser.add_argument("--model", default="", help="Model name (default: large-v3-turbo local, whisper-large-v3 groq, whisper-1 openai)")
    parser.add_argument("--device", default="auto", choices=["auto", "cpu", "cuda"], help="Local execution device")
    parser.add_argument("--compute-type", default="auto", help="Local compute type (int8 CPU, float16 CUDA)")
    parser.add_argument("--beam-size", type=int, default=2, help="Local Whisper beam size")
    parser.add_argument("--cpu-threads", type=int, default=0, help="Local CPU threads (0 = auto)")
    parser.add_argument("--limit", type=int, default=0, help="Max videos to process in this run (0 = all)")
    parser.add_argument("--max-duration-sec", type=int, default=0, help="Skip videos longer than N seconds (0 = no cap)")
    parser.add_argument("--captions-only", action="store_true", help="Only harvest free YouTube captions")
    parser.add_argument("--no-prefer-captions", action="store_true", help="Force ASR even if YouTube captions exist")
    parser.add_argument("--reclean-existing", action="store_true", help="Re-run Persian phonetic normalizer over existing asr_verified records and exit")
    parser.add_argument("--only-id", default="", help="Transcribe a single specific YouTube video ID")
    parser.add_argument("--cookies-from-browser", default="", help="Browser name for yt-dlp (chrome, edge, firefox)")
    parser.add_argument("--cookies", default="", help="Optional Netscape cookies.txt path for yt-dlp")
    parser.add_argument("--sleep", type=int, default=4, help="Polite delay in seconds between YouTube requests")
    args = parser.parse_args()

    if args.setup:
        install_dependencies()
        return

    transcripts = json.loads(TRANSCRIPTS_FILE.read_text(encoding="utf-8")) if TRANSCRIPTS_FILE.exists() else {}

    if args.reclean_existing:
        updated = 0
        for key, rec in transcripts.items():
            if rec.get("sourceLang") == "fa" and rec.get("method") in ("asr_verified", "youtube_captions"):
                raw_segs = rec.get("segments") or []
                if rec.get("method") == "youtube_captions":
                    new_segs = dedupe_rolling_segments(raw_segs, "fa")
                else:
                    new_segs = [
                        {**s, "text": normalize_persian(s.get("text", ""))}
                        for s in raw_segs
                        if normalize_persian(s.get("text", ""))
                    ]
                if new_segs:
                    md, chaps = build_markdown_and_chapters(new_segs, "fa")
                    rec["segments"] = new_segs
                    rec["transcriptMarkdown"] = md
                    rec["chapters"] = chaps
                    rec["wordCount"] = len(md.split())
                else:
                    rec["transcriptMarkdown"] = normalize_persian(rec.get("transcriptMarkdown", ""))
                    rec["wordCount"] = len(rec["transcriptMarkdown"].split())
                updated += 1
        save_json_atomic(TRANSCRIPTS_FILE, transcripts)
        print(f"Re-normalized {updated} existing Persian transcripts cleanly.")
        return

    if not shutil.which("ffmpeg"):
        print("ERROR: ffmpeg is not on PATH.", file=sys.stderr)
        sys.exit(1)

    if not QUEUE_FILE.exists():
        print(f"Queue file missing ({QUEUE_FILE}). Run `node scripts/extract-youtube-transcripts.mjs` first.", file=sys.stderr)
        sys.exit(1)

    model_name = args.model.strip()
    if not model_name:
        if args.provider == "groq":
            model_name = "whisper-large-v3"
        elif args.provider == "openai":
            model_name = "whisper-1"
        else:
            model_name = "large-v3-turbo"

    api_key = ""
    if args.provider == "groq" and not args.captions_only:
        api_key = os.environ.get("GROQ_API_KEY", "").strip()
        if not api_key:
            print("ERROR: GROQ_API_KEY not found in .env.local or environment.", file=sys.stderr)
            sys.exit(1)
    elif args.provider == "openai" and not args.captions_only:
        api_key = os.environ.get("OPENAI_API_KEY", "").strip()
        if not api_key:
            print("ERROR: OPENAI_API_KEY not found in .env.local or environment.", file=sys.stderr)
            sys.exit(1)

    queue_data = json.loads(QUEUE_FILE.read_text(encoding="utf-8"))
    items = queue_data.get("items", [])
    skipped = json.loads(SKIPPED_FILE.read_text(encoding="utf-8")) if SKIPPED_FILE.exists() else {}

    if args.only_id:
        pending = [it for it in items if it["youtubeVideoId"] == args.only_id]
    else:
        pending = [
            it
            for it in items
            if it["youtubeVideoId"] not in transcripts and it["youtubeVideoId"] not in skipped
        ]
        if args.max_duration_sec > 0:
            pending = [it for it in pending if (it.get("durationSec") or 0) <= args.max_duration_sec]

    if args.limit > 0:
        pending = pending[: args.limit]

    if not pending:
        print("All eligible queued videos already have transcripts in transcripts/videos.json!")
        return

    local_model = None
    if args.provider == "local" and not args.captions_only:
        try:
            from faster_whisper import WhisperModel
        except ImportError:
            print("faster-whisper is not installed yet. Run: python scripts/transcribe-audio-asr.py --setup", file=sys.stderr)
            sys.exit(1)

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

        threads = args.cpu_threads if args.cpu_threads > 0 else min(8, os.cpu_count() or 4)
        print(
            f"Loading faster-whisper model={model_name} device={device} "
            f"compute_type={compute_type} cpu_threads={threads} beam_size={args.beam_size}...",
            flush=True,
        )
        local_model = WhisperModel(model_name, device=device, compute_type=compute_type, cpu_threads=threads)

    print(
        f"Ready! Provider={args.provider} model={model_name} | Processing {len(pending)} videos "
        f"(prefer_captions={not args.no_prefer_captions}, captions_only={args.captions_only}).",
        flush=True,
    )

    completed_captions = 0
    completed_asr = 0
    unavailable_count = 0
    failed = 0
    halted_reason = None

    for idx, item in enumerate(pending, start=1):
        yt_id = item["youtubeVideoId"]
        lang = item.get("sourceLang", "fa")
        title = item.get("titleFa", item.get("slug", yt_id))
        t0 = time.time()
        print(f"\n[{idx}/{len(pending)}] {yt_id} ({lang}, {item.get('durationSec', 0)}s) — {title}", flush=True)

        with tempfile.TemporaryDirectory(prefix="makaremi_asr_") as tmp:
            try:
                # Step A: Fast caption-first check unless disabled
                if not args.no_prefer_captions:
                    cap_segments = try_fetch_matching_captions(
                        yt_id,
                        lang,
                        Path(tmp),
                        cookies_from_browser=args.cookies_from_browser,
                        cookies_file=args.cookies,
                        sleep_sec=args.sleep,
                    )
                    if cap_segments:
                        markdown, chapters = build_markdown_and_chapters(cap_segments, lang)
                        wc = len(markdown.split())
                        if wc >= 35:
                            transcripts[yt_id] = {
                                "key": yt_id,
                                "sourceLang": lang,
                                "method": "youtube_captions",
                                "durationSec": int(cap_segments[-1]["endSec"] or item.get("durationSec") or 0),
                                "wordCount": wc,
                                "chapters": chapters,
                                "segments": cap_segments,
                                "transcriptMarkdown": markdown,
                                "updatedAt": datetime.now(timezone.utc).isoformat(),
                            }
                            save_json_atomic(TRANSCRIPTS_FILE, transcripts)
                            completed_captions += 1
                            print(
                                f"  OK [CAPTION]: {len(cap_segments)} segments, {wc} words "
                                f"in {time.time() - t0:.1f}s (saved checkpoint)",
                                flush=True,
                            )
                            time.sleep(max(1, args.sleep))
                            continue

                if args.captions_only:
                    print("  SKIP [captions-only]: no matching YouTube caption track.", flush=True)
                    time.sleep(max(1, args.sleep))
                    continue

                # Step B: Download lightweight audio + transcribe via Cloud API or Local Whisper
                raw_audio = download_raw_audio(
                    yt_id,
                    Path(tmp),
                    cookies_from_browser=args.cookies_from_browser,
                    cookies_file=args.cookies,
                    sleep_sec=args.sleep,
                )

                if args.provider in ("groq", "openai"):
                    segments, actual_dur = transcribe_via_cloud_api(
                        args.provider, model_name, api_key, raw_audio, lang, Path(tmp)
                    )
                else:
                    wav_out = Path(tmp) / f"{yt_id}.wav"
                    subprocess.run(
                        ["ffmpeg", "-y", "-i", str(raw_audio), "-ac", "1", "-ar", "16000", "-vn", str(wav_out)],
                        check=True,
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                    )
                    seg_iter, info = local_model.transcribe(
                        str(wav_out),
                        language=lang if lang in ("fa", "fr", "en") else "fa",
                        beam_size=args.beam_size,
                        vad_filter=True,
                        vad_parameters={"min_silence_duration_ms": 600},
                        condition_on_previous_text=False,
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
                    actual_dur = float(info.duration or item.get("durationSec") or 0)

                markdown, chapters = build_markdown_and_chapters(segments, lang)
                if len(markdown.strip()) < 60:
                    print(f"  WARN: Transcript too short ({len(markdown)} chars); skipping save.", flush=True)
                    failed += 1
                    continue

                transcripts[yt_id] = {
                    "key": yt_id,
                    "sourceLang": lang,
                    "method": "asr_verified",
                    "durationSec": int(actual_dur or item.get("durationSec") or 0),
                    "wordCount": len(markdown.split()),
                    "chapters": chapters,
                    "segments": segments,
                    "transcriptMarkdown": markdown,
                    "updatedAt": datetime.now(timezone.utc).isoformat(),
                }
                save_json_atomic(TRANSCRIPTS_FILE, transcripts)
                completed_asr += 1
                print(
                    f"  OK [{args.provider.upper()}]: {len(segments)} segments, {transcripts[yt_id]['wordCount']} words "
                    f"in {time.time() - t0:.1f}s (saved checkpoint)",
                    flush=True,
                )
                time.sleep(max(1, args.sleep))

            except YouTubeRateLimitError as rl_err:
                halted_reason = "youtube_rate_limit"
                print(
                    f"\n  HALT [YOUTUBE RATE-LIMIT]: Stopping cleanly with all checkpoints saved.\n  Detail: {rl_err}",
                    file=sys.stderr,
                    flush=True,
                )
                break
            except CloudQuotaExhaustedError as q_err:
                halted_reason = "cloud_quota"
                print(
                    f"\n  HALT [CLOUD QUOTA]: Cloud API quota/billing limit reached. All completed videos are safely saved!\n  Detail: {q_err}",
                    file=sys.stderr,
                    flush=True,
                )
                break
            except YouTubeUnavailableError as unavail_err:
                unavailable_count += 1
                skipped[yt_id] = {
                    "youtubeVideoId": yt_id,
                    "slug": item.get("slug"),
                    "reason": str(unavail_err)[:240],
                    "checkedAt": datetime.now(timezone.utc).isoformat(),
                }
                save_json_atomic(SKIPPED_FILE, skipped)
                print(f"  UNAVAILABLE: recorded {yt_id} in asr-skipped-unavailable.json", flush=True)
            except Exception as exc:
                failed += 1
                print(f"  ERROR on {yt_id}: {exc}", file=sys.stderr, flush=True)

    print(
        f"\n=== ASR RUN SUMMARY: provider={args.provider}, captions={completed_captions}, asr={completed_asr}, "
        f"unavailable={unavailable_count}, failed={failed}, halted={halted_reason}, "
        f"total_saved={len(transcripts)} ===",
        flush=True,
    )


if __name__ == "__main__":
    main()
