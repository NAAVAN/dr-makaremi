import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { VideoTranscriptRecord } from '@makaremi/shared';
import { isStudioRequestAuthorized } from '@/lib/studio/auth';
import {
  getVideoHealthManifest,
  getVideoSpeeches,
  invalidateCmsCollectionsCache,
} from '@/lib/cms';
import {
  loadVideoTranscriptsPack,
  writeVideoTranscriptEntry,
} from '@/lib/vault-loader';
import { normalizePersianText, countWords } from '@/lib/etl/persian-normalizer';

const SaveTranscriptSchema = z.object({
  slug: z.string().trim().min(1).max(180),
  youtubeVideoId: z.string().trim().max(40).nullable().optional(),
  sourceLang: z.enum(['fa', 'fr', 'en']).default('fa'),
  rawContent: z.string().trim().min(20).max(500000),
  format: z.enum(['markdown', 'srt', 'vtt']).default('markdown'),
});

function parseTimestampToSec(raw: string): number {
  const clean = raw.trim().replace(',', '.');
  const parts = clean.split(':').map((p) => Number(p));
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function formatClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

function parseSrtOrVtt(raw: string, lang: 'fa' | 'fr' | 'en') {
  const blocks = raw
    .replace(/^WEBVTT[^\n]*\n+/i, '')
    .split(/\r?\n\s*\r?\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  const segments: Array<{ startSec: number; endSec: number; text: string }> = [];
  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const timeLineIdx = lines.findIndex((l) => l.includes('-->'));
    if (timeLineIdx < 0) continue;
    const [startRaw, endRaw] = lines[timeLineIdx].split('-->').map((x) => x.trim().split(' ')[0]);
    const textLines = lines
      .slice(timeLineIdx + 1)
      .join(' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!textLines) continue;
    const cleanText = lang === 'fa' ? normalizePersianText(textLines) : textLines;
    segments.push({
      startSec: Number(parseTimestampToSec(startRaw).toFixed(2)),
      endSec: Number(parseTimestampToSec(endRaw).toFixed(2)),
      text: cleanText,
    });
  }

  const paragraphs: string[] = [];
  const chapters: Array<{ startSec: number; title: string }> = [];
  let bucket: string[] = [];
  let bucketStart = segments[0]?.startSec || 0;
  let lastChapterSec = -999;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (bucket.length === 0) bucketStart = seg.startSec;
    bucket.push(seg.text);
    const joined = bucket.join(' ');
    const isLast = i === segments.length - 1;
    if (isLast || seg.endSec - bucketStart >= 45 || joined.length >= 460) {
      paragraphs.push(`**[${formatClock(bucketStart)}]** ${joined}`);
      if (bucketStart - lastChapterSec >= 300 || chapters.length === 0) {
        chapters.push({
          startSec: Math.floor(bucketStart),
          title: joined.split(/\s+/).slice(0, 9).join(' '),
        });
        lastChapterSec = bucketStart;
      }
      bucket = [];
    }
  }

  return {
    segments,
    chapters: chapters.slice(0, 12),
    markdown: paragraphs.join('\n\n'),
  };
}

export async function GET(request: NextRequest) {
  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const [videos, manifest] = await Promise.all([
    getVideoSpeeches('fa'),
    Promise.resolve(getVideoHealthManifest()),
  ]);
  const pack = loadVideoTranscriptsPack();

  const withSubstantiveTranscript = videos.filter((v) =>
    (v.translations || []).some(
      (t) =>
        t.transcript_markdown &&
        t.transcript_markdown.replace(/https?:\/\/\S+/gi, '').trim().length >= 300
    )
  ).length;

  return NextResponse.json(
    {
      ok: true,
      summary: {
        totalRecords: videos.length,
        withTranscriptCount: withSubstantiveTranscript,
        transcriptPackKeys: Object.keys(pack).length,
        healthyCount: manifest?.healthyCount ?? 0,
        privateOrUnavailableCount: manifest?.privateOrUnavailableCount ?? 0,
        noStreamCount: manifest?.noStreamCount ?? 0,
      },
      flaggedForStudio: manifest?.flaggedForStudio || [],
      generatedAt: manifest?.generatedAt || null,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function PATCH(request: NextRequest) {
  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const raw = await request.json();
    const parsed = SaveTranscriptSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'ورودی متن پیاده‌سازی‌شده معتبر نیست.', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { slug, youtubeVideoId, sourceLang, rawContent, format } = parsed.data;
    const key = youtubeVideoId?.trim() || slug;

    let markdown = rawContent;
    let segments: VideoTranscriptRecord['segments'] = [];
    let chapters: VideoTranscriptRecord['chapters'] = [];

    if (format === 'srt' || format === 'vtt' || rawContent.includes('-->')) {
      const parsedSub = parseSrtOrVtt(rawContent, sourceLang);
      if (parsedSub.markdown) {
        markdown = parsedSub.markdown;
        segments = parsedSub.segments;
        chapters = parsedSub.chapters;
      }
    } else if (sourceLang === 'fa') {
      markdown = normalizePersianText(rawContent);
    }

    const existing = loadVideoTranscriptsPack()[key];
    const record: VideoTranscriptRecord = {
      key,
      sourceLang,
      method: 'professor_edited',
      durationSec: existing?.durationSec,
      wordCount: countWords(markdown),
      chapters: chapters.length > 0 ? chapters : existing?.chapters || [],
      segments: segments.length > 0 ? segments : existing?.segments || [],
      transcriptMarkdown: markdown,
      updatedAt: new Date().toISOString(),
    };

    writeVideoTranscriptEntry(key, record);
    invalidateCmsCollectionsCache('videos');

    return NextResponse.json({
      ok: true,
      key,
      wordCount: record.wordCount,
      segmentCount: record.segments.length,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'خطا در ذخیره متن ویدیو' },
      { status: 500 }
    );
  }
}
