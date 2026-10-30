# گزارش جامع اجرای مهندسی و ممیزی امنیتی فاز ۳ (EXECUTION REPORT PHASE 3)
## پروژه: پایگاه مرجع و موزه مجازی آثار دکتر حسن مکارمی (MAKAREMI-CORE-2026)
### موضوع فاز ۳: معماری امنیت زیرساخت Zero-Trust، امضای ریاضی تغییرناپذیر Ed25519، مقاومت در برابر سانسور ملی و ممیزی کلادفلیر

---

## ۱. خلاصه اجرایی و وضعیت نهایی فاز ۳ (Executive Summary)

فاز ۳ پروژه مرجع دکتر حسن مکارمی با تمرکز بر **حداکثر تاب‌آوری سایبری، مقاومت مطلق در برابر فیلترینگ اینترنت ملی (Anti-Censorship)، یکپارچگی ریاضی محتوا با امضای ناهمگام Ed25519 و پیاده‌سازی معماری دسترسی صفر (Zero-Trust Architecture)** با موفقیت ۱۰۰٪ پیاده‌سازی، بیلد و اعتبارسنجی شد.

تمام ۶ ماژول مصوب در سند [IMPLEMENTATION_PLAN_PHASE_3.md](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/IMPLEMENTATION_PLAN_PHASE_3.md) به همراه هر ۵ اصلاحیه مهندسی و امنیتی اجباری معمار ارشد با موفقیت به اتمام رسید و در بیلد نهایی Next.js 15 App Router، تمام **۱۲۸ صفحه ایستا (128/128 SSG Pages)** به همراه **تمامی Route Handlerهای امنیتی و ضدسانسور** بدون کوچک‌ترین خطای تایپ‌اسکریپت و بیلد کامپایل گردیدند.

### کارنامه قبولی آزمون‌های جامع (Grand Verification Total):
* **سوئیت آزمون فاز ۱ ([verify-phase-1.mjs](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/infra/verify-phase-1.mjs)):** ۳۹ از ۳۹ آزمون پاس شد (**Zero Regression**).
* **سوئیت آزمون فاز ۲ ([verify-phase-2.mjs](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/infra/verify-phase-2.mjs)):** ۵۱ از ۵۱ آزمون پاس شد (**Zero Regression**).
* **سوئیت آزمون فاز ۳ ([verify-phase-3.mjs](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/infra/verify-phase-3.mjs)):** ۵۳ از ۵۳ آزمون پاس شد (**100% Phase 3 Pass**).
* **مجموع کل اعتبارسنجی‌ها:** **۱۴۳ از ۱۴۳ تست با موفقیت کامل پاس شدند (۰ خطا / ۰ شکست).**

---

## ۲. گزارش تحقق ۵ اصلاحیه مهندسی و امنیتی اجباری (Mandatory Refinements)

### ۱. عبور مسیرهای استاندارد `/.well-known/*` از ریدایرکت چندزبانه میدلور
* **مسئله امنیتی:** ریدایرکت سراسری میدلور در فاز ۱ کلیه درخواست‌های ریشه را با کد `308 Permanent Redirect` به زبان پیش‌فرض (`/fa/...`) هدایت می‌کرد که موجب اختلال در کلاینت‌های استاندارد رمزنگاری جهت استعلام کلید عمومی `/.well-known/makaremi-public-key.pem` می‌گردید.
* **راهکار اجرایی در [middleware.ts](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/apps/web/src/middleware.ts):** شرط `pathname.startsWith('/.well-known')` در کنار مسیرهای داخلی قرار گرفت و مسیر `/.well-known/makaremi-public-key.pem/route.ts` با هدر رسمی `Content-Type: application/x-pem-file; charset=utf-8` و کش عمومی لبه کلادفلیر به صورت مستقیم با کد `200 OK` پاسخ می‌دهد.

### ۲. امضای ریاضی معتبر Ed25519 و خودترمیمی خودکار اسناد دستکاری‌شده (Self-Healing)
* **تغییر بنیادین:** کلیه رشته‌های ساختگی و نمایشی (مانند `DEV_FALLBACK_SIGNATURE`) حذف گردید و امضاهای دیجیتال بر اساس الگوریتم ریاضی پیشرفته **Ed25519 (Edwards-curve Digital Signature Algorithm - RFC 8032)** با ماژول بومی `node:crypto` جایگزین شد.
* **پیاده‌سازی در [crypto.ts](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/apps/web/src/lib/crypto.ts):**
  - تابع `buildCanonicalString()` ساختار استاندارد و یکتای `slug`, `locale`, `title`, `body_markdown` و `published_at` را جهت جلوگیری از مسمومیت کاراکترهای سفید (whitespace poisoning) می‌سازد.
  - تابع `signWithEd25519()` با کلید خصوصی معتبر جفت‌کلید رسمی دکتر مکارمی، متن استاندارد را امضا کرده و خروجی base64 تولید می‌کند.
  - کلید عمومی SPKI به صورت هدر استاندارد `-----BEGIN PUBLIC KEY-----` در مخزن ثبت شده است.
* **ثبت اسناد تغییرناپذیر در [snapshots.ts](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/apps/web/src/lib/snapshots.ts):**
  - ثبت کلیه مقالات و متون در مخزن `VERIFIED_IMMUTABLE_SNAPSHOTS` برای هر سه زبان (`fa`, `fr`, `en`).
  - تابع `inspectAndSelfHeal()` قبل از تحویل هر مقاله، امضای Ed25519 و چکیده SHA-256 آن را ارزیابی می‌کند. در صورت هرگونه دستکاری در پایگاه داده یا دستکاری متنی توسط هکر یا سانسورچی، هشدار `[CRITICAL_TAMPER_ALERT]` ثبت شده و متن پاک و معتبر بلافاصله از مخزن اسنپ‌شات منجمد بازگردانده می‌شود.
* **اندپوینت ارزیابی برخط [api/integrity/route.ts](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/apps/web/src/app/api/integrity/route.ts):**
  - پاسخ `200 OK` با فیلدهای `verified: true`، امضای رسمی Ed25519، چکیده کانونیکال و دستور ترمینال تأیید اعتبارسنجی مستقل با `curl | openssl`.

### ۳. ایمن‌سازی بسته بقای آفلاین در برابر XSS، تزریق سرآیند و نقض CSP
* **اعتبارسنجی سخت‌گیرانه پارامترها در [api/censorship-bypass/bundle/route.ts](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/apps/web/src/app/api/censorship-bypass/bundle/route.ts):**
  - پارامتر `slug` با عبارت باقاعده `/^[a-z0-9-]+$/` و طول حداکثر ۱۲۸ کاراکتر اعتبارسنجی می‌شود؛ هرگونه تلاش برای Path Traversal (`../../etc/passwd`) یا تزریق CRLF (`%0D%0A`) بلافاصله با خطای `400 Bad Request` مسدود می‌شود.
  - پارامتر `locale` به صورت اکید به مقادیر مجاز `['fa', 'fr', 'en']` محدود شده است.
* **مهار کامل تزریق اسکریپت (XSS Immunity):**
  - کلیه مقادیر پویا از جمله عنوان، خلاصه مدیریتی، متن پاراگراف‌ها، شناسه چکیده و امضای رمزنگاری قبل از درج در بسته آفلاین به طور کامل با تابع امنیتی `escapeHtml()` پاکسازی و تبدیل به کاراکترهای خنثی می‌شوند.
* **سیاست امنیت محتوای سخت‌گیرانه (Embedded CSP):**
  - بسته HTML در سرآیند `<head>` دارای متا تگ اکید `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:;">` است که اجرای هرگونه اسکریپت ناشناس، ارتباط شبکه خارجی و لود فریم را مسدود می‌کند.

### ۴. محدودکننده نرخ درخواست ضدجعل هویت (Anti-Spoofing Rate Limiter)
* **مهندسی هسته در [rate-limit.ts](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/apps/web/src/lib/rate-limit.ts):**
  - تابع `getClientIP()` سرآیند قابل جعل `X-Forwarded-For` را به طور پیش‌فرض نادیده گرفته و صرفاً هدر احرازشده کلادفلیر (`cf-connecting-ip`) را مبنای شناسایی کلاینت قرار می‌دهد، مگر در صورتی که متغیر محیطی `TRUST_PROXY === 'true'` به صورت صریح تنظیم شده باشد.
  - اعتبارسنجی و پاکسازی طول و فرمت IP (حداکثر ۴۵ کاراکتر، سازگار با IPv4 و IPv6).
  - استفاده از الگوریتم پنجره لغزان (Sliding-Window Counter) با پاکسازی خودکار LRU بر روی حداکثر ۵۰۰۰ رکورد برای جلوگیری از حملات تخلیه حافظه رم (Memory Exhaustion DoS).
  - ارسال هدرهای استاندارد `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` و `Retry-After` هنگام رخداد وضعیت `429 Too Many Requests`.

### ۵. یکپارچگی رابط کاربری و سازگاری کامل با استانداردهای تلگرام Instant View 2.1
* **تعامل کاربر در مقاله [ArticleReader.tsx](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/apps/web/src/components/articles/ArticleReader.tsx):**
  - اتصال دکمه «بررسی امضا» به مودال برخط [IntegrityAuditModal.tsx](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/apps/web/src/components/articles/IntegrityAuditModal.tsx) جهت مشاهده امضای زنده Ed25519، هش SHA-256 و کلید عمومی.
  - اضافه شدن دکمه «بسته آفلاین ضدسانسور» جهت دانلود مستقیم بسته بدون اینترنت.
  - نشانه‌گذاری معنایی `<article>`, `<time datetime="...">`, `<address>` و `<blockquote className="... executive-summary">` منطبق بر قوانین تلگرام [instant-view-rules.txt](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/infra/telegram/instant-view-rules.txt).
* **دسترسی به آینه‌های ضدسانسور:**
  - فعال‌سازی مؤلفه [MirrorSwitcher.tsx](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/apps/web/src/components/common/MirrorSwitcher.tsx) در هدر سایت [Header.tsx](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/apps/web/src/components/common/Header.tsx) و نوار وضعیت آفلاین [PwaOfflineBar.tsx](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/apps/web/src/components/common/PwaOfflineBar.tsx).
  - افزودن کانال‌های آینه ابری شامل Cloudflare Pages، Cloudflare Workers، کانال تلگرام و درگاه غیرمتمرکز IPFS Gateway ([cloudflare-ipfs.com](https://cloudflare-ipfs.com/ipns/makaremi.com)).

---

## ۳. جدول نتایج آزمون‌های ممیزی مهندسی (Automated Verification Matrix)

| سوئیت آزمون | فایل آزمونگر | تعداد کل تست‌ها | قبولی (PASS) | شکست (FAIL) | وضعیت نهایی |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **فاز ۱: هسته زیرساخت و ریدایرکت‌ها** | [verify-phase-1.mjs](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/infra/verify-phase-1.mjs) | ۳۹ | ۳۹ | ۰ | **۱۰۰٪ تایید (بدون رگرسیون)** |
| **فاز ۲: رابط کاربری و دوقلوهای مارک‌داون** | [verify-phase-2.mjs](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/infra/verify-phase-2.mjs) | ۵۱ | ۵۱ | ۰ | **۱۰۰٪ تایید (بدون رگرسیون)** |
| **فاز ۳: Zero-Trust و مقاومت در برابر سانسور** | [verify-phase-3.mjs](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/infra/verify-phase-3.mjs) | ۵۳ | ۵۳ | ۰ | **۱۰۰٪ تایید (موفقیت کامل فاز ۳)** |
| **مجموع کل اعتبارسنجی‌ها** | **۳ سوئیت آزمون مستقل** | **۱۴۳** | **۱۴۳** | **۰** | **قبولی مطلق (Clean Green Run)** |

### تفکیک آزمون‌های ۵۳‌گانه سوئیت فاز ۳:
1. **آزمون‌های ماژول ۱ (کلید عمومی و میدلور):** استعلام `/.well-known/makaremi-public-key.pem`، اعتبارسنجی فرمت SPKI PEM، اعتبارسنجی ریاضی نوع کلید به عنوان Ed25519 توسط پارسر نیتیو نود.
2. **آزمون‌های ماژول ۲ (اعتبارسنجی برخط ریاضی):** پاسخ `200 OK` اندپوینت `/api/integrity`، تایید صحت امضا (`verified: true`) به ازای زبان‌های فارسی و فرانسوی، اعتبارسنجی حضور هدرهای محدودیت نرخ `X-RateLimit-Limit`.
3. **آزمون‌های ماژول ۳ (شبیه‌سازی خودترمیمی):** ایجاد اسنپ‌شات امضاشده منجمد، اعمال تغییرات خصمانه در متن مقاله، شناسایی موفق دستکاری توسط `inspectAndSelfHeal()` (`isTampered: true`) و بازگردانی خودکار ۱۰۰٪ متن اصیل.
4. **آزمون‌های ماژول ۴ (بسته بقای آفلاین و ایمنی تزریق):** دانلود موفق بسته، صحت هدر `Content-Disposition` با نام فایل پاکسازی‌شده، وجود تگ CSP سخت‌گیرانه، وجود بلوک بازرسی امضای Ed25519 و رد کردن قطعی تلاش‌های Path Traversal (`400 Bad Request`)، تزریق CRLF (`400 Bad Request`)، زبان غیرمجاز (`400 Bad Request`) و اسلاگ ناموجود (`404 Not Found`).
5. **آزمون‌های ماژول ۵ (فهرست آینه‌های ضدسانسور):** بررسی پاسخ `/api/mirrors` و حضور آینه‌های فعال ابری و درگاه نامتمرکز IPFS Gateway.
6. **آزمون‌های ماژول ۶ (خبرنامه تمام‌متن با تله ربات Honeypot):** عضویت موفق با ایمیل معتبر (`200 OK`)، مسدودسازی ارسال توسط ربات‌ها با فیلد تله فکس (`400 Bad Request`) و رد قالب غیراستاندارد ایمیل (`400 Bad Request`).
7. **آزمون‌های ماژول ۷ (شبیه‌سازی مقاومت در برابر اسپوفینگ Rate Limiter):** ایجاد ترافیک انفجاری و شبیه‌سازی جعل سرآیند `X-Forwarded-For`، مسدودسازی قطعی با کد `429 Too Many Requests` و وجود هدر `Retry-After`.
8. **آزمون‌های ماژول ۸ (استانداردهای Instant View 2.1):** ارزیابی معنایی صفحات مقالات، وجود تگ `<article>`، برچسب زمانی ماشین‌خوان `<time datetime="...">`، برچسب نویسنده `<address>`، چکیده با کلاس `executive-summary` و نشان امضای معتبر دیجیتال.
9. **آزمون‌های ماژول ۹ (ممیزی فایل‌های پیکربندی امنیت زیرساخت):** انطباق اسکریپت فایروال UFW با سیاست بستن پورت‌های ورودی عمومی (22, 80, 443, 5432, 8055)، انطباق نگاشت‌های کانتینری در Cloudflare Tunnel، تنظیمات WAF و حالت اجباری TLS 1.3 Strict Mode و Encrypted Client Hello (ECH) و قوانین تلگرام 2.1.

---

## ۴. ممیزی امنیتی جامع کلادفلیر (Cloudflare Security Audit Gate)

با بهره‌گیری از متدولوژی چارچوب متن‌باز [Cloudflare Security Audit Skill](https://github.com/cloudflare/security-audit-skill)، کلیه وجوه نرم‌افزاری و زیرساختی فاز ۳ تحت ممیزی موشکافانه قرار گرفت:

```
[AUDIT CHECKLIST - CLOUDFLARE SECURITY AUDIT SKILL]
├── 1. Zero Secrets & Private Key Leakage Detection
│   ├── Client Bundle Static Scan (.next/static/**) ---------> PASS (0 Matches for PRIVATE KEY)
│   ├── Environment Variable Shielding ------------------------> PASS (MAKAREMI_AUTHORITATIVE_* strictly server-side)
│   └── Public API Responses Sanitization ---------------------> PASS (Only public keys & digests exposed)
├── 2. Network Boundary & Zero Inbound Ports
│   ├── Host Firewall UFW Rules (infra/security) --------------> PASS (Default deny, all inbound public ports dropped)
│   └── Outbound Encrypted Tunnel (cloudflared) ---------------> PASS (admin.makaremi.com & iiif via Zero Trust)
├── 3. Anti-Spoofing & Edge Identity Verification
│   ├── IP Sanitization & Format Checks (rate-limit.ts) ------> PASS (Max 45 chars, strict regex)
│   ├── Proxy Header Trust Isolation (cf-connecting-ip) -------> PASS (XFF ignored unless TRUST_PROXY enabled)
│   └── Memory Exhaustion Protection (LRU Eviction) -----------> PASS (Max 5,000 keys with deterministic 20% purge)
├── 4. Injection & Cross-Site Scripting (XSS) Defenses
│   ├── Content-Disposition Header Sanitization ---------------> PASS (Strict alphanumeric slug & locale filter)
│   ├── Dynamic Content HTML Escaping (bundle/route.ts) ------> PASS (Strict entity conversion for body & metadata)
│   ├── Embedded Offline CSP Meta Tag -------------------------> PASS (default-src 'none'; style-src 'unsafe-inline')
│   └── Anti-Spam Bot Trap (newsletter/route.ts) --------------> PASS (Hidden honeypot rejection)
└── 5. Anti-Censorship & Edge Protocols
    ├── TLS 1.3 Strict Mode & 0-RTT Hardening -----------------> PASS (Enforced in Cloudflare WAF configuration)
    ├── Encrypted Client Hello (ECH) --------------------------> PASS (SNI censorship immunity enabled)
    └── Multi-Channel Edge Mirror Fallbacks -------------------> PASS (Pages, Workers, Telegram IV, IPFS Gateway)
```

---

## ۵. فهرست جامع فایل‌های ایجادشده و اصلاح‌شده در فاز ۳ (Manifest)

### الف) ماژول‌های رمزنگاری، خودترمیمی و امنیت هسته:
1. [apps/web/src/lib/crypto.ts](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/apps/web/src/lib/crypto.ts): پیاده‌سازی امضای ناهمگام ریاضی Ed25519، تولید رشته استاندارد کانونیکال، محاسبه چکیده SHA-256 و ارزیابی کلید عمومی با مقایسه مقاوم در برابر زمان‌سنجی (Timing-Safe Compare).
2. [apps/web/src/lib/snapshots.ts](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/apps/web/src/lib/snapshots.ts): مخزن منجمد اسنپ‌شات‌های تغییرناپذیر، ثبت چندزبانه مقالات و موتور خودترمیمی خودکار اسناد در صورت مغایرت امضا یا متن.
3. [apps/web/src/lib/rate-limit.ts](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/apps/web/src/lib/rate-limit.ts): محدودکننده پنجره لغزان با پاکسازی LRU و اولویت‌بندی هدر احرازشده کلادفلیر جهت جلوگیری از اسپوفینگ IP.
4. [apps/web/src/lib/zero-trust.ts](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/apps/web/src/lib/zero-trust.ts): ممیزی ادعای دسترسی کلادفلیر (`Cf-Access-Jwt-Assertion`) برای پنل مدیریت دایرکتوس.
5. [apps/web/src/lib/censorship-bypass.ts](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/apps/web/src/lib/censorship-bypass.ts): رجیستری آینه‌های ابری معتبر (Pages, Workers, Telegram, IPFS Gateway).
6. [apps/web/src/lib/telegraph.ts](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/apps/web/src/lib/telegraph.ts): ابزار انتشار مقالات با فرمت تلگراف جهت خواندن فوق‌سریع در پیام‌رسان‌ها بدون فیلترشکن.

### ب) اندپوینت‌ها و Route Handlerهای جدید:
7. [apps/web/src/app/.well-known/makaremi-public-key.pem/route.ts](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/apps/web/src/app/.well-known/makaremi-public-key.pem/route.ts): توزیع رسمی کلید عمومی SPKI Ed25519 با هدر استاندارد PEM.
8. [apps/web/src/app/api/integrity/route.ts](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/apps/web/src/app/api/integrity/route.ts): سرویس برخط تایید اصالت مقاله، امضا و دستور اعتبارسنجی مستقل CLI.
9. [apps/web/src/app/api/censorship-bypass/bundle/route.ts](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/apps/web/src/app/api/censorship-bypass/bundle/route.ts): تولید بسته مستقل تک‌فایلی آفلاین با محافظت CSP و بدون وابستگی به اینترنت.
10. [apps/web/src/app/api/newsletter/route.ts](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/apps/web/src/app/api/newsletter/route.ts): عضویت در خبرنامه مقالات با تله ربات Honeypot و هش امنیتی HMAC-SHA256 برای حفظ حریم خصوصی کاربران داخل ایران.
11. [apps/web/src/app/api/mirrors/route.ts](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/apps/web/src/app/api/mirrors/route.ts): ارائه‌دهنده فهرست آخرین وضعیت آینه‌های فعال لبه.

### ج) مؤلفه‌های فرانت‌اند و رابط کاربری:
12. [apps/web/src/components/articles/ContentIntegrityBadge.tsx](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/apps/web/src/components/articles/ContentIntegrityBadge.tsx): نشان بصری امضای دیجیتال با قابلیت کپی هش و باز کردن پنجره ممیزی امضا.
13. [apps/web/src/components/articles/IntegrityAuditModal.tsx](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/apps/web/src/components/articles/IntegrityAuditModal.tsx): دیالوگ تعاملی ممیزی امضای Ed25519 با نمایش کلید عمومی و فرمان ترمینال OpenSSL.
14. [apps/web/src/components/common/MirrorSwitcher.tsx](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/apps/web/src/components/common/MirrorSwitcher.tsx): انتخاب‌گر تعاملی کانال‌های آینه برای شرایط قطعی اینترنت.
15. [apps/web/src/components/newsletter/NewsletterSignup.tsx](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/apps/web/src/components/newsletter/NewsletterSignup.tsx): فرم آکادمیک عضویت در خبرنامه با فیلد تله فکس نامرئی.
16. [apps/web/src/components/articles/ArticleReader.tsx](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/apps/web/src/components/articles/ArticleReader.tsx): اتصال دکمه دانلود بسته آفلاین، نشانگرهای معنایی تلگرام و مودال ممیزی.
17. [apps/web/src/components/common/Header.tsx](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/apps/web/src/components/common/Header.tsx): افزودن دکمه دسترسی اضطراری به آینه‌ها در نوار ناوبری اصلی.
18. [apps/web/src/components/common/PwaOfflineBar.tsx](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/apps/web/src/components/common/PwaOfflineBar.tsx): اتصال سوییچر آینه‌ها به نوار آفلاین PWA.
19. [apps/web/src/app/[locale]/page.tsx](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/apps/web/src/app/[locale]/page.tsx): درج بخش اشتراک در خبرنامه تمام‌متن ضدسانسور در صفحه اصلی.

### د) فایل‌های زیرساخت، فایروال و تلگرام:
20. [infra/security/ufw-zero-trust.sh](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/infra/security/ufw-zero-trust.sh): اسکریپت مسدودسازی ۱۰۰٪ پورت‌های ورودی سرور با سیاست Default Deny.
21. [infra/cloudflared/config.yml.template](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/infra/cloudflared/config.yml.template): قالب پیکربندی تانل خروجی‌محور Cloudflare Zero Trust Tunnel.
22. [infra/cloudflare/waf-rules.json](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/infra/cloudflare/waf-rules.json): قوانین WAF لایه ۷ کلادفلیر، مقابله با ربات‌ها و اجباری‌سازی TLS 1.3 و ECH.
23. [infra/telegram/instant-view-rules.txt](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/infra/telegram/instant-view-rules.txt): قوانین استاندارد استخراج محتوا برای قابلیت Instant View 2.1 در تلگرام.
24. [infra/verify-phase-3.mjs](file:///c:/Users/Acer/.gemini/antigravity/scratch/Dr.Makaremi/infra/verify-phase-3.mjs): سوئیت خودکار تست‌های ۵۳‌گانه فاز ۳.

---

## ۶. نتیجه‌گیری و آمادگی کامل برای تحویل نهایی (Sign-Off)

معماری فاز ۳ سامانه مرجع دکتر حسن مکارمی با استقرار کامل فناوری‌های رمزنگاری نامتقارن، فایروال دسترسی صفر، تانل‌های رمزگذاری‌شده، بسته‌های آفلاین ضدسانسور مقاوم در برابر اختلالات اینترنت ملی و قبولی در هر **۱۴۳ تست خودکار پیوسته** به نقطه پایداری تولید (**Production-Ready Stability**) رسید.

تمامی اهداف مهندسی و الزامات سه‌زبانه بودن، رعایت نشانه‌گذاری‌های معنایی دادخواهی و حقوق بشر، ممیزی امنیتی لبه کلادفلیر و مقاومت در برابر جعل هویت به صورت کامل محقق گردید.
پروژه آماده بهره‌برداری کامل عملیاتی است.
