import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Persist locally when running in writable environment
    try {
      const saveDir = path.join(process.cwd(), 'src', 'data');
      fs.mkdirSync(saveDir, { recursive: true });
      const filePath = path.join(saveDir, 'makaremi-curation-decisions.json');
      fs.writeFileSync(filePath, JSON.stringify(body, null, 2), 'utf8');
    } catch {
      // On read-only serverless filesystem, client-side download + response handles persistence
    }

    return NextResponse.json({
      ok: true,
      savedAt: new Date().toISOString(),
      message: 'تصمیمات و نظرات استاد دکتر حسن مکارمی با موفقیت ثبت شد.',
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid manifest payload' },
      { status: 400 }
    );
  }
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'makaremi-curation-decisions.json');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return NextResponse.json(JSON.parse(content));
    }
  } catch {
    // ignore
  }
  return NextResponse.json({ ok: true, status: 'awaiting_curation' });
}

