#!/usr/bin/env node
/**
 * Layer 0 + Layer 1 Video Transcript Extractor & Health Auditor (MAKAREMI-CORE-2026)
 * - NEVER mutates packages/shared/src/data/vault/videos.json (100% immutable vault)
 * - Layer 0: Promotes all real editorial transcripts from vault/videos.json (deduped by youtube_video_id)
 * - Layer 1: Extracts timed captionTracks directly from YouTube (0 cost) for all captioned videos
 * - Health Audit: Writes packages/shared/src/data/curator-overlays/video-health-manifest.json
 * - ASR Queue: Emits packages/shared/src/data/transcripts/asr-pending-queue.json for Wave 2 Option A local ASR
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const VAULT_VIDEOS_PATH = path.join(ROOT, 'packages/shared/src/data/vault/videos.json');
const GLOSSARY_LOCK_PATH = path.join(ROOT, 'packages/shared/src/data/glossary-lock.json');
const TRANSCRIPTS_DIR = path.join(ROOT, 'packages/shared/src/data/transcripts');
const TRANSCRIPTS_OUT_PATH = path.join(TRANSCRIPTS_DIR, 'videos.json');
const ASR_QUEUE_PATH = path.join(TRANSCRIPTS_DIR, 'asr-pending-queue.json');
const OVERLAYS_DIR = path.join(ROOT, 'packages/shared/src/data/curator-overlays');
const HEALTH_MANIFEST_PATH = path.join(OVERLAYS_DIR, 'video-health-manifest.json');

const CONCURRENCY = 5;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// ---------------------------------------------------------------------------
// Persian Normalizer + Glossary Lock (canonical spellings)
// ---------------------------------------------------------------------------
function normalizePersian(text) {
  if (!text) return '';
  let out = String(text)
    .replace(/\u064A/g, '\u06CC') // Arabic yeh -> Persian yeh
    .replace(/\u0643/g, '\u06A9') // Arabic kaf -> Persian kaf
    .replace(/\u0640/g, '')       // tatweel
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]{2,}/g, ' ');

  // Fix common ZWNJ prefixes/suffixes (می‌ / نمی‌ / ها)
  out = out.replace(/\b(ن?می)\s+([\u0600-\u06FF]{2,})/g, '$1\u200C$2');
  out = out.replace(/([\u0600-\u06FF])\s+(ها|های|هایی|هایش|هایم|هایتان)\b/g, '$1\u200C$2');

  // Common ASR / caption typos for Dr. Makaremi's core terminology
  const corrections = [
    [/دگر\s*شنیدن/g, 'دگرشنیدن'],
    [/دیگر\s*شنیدن/g, 'دگرشنیدن'],
    [/ژاک\s+لاکان/g, 'ژاک لکان'],
    [/روان\s*کاوی/g, 'روان‌کاوی'],
    [/روان\s*پریشی/g, 'روان‌پریشی'],
    [/روان\s*نژندی/g, 'روان‌نژندی'],
    [/روان\s*پژوهی/g, 'روان‌پژوهی'],
    [/حسن\s+مکارمی/g, 'حسن مکارمی'],
    [/دکتر\s+مکارمی/g, 'دکتر مکارمی'],
    [/سرزمین\s+فرهنگی\s+ایران/g, 'سرزمین فرهنگی ایران'],
    [/عملیات\s+نام\s+پدر/g, 'عملیات نام پدر'],
    [/گره\s+برومه\s*ای/g, 'گره بورومه‌ای'],
    [/گره\s+بورومه\s*ای/g, 'گره بورومه‌ای'],
    [/حالت\s+مرزی/g, 'حالت مرزی'],
  ];
  for (const [pattern, replacement] of corrections) {
    out = out.replace(pattern, replacement);
  }
  return out.trim();
}

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function formatTimestamp(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rem = s % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function isSubstantiveTranscript(raw) {
  if (!raw || typeof raw !== 'string') return false;
  // Strip raw URLs so link-list posts like negahkhodkoshi don't count as real transcripts
  const withoutUrls = raw.replace(/https?:\/\/\S+/gi, '').replace(/\s+/g, ' ').trim();
  return withoutUrls.length >= 300;
}

function detectVideoLang(video) {
  const first = video.translations?.[0];
  const sample = `${first?.title || ''} ${first?.description || ''}`;
  if (/[\u0600-\u06FF]/.test(sample)) return 'fa';
  const code = (first?.languages_code || '').slice(0, 2).toLowerCase();
  if (code === 'fr' || code === 'en' || code === 'fa') return code;
  return 'fa';
}

function buildParagraphMarkdownFromSegments(segments, lang) {
  if (!segments || segments.length === 0) return { markdown: '', chapters: [] };
  const paragraphs = [];
  const chapters = [];
  let bucket = [];
  let bucketStart = segments[0].startSec;
  let lastChapterSec = -999;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const cleanText = lang === 'fa' ? normalizePersian(seg.text) : seg.text.trim();
    if (!cleanText) continue;

    if (bucket.length === 0) {
      bucketStart = seg.startSec;
    }
    bucket.push(cleanText);

    const joined = bucket.join(' ');
    const elapsed = seg.endSec - bucketStart;
    const isLast = i === segments.length - 1;
    const endsSentence = /[.!?؟…]$/.test(cleanText);

    if (isLast || (elapsed >= 42 && (endsSentence || joined.length >= 380)) || joined.length >= 520) {
      const stamp = formatTimestamp(bucketStart);
      paragraphs.push(`**[${stamp}]** ${joined}`);
      if (bucketStart - lastChapterSec >= 300 || chapters.length === 0) {
        const snippet = joined.split(/\s+/).slice(0, 9).join(' ');
        chapters.push({ startSec: Math.floor(bucketStart), title: snippet });
        lastChapterSec = bucketStart;
      }
      bucket = [];
    }
  }

  return {
    markdown: paragraphs.join('\n\n'),
    chapters: chapters.slice(0, 12),
  };
}

function extractBalancedJson(str, marker, openChar = '[', closeChar = ']') {
  const markerIdx = str.indexOf(marker);
  if (markerIdx < 0) return null;
  const start = str.indexOf(openChar, markerIdx + marker.length);
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < str.length; i++) {
    const ch = str[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === openChar) {
      depth++;
    } else if (ch === closeChar) {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(str.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// YouTube Watch HTML Metadata & Caption Track Fetcher (+ yt-dlp fallback)
// ---------------------------------------------------------------------------
async function fetchYoutubePlayerInfo(videoId) {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en&bpctr=9999999999`, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'en-US,en;q=0.9,fa;q=0.8,fr;q=0.7',
        Cookie: 'CONSENT=YES+cb.20210328-17-p0.en+FX+667; SOCS=CAI',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const playability = extractBalancedJson(html, '"playabilityStatus":', '{', '}');
    const lenMatch = html.match(/"lengthSeconds":"(\d+)"/);
    const captionTracks = extractBalancedJson(html, '"captionTracks":', '[', ']') || [];

    return {
      playabilityStatus: {
        status: playability?.status || 'UNKNOWN',
        reason:
          playability?.reason ||
          playability?.errorScreen?.playerErrorMessageRenderer?.reason?.simpleText ||
          '',
      },
      videoDetails: {
        lengthSeconds: lenMatch?.[1] || '0',
      },
      captions: {
        playerCaptionsTracklistRenderer: {
          captionTracks,
        },
      },
    };
  } catch {
    return null;
  }
}

function parseVttToSegments(vttText) {
  if (!vttText) return [];
  const blocks = vttText
    .replace(/^WEBVTT[^\n]*\n+/i, '')
    .split(/\r?\n\s*\r?\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  const toSec = (raw) => {
    const clean = raw.trim().replace(',', '.').split(' ')[0];
    const parts = clean.split(':').map((n) => Number(n));
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
  };

  const segments = [];
  let prevText = '';
  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const timeIdx = lines.findIndex((l) => l.includes('-->'));
    if (timeIdx < 0) continue;
    const [startRaw, endRaw] = lines[timeIdx].split('-->');
    const cleaned = decodeHtmlEntities(
      lines
        .slice(timeIdx + 1)
        .join(' ')
        .replace(/<\d{2}:\d{2}:\d{2}\.\d{3}>/g, '')
        .replace(/<[^>]+>/g, ' ')
    )
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleaned || cleaned === prevText || cleaned === '[Music]' || cleaned === '[موسیقی]') continue;
    // Strip overlapping karaoke prefix from rolling auto-captions
    const dedupText = prevText && cleaned.startsWith(prevText) ? cleaned.slice(prevText.length).trim() : cleaned;
    prevText = cleaned;
    if (!dedupText) continue;
    const startSec = Number(toSec(startRaw).toFixed(2));
    const endSec = Number(Math.max(startSec + 0.5, toSec(endRaw)).toFixed(2));
    segments.push({ startSec, endSec, text: dedupText });
  }
  return segments;
}

const COOKIES_FROM_BROWSER = process.env.YT_COOKIES_FROM_BROWSER || '';
const COOKIES_FILE = process.env.YT_COOKIES_FILE || '';

async function downloadCaptionViaYtDlp(videoId, langCode) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mkm-sub-'));
  try {
    const outTpl = path.join(tmpDir, `${videoId}.%(ext)s`);
    const args = [
      '-m',
      'yt_dlp',
      '--skip-download',
      '--write-subs',
      '--write-auto-subs',
      '--js-runtimes',
      'node',
      '--sleep-requests',
      '4',
      '--sub-langs',
      `${langCode},${langCode.slice(0, 2)}`,
      '--sub-format',
      'vtt',
      '--quiet',
      '--no-warnings',
    ];
    if (COOKIES_FROM_BROWSER) {
      args.push('--cookies-from-browser', COOKIES_FROM_BROWSER);
    } else if (COOKIES_FILE) {
      args.push('--cookies', COOKIES_FILE);
    }
    args.push('-o', outTpl, `https://www.youtube.com/watch?v=${videoId}`);
    await execFileAsync('python', args, { timeout: 30000 });
    const files = fs.readdirSync(tmpDir).filter((f) => f.endsWith('.vtt'));
    if (files.length === 0) return [];
    const content = fs.readFileSync(path.join(tmpDir, files[0]), 'utf8');
    return parseVttToSegments(content);
  } catch {
    return [];
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function chooseBestCaptionTrack(tracks, videoLang) {
  if (!Array.isArray(tracks) || tracks.length === 0) return null;

  const scoreTrack = (t) => {
    const code = (t.languageCode || '').toLowerCase();
    const isAsr = t.kind === 'asr';
    const matchesPrimary = code === videoLang || code.startsWith(`${videoLang}-`);
    if (matchesPrimary && !isAsr) return 100;
    if (matchesPrimary && isAsr) return 85;
    if (!isAsr && (code.startsWith('fa') || code.startsWith('fr') || code.startsWith('en'))) return 60;
    return 0;
  };

  const ranked = tracks
    .map((t) => ({ track: t, score: scoreTrack(t) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.track || null;
}

async function downloadCaptionSegments(trackUrl, videoId, langCode) {
  if (trackUrl) {
    const cleanUrl = trackUrl.replace(/\\u0026/g, '&');
    const sep = cleanUrl.includes('?') ? '&' : '?';
    const json3Url = cleanUrl.includes('fmt=')
      ? cleanUrl.replace(/fmt=[^&]+/, 'fmt=json3')
      : `${cleanUrl}${sep}fmt=json3`;

    try {
      const res = await fetch(json3Url, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(12000),
      });
      if (res.ok) {
        const text = await res.text();
        if (text.trim().startsWith('{')) {
          const parsed = JSON.parse(text);
          const events = Array.isArray(parsed.events) ? parsed.events : [];
          const segments = [];
          for (const ev of events) {
            if (!Array.isArray(ev.segs)) continue;
            const segText = decodeHtmlEntities(ev.segs.map((s) => s.utf8 || '').join(''))
              .replace(/\s+/g, ' ')
              .trim();
            if (!segText || segText === '[Music]' || segText === '[موسیقی]') continue;
            const startSec = Number(((ev.tStartMs || 0) / 1000).toFixed(2));
            const durSec = Number(((ev.dDurationMs || 2500) / 1000).toFixed(2));
            segments.push({
              startSec,
              endSec: Number((startSec + Math.max(0.5, durSec)).toFixed(2)),
              text: segText,
            });
          }
          if (segments.length > 0) return segments;
        }
      }
    } catch {
      // Fallback below
    }

    try {
      const res = await fetch(cleanUrl, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(12000),
      });
      if (res.ok) {
        const xml = await res.text();
        const segments = [];
        const regex = /<text\s+start="([\d.]+)"(?:\s+dur="([\d.]+)")?[^>]*>([\s\S]*?)<\/text>/g;
        let m;
        while ((m = regex.exec(xml)) !== null) {
          const startSec = Number(Number(m[1]).toFixed(2));
          const durSec = Number(Number(m[2] || 2.5).toFixed(2));
          const segText = decodeHtmlEntities(m[3].replace(/<[^>]+>/g, ' '))
            .replace(/\s+/g, ' ')
            .trim();
          if (!segText) continue;
          segments.push({
            startSec,
            endSec: Number((startSec + Math.max(0.5, durSec)).toFixed(2)),
            text: segText,
          });
        }
        if (segments.length > 0) return segments;
      }
    } catch {
      // Fallback to yt-dlp
    }
  }

  // Reliable yt-dlp subtitle extractor fallback (handles YouTube timedtext PO-token requirements)
  if (videoId && langCode) {
    return downloadCaptionViaYtDlp(videoId, langCode);
  }
  return [];
}

async function runPool(items, limit, worker) {
  const results = new Array(items.length);
  let nextIdx = 0;

  async function runner() {
    while (nextIdx < items.length) {
      const idx = nextIdx++;
      results[idx] = await worker(items[idx], idx);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => runner());
  await Promise.all(workers);
  return results;
}

async function main() {
  const startedAt = Date.now();
  const videos = JSON.parse(fs.readFileSync(VAULT_VIDEOS_PATH, 'utf8'));
  const existingPack = fs.existsSync(TRANSCRIPTS_OUT_PATH)
    ? JSON.parse(fs.readFileSync(TRANSCRIPTS_OUT_PATH, 'utf8'))
    : {};

  // Ensure glossary lock exists (sanity check)
  if (!fs.existsSync(GLOSSARY_LOCK_PATH)) {
    throw new Error(`Missing glossary lock at ${GLOSSARY_LOCK_PATH}`);
  }

  // Group records by youtube_video_id to deduplicate & preserve best editorial text
  const byYtId = new Map();
  const nonYoutubeVideos = [];

  for (const v of videos) {
    const ytId = v.youtube_video_id?.trim();
    if (ytId) {
      if (!byYtId.has(ytId)) byYtId.set(ytId, []);
      byYtId.get(ytId).push(v);
    } else {
      nonYoutubeVideos.push(v);
    }
  }

  console.log(
    `Loaded ${videos.length} vault videos (${byYtId.size} unique YouTube IDs, ${nonYoutubeVideos.length} non-YouTube records).`
  );

  const transcriptsPack = { ...existingPack };
  const nowIso = new Date().toISOString();

  // Layer 0: Promote all substantive vault_editorial transcripts first
  let layer0Count = 0;
  for (const [ytId, group] of byYtId.entries()) {
    let bestText = '';
    let bestLang = 'fa';
    for (const rec of group) {
      for (const tr of rec.translations || []) {
        if (isSubstantiveTranscript(tr.transcript_markdown) && tr.transcript_markdown.length > bestText.length) {
          bestText = tr.transcript_markdown;
          bestLang = (tr.languages_code || '').toLowerCase().startsWith('fr')
            ? 'fr'
            : (tr.languages_code || '').toLowerCase().startsWith('en')
              ? 'en'
              : 'fa';
        }
      }
    }
    if (bestText) {
      const cleaned = bestLang === 'fa' ? normalizePersian(bestText) : bestText.trim();
      const existing = transcriptsPack[ytId];
      // Preserve professor_edited or already timed asr_verified if present, else write vault_editorial
      if (!existing || existing.method !== 'professor_edited') {
        transcriptsPack[ytId] = {
          key: ytId,
          sourceLang: bestLang,
          method: 'vault_editorial',
          durationSec: existing?.durationSec,
          wordCount: countWords(cleaned),
          chapters: existing?.chapters || [],
          segments: existing?.segments || [],
          transcriptMarkdown: cleaned,
          updatedAt: nowIso,
        };
      }
      layer0Count++;
    }
  }
  console.log(`Layer 0 (vault_editorial): ${layer0Count} unique YouTube IDs indexed.`);

  // Layer 1 + Live Health Audit over all 235 unique YouTube IDs
  const uniqueIds = Array.from(byYtId.keys());
  const byYoutubeHealth = {};
  const bySlugHealth = {};
  const flaggedForStudio = [];
  const asrPendingQueue = [];

  let okCount = 0;
  let privateOrUnavailableCount = 0;
  let captionsExtractedCount = 0;
  let captionsMatchedExistingEditorial = 0;
  let processed = 0;

  await runPool(uniqueIds, CONCURRENCY, async (ytId) => {
    const group = byYtId.get(ytId);
    const primaryVideo = group[0];
    const videoLang = detectVideoLang(primaryVideo);
    const titleFa =
      primaryVideo.translations?.find((t) => (t.languages_code || '').startsWith('fa'))?.title ||
      primaryVideo.translations?.[0]?.title ||
      primaryVideo.slug;

    const player = await fetchYoutubePlayerInfo(ytId);
    const statusRaw = player?.playabilityStatus?.status || 'UNKNOWN';
    const reasonRaw =
      player?.playabilityStatus?.reason ||
      player?.playabilityStatus?.messages?.join(' ') ||
      '';
    const durationSec = Number(player?.videoDetails?.lengthSeconds || 0) || null;
    const rawTracks = player?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
    const captionLangs = rawTracks.map((t) => `${t.languageCode}${t.kind === 'asr' ? ':asr' : ''}`);

    let healthStatus = 'ok';
    if (statusRaw !== 'OK') {
      const lower = `${statusRaw} ${reasonRaw}`.toLowerCase();
      if (lower.includes('private')) {
        healthStatus = 'private';
      } else if (statusRaw === 'ERROR' || statusRaw === 'UNPLAYABLE' || statusRaw === 'LOGIN_REQUIRED') {
        healthStatus = 'unavailable';
      }
    }

    if (healthStatus === 'ok') {
      okCount++;
    } else {
      privateOrUnavailableCount++;
    }

    const entry = {
      slug: primaryVideo.slug,
      youtubeVideoId: ytId,
      status: healthStatus,
      reason: reasonRaw || (healthStatus === 'ok' ? undefined : statusRaw),
      titleFa,
      durationSec,
      hasCaptions: rawTracks.length > 0,
      captionLangs,
      checkedAt: nowIso,
    };

    byYoutubeHealth[ytId] = entry;
    for (const rec of group) {
      bySlugHealth[rec.slug] = { ...entry, slug: rec.slug };
    }
    if (healthStatus !== 'ok') {
      for (const rec of group) {
        flaggedForStudio.push({
          ...entry,
          slug: rec.slug,
          titleFa:
            rec.translations?.find((t) => (t.languages_code || '').startsWith('fa'))?.title ||
            rec.translations?.[0]?.title ||
            rec.slug,
        });
      }
    }

    // Attach durationSec to any existing Layer 0 record
    if (transcriptsPack[ytId] && durationSec) {
      transcriptsPack[ytId].durationSec = durationSec;
    }

    // Attempt Layer 1 caption extraction for healthy videos
    if (healthStatus === 'ok') {
      const bestTrack = chooseBestCaptionTrack(rawTracks, videoLang);
      const hasEditorial = transcriptsPack[ytId]?.method === 'vault_editorial';
      const hasVerifiedAsr =
        transcriptsPack[ytId]?.method === 'asr_verified' ||
        transcriptsPack[ytId]?.method === 'professor_edited';

      if (bestTrack && !hasVerifiedAsr) {
        const segments = await downloadCaptionSegments(bestTrack.baseUrl, ytId, bestTrack.languageCode);
        if (segments.length > 0) {
          const trackLang = (bestTrack.languageCode || videoLang).slice(0, 2).toLowerCase();
          const normalizedLang = trackLang === 'fr' || trackLang === 'en' ? trackLang : 'fa';

          if (hasEditorial) {
            // Keep rich vault_editorial markdown, attach timed segments/chapters for deep seeking!
            const { chapters } = buildParagraphMarkdownFromSegments(segments, normalizedLang);
            transcriptsPack[ytId] = {
              ...transcriptsPack[ytId],
              durationSec: durationSec || transcriptsPack[ytId].durationSec,
              segments,
              chapters: chapters.length > 0 ? chapters : transcriptsPack[ytId].chapters || [],
              updatedAt: nowIso,
            };
            captionsMatchedExistingEditorial++;
          } else {
            const { markdown, chapters } = buildParagraphMarkdownFromSegments(segments, normalizedLang);
            if (isSubstantiveTranscript(markdown) || countWords(markdown) >= 40) {
              transcriptsPack[ytId] = {
                key: ytId,
                sourceLang: normalizedLang,
                method: 'youtube_captions',
                durationSec: durationSec || undefined,
                wordCount: countWords(markdown),
                chapters,
                segments,
                transcriptMarkdown: markdown,
                updatedAt: nowIso,
              };
              captionsExtractedCount++;
            }
          }
        }
      }

      // If still no transcript at all, queue for Wave 2 local ASR (Option A)
      if (!transcriptsPack[ytId] || !isSubstantiveTranscript(transcriptsPack[ytId].transcriptMarkdown)) {
        asrPendingQueue.push({
          youtubeVideoId: ytId,
          slug: primaryVideo.slug,
          allSlugs: group.map((g) => g.slug),
          sourceLang: videoLang,
          durationSec: durationSec || 0,
          titleFa,
          seriesSlug: primaryVideo.series_slug || null,
          pillar: primaryVideo.pillar,
        });
      }
    }

    processed++;
    if (processed % 30 === 0 || processed === uniqueIds.length) {
      console.log(
        `Progress: ${processed}/${uniqueIds.length} | ok=${okCount} flagged=${privateOrUnavailableCount} captionsNew=${captionsExtractedCount} pendingAsr=${asrPendingQueue.length}`
      );
    }
  });

  // Check non-YouTube records (Vimeo + streamless ghosts like 5668)
  let noStreamCount = 0;
  for (const rec of nonYoutubeVideos) {
    const titleFa =
      rec.translations?.find((t) => (t.languages_code || '').startsWith('fa'))?.title ||
      rec.translations?.[0]?.title ||
      rec.slug;
    const hasStream = Boolean(rec.vimeo_url || rec.self_hosted_audio_url || rec.self_hosted_hls_url);
    const entry = {
      slug: rec.slug,
      youtubeVideoId: null,
      status: hasStream ? 'ok' : 'no_stream',
      reason: hasStream ? undefined : 'No video or audio stream attached in archive record',
      titleFa,
      durationSec: rec.duration_seconds || null,
      hasCaptions: false,
      captionLangs: [],
      checkedAt: nowIso,
    };
    bySlugHealth[rec.slug] = entry;
    if (!hasStream) {
      noStreamCount++;
      flaggedForStudio.push(entry);
    }
  }

  // Sort ASR queue shortest-first or priority-first (most impactful lectures first, deterministic)
  asrPendingQueue.sort((a, b) => (a.durationSec || 99999) - (b.durationSec || 99999));

  fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true });
  fs.mkdirSync(OVERLAYS_DIR, { recursive: true });

  fs.writeFileSync(TRANSCRIPTS_OUT_PATH, JSON.stringify(transcriptsPack, null, 2), 'utf8');

  const totalPendingSec = asrPendingQueue.reduce((acc, q) => acc + (q.durationSec || 0), 0);
  fs.writeFileSync(
    ASR_QUEUE_PATH,
    JSON.stringify(
      {
        generatedAt: nowIso,
        pendingCount: asrPendingQueue.length,
        totalDurationHours: Number((totalPendingSec / 3600).toFixed(2)),
        items: asrPendingQueue,
      },
      null,
      2
    ),
    'utf8'
  );

  const healthManifest = {
    generatedAt: nowIso,
    totalRecords: videos.length,
    uniqueYoutubeIds: byYtId.size,
    healthyCount: okCount,
    privateOrUnavailableCount,
    noStreamCount,
    byYoutubeId: byYoutubeHealth,
    bySlug: bySlugHealth,
    flaggedForStudio,
  };
  fs.writeFileSync(HEALTH_MANIFEST_PATH, JSON.stringify(healthManifest, null, 2), 'utf8');

  const totalCovered = Object.keys(transcriptsPack).length;
  const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log('\n=== LAYER 0 + LAYER 1 EXTRACTION COMPLETE ===');
  console.log(`Elapsed: ${elapsedSec}s`);
  console.log(`Total transcripts saved in transcripts/videos.json: ${totalCovered} unique keys`);
  console.log(`  - Layer 0 (vault_editorial): ${layer0Count}`);
  console.log(`  - Layer 1 (new youtube_captions): ${captionsExtractedCount}`);
  console.log(`  - Layer 1 (timed segments added to editorial): ${captionsMatchedExistingEditorial}`);
  console.log(`Health audit: ok=${okCount}, private/unavailable=${privateOrUnavailableCount}, no_stream=${noStreamCount}`);
  console.log(
    `Wave 2 Option A ASR Queue: ${asrPendingQueue.length} unique videos (${(totalPendingSec / 3600).toFixed(2)} hours)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
