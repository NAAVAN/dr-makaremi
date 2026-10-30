# دفترچه راهنمای عملیات فنی و بازیابی بحران (OPERATIONS RUNBOOK)
**پروژه:** سامانه جامع و آرشیو دیجیتال دکتر حسن مکارمی (`MAKAREMI-CORE-2026`)  
**نسخه:** 1.0.0-PROD  
**مخاطب:** تیم مهندسی قابلیت اطمینان سایت (SRE)، مدیران زیرساخت ابری (Cloud DevOps) و ممیزان امنیت سایبری  

---

## ۱. نمای کلی معماری زیرساخت و کانتینرها (Container Architecture)

سامانه `MAKAREMI-CORE-2026` روی سرورهای ابری اختصاصی لینوکس در اتحادیه اروپا (Hetzner در آلمان / OVHcloud در فرانسه) با مدل امنیتی Zero-Trust مستقر شده است:

```
[Cloudflare Edge Anycast CDN]
          │
    (Encrypted Tunnel)
          ▼
   [cloudflared daemon]
          │
  ┌───────┴────────────────────────┐
  ▼                                ▼
[Next.js 15 Web App (:3000)]    [Directus CMS (:8055)]
  │                                │
  └───────────────┬────────────────┘
                  ▼
   [PostgreSQL 17 + pgvector (:5432)]
                  │
   [Ed25519 Snapshots & IIIF Tiles]
```

### پورت‌های سرور و سیاست پنهان‌سازی (Port Cloaking Policy)
- **پورت‌های ورودی سرور (Inbound Ports):** تمام پورت‌های ورودی عمومی (۲۲، ۸۰، ۴۴۳، ۵۴۳۲، ۶۳۷۹، ۸۰۵۵، ۸۱۸۲) روی آدرس IP عمومی سرور مسدود هستند.
- **ترافیک ورودی:** ترافیک تنها و منحصراً از طریق پروسه `cloudflared` (تونل رمزنگاری‌شده کلادفلیر) هدایت می‌شود.
- **دسترسی SSH مدیران:** فقط از طریق Cloudflare Access با احراز هویت دو مرحله‌ای (mTLS و کلید سخت‌افزاری).

---

## ۲. دستورالعمل بازیابی کامل از نسخه پشتیبان رمزنگاری‌شده (Disaster Recovery)

در صورت بروز خرابی سرور، تخریب دیسک یا حملات سایبری، سامانه می‌تواند در کمتر از ۱۵ دقیقه با استفاده از بسته‌های پشتیبان رمزنگاری‌شده `AES-256-GCM` بازیابی کامل شود.

### گام‌های بازیابی (Restore Procedure)
1. **دانلود آخرین بسته پشتیبان معتبر از مخزن S3:**
   ```bash
   aws s3 sync s3://makaremi-archive-vault-eu-west-3/latest/ /var/backups/restore/
   ```
2. **بررسی امضای دیجیتال مانیفست با کلید Ed25519 و رمزگشایی:**
   از طریق ماژول تایپ‌شده `backup-manager.ts` یا اسکریپت اضطراری:
   ```bash
   node -e "
     const { verifyAndDecryptBackup } = require('./apps/web/src/lib/ops/backup-manager');
     const fs = require('fs');
     const pkg = JSON.parse(fs.readFileSync('/var/backups/restore/package.json'));
     verifyAndDecryptBackup(pkg).then(payload => {
       fs.writeFileSync('/var/backups/restore/decrypted-bundle.json', JSON.stringify(payload));
       console.log('Cryptographic verification & decryption SUCCESSFUL.');
     }).catch(err => {
       console.error('RESTORE ABORTED: Security alert!', err);
       process.exit(1);
     });
   "
   ```
3. **بازیابی دیتابیس PostgreSQL 17:**
   ```bash
   docker exec -i makaremi-db-prod pg_restore -U directus -d makaremi_prod --clean --if-exists /var/backups/restore/database.dump
   ```
4. **تأیید سلامت کاتالوگ و اجرای آزمون خودکار:**
   ```bash
   curl -s http://127.0.0.1:3000/api/health | jq .
   pnpm verify:all
   ```

---

## ۳. چرخه چرخش کلیدهای امنیتی (Key Rotation Procedures)

### الف) کلید نامتقارن Ed25519 (Authoritative Signing Key)
- **کلید عمومی رسمی:** در آدرس `/.well-known/makaremi-public-key.pem` نگهداری می‌شود.
- **چرخش سالانه:**
  1. تولید جفت‌کلید جدید در محیط ایزوله:
     ```bash
     openssl genpkey -algorithm Ed25519 -out makaremi-ed25519-private-new.pem
     openssl pkey -in makaremi-ed25519-private-new.pem -pubout -out makaremi-ed25519-public-new.pem
     ```
  2. به‌روزرسانی متغیر محیطی `MAKAREMI_SIGNING_KEY` در سرور بدون نیاز به ریستارت سرویس.
  3. کلید عمومی قبلی به مدت ۹۰ روز در آرشیو معتبر باقی می‌ماند تا اسنپ‌شات‌های گذشته همچنان قابل اعتبارسنجی باشند.

### ب) کلید متقارن بکاپ (AES-256-GCM Master Key)
- متغیر `BACKUP_ENCRYPTION_KEY` هر ۶ ماه یک‌بار تغییر می‌یابد.
- در زمان تغییر، آخرین نسخه پشتیبان با کلید جدید مجدداً رمزنگاری و ثبت می‌گردد.

### ج) توکن‌های وب‌هوک تلگرام و واتس‌اپ
- در صورت نشت احتمالی توکن:
  1. بازنشانی فوری در `@BotFather` یا پورتال متا دولپرز.
  2. به‌روزرسانی متغیرهای `TELEGRAM_BOT_TOKEN` و `WHATSAPP_API_TOKEN` در `.env.production`.
  3. بارگذاری مجدد کانتینرها با دستور `docker compose restart web`.

---

## ۴. پایش بلادرنگ و تلهمتری سلامت سامانه (`/api/health`)

اندپوینت `/api/health` وضعیت زیرسیستم‌ها را با سرعت بالا بررسی می‌کند:
- **درخواست:** `GET /api/health`
- **هدرهای پاسخ:** `Cache-Control: no-store, max-age=0`
- **محدودیت نرخ (Rate Limiting):** حداکثر ۱۲۰ درخواست در دقیقه بر اساس شناسه تفکیک‌شده `'health'`.
- **شاخص‌های کلیدی (Metrics):**
  - وضعیت اتصال دیتابیس PostgreSQL 17
  - تعداد اسنپ‌شات‌های معتبر Ed25519
  - تعداد چانک‌های فعال ایندکس هیبریدی RAG
  - وضعیت آخرین بکاپ رمزنگاری‌شده
  - کارنامه ۶ گیت Pre-Launch QA

```bash
# نمونه دستور بررسی سلامت از خط فرمان
curl -s https://makaremi.com/api/health | jq .status
# پاسخ مورد انتظار: "healthy"
```

---

## ۵. راهنمای واکنش به رخدادها و عیب‌یابی اضطراری (Incident Response)

| وضعیت رخداد | نشانه / خطا | اقدام فوری تیم SRE |
|---|---|---|
| **هشدار دستکاری محتوا** | `CRITICAL_TAMPER_ALERT` در لاگ‌ها | سامانه به صورت خودکار نسخه تغییرناپذیر اسنپ‌شات را جایگزین می‌کند. بررسی لاگ دسترسی Directus و بازنشانی رمزهای CMS الزامی است. |
| **خطای تگ اصالت بکاپ** | `AES-256-GCM authTag mismatch` | بسته بکاپ دستکاری شده است! بلافاصله فرآیند بازیابی متوقف و هشدار امنیتی صادر شود. از نسخه پشتیبان روز قبل استفاده کنید. |
| **قطعی تونل کلادفلیر** | `502 Bad Gateway` در ورودی لبه | بررسی لاگ `journalctl -u cloudflared -f` و راه‌اندازی مجدد پروسه تونل با `systemctl restart cloudflared`. |
| **بار ترافیکی بالا در ایران** | افزایش تأخیر در پاسخ‌ها | بررسی وضعیت فعال بودن کش لبه Cloudflare برای روت‌های ایستا و اطمینان از پاسخ‌دهی سرویس ورکر آفلاین PWA. |

---

## ۶. بررسی نهایی پیش از به‌روزرسانی (Pre-Release Gate)

پیش از انتشار هر به‌روزرسانی روی شاخه اصلی (Production Release)، اجرای دستور زیر در ریشه پروژه الزامی است:
```bash
pnpm verify:all
```
**شرط خروج:** ۱۰۰٪ آزمون‌ها در تمام ۷ فاز (۵۲۰+ تست) باید بدون هیچ‌گونه خطا (Zero Failures) با رنگ سبز پاس شوند.
