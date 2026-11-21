import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'Dr. Hassan Makaremi — Official Trilingual Digital Museum & Scholarly Archive';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: 'linear-gradient(135deg, #0D2220 0%, #132F2B 55%, #1E2528 100%)',
          color: '#F5F3EE',
          fontFamily: 'Georgia, serif',
          border: '12px solid #D4AF37',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 22,
            letterSpacing: '0.12em',
            color: '#E2B857',
            textTransform: 'uppercase',
          }}
        >
          <span>MAKAREMI.COM • OFFICIAL ARCHIVE</span>
          <span>FA · FR · EN</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.15,
              color: '#FFFFFF',
            }}
          >
            Dr. Hassan Makaremi
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.4,
              color: '#D6D3CD',
              maxWidth: 960,
            }}
          >
            Clinical Lacanian Psychoanalyst • Sorbonne Researcher • Modern Persian Calligrapher (Moscow Museum) • Hafez Scholar • Human Rights Defender (LDDHI)
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(226, 184, 87, 0.35)',
            paddingTop: 24,
            fontSize: 22,
            color: '#C7D3D1',
          }}
        >
          <span>404 Articles · 25 Books · 300 Poems · 261 Videos · 27 Exhibitions</span>
          <span style={{ color: '#E2B857' }}>Paris — Shiraz</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
