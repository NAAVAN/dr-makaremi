export default function OfflinePage() {
  return (
    <div className="container" style={{ padding: '4rem 1.25rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>
        حالت مطالعه آفلاین (دسترسی بدون اینترنت)
      </h1>
      <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 2rem auto', lineHeight: 1.8 }}>
        ارتباط شما با شبکه اینترنت یا VPN قطع شده است. مقالات و بخش‌هایی از کتاب‌ها که پیش‌تر باز کرده‌اید همچنان از طریق حافظه محلی مرورگر در دسترس شما قرار دارند.
      </p>
      <a
        href="/fa"
        style={{
          display: 'inline-block',
          backgroundColor: 'var(--pillar-psychoanalysis)',
          color: '#fff',
          padding: '0.75rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          fontWeight: 600,
        }}
      >
        تلاش مجدد برای اتصال
      </a>
    </div>
  );
}
