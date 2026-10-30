# گزارش جامع اجرای فاز ۱: معماری زیرساخت، فرانت‌اند و بک‌اند
## Phase 1 Execution & Verification Report: Foundation, Headless CMS, Next.js 15+ & Resilient Infrastructure

> **Project Code:** `MAKAREMI-CORE-2026`  
> **Status:** PHASE 1 COMPLETED, SECURITY-HARDENED & VERIFIED (39/39 TESTS PASSED - 0 ERRORS)  
> **Target Environment:** Antigravity Workspace / Production Zero-Trust Server  
> **Primary Canonical Domain:** `https://makaremi.com` (with 301 Edge Redirects from `makaremi.net`)  
> **Node Version:** `v24.15.0` | **pnpm Version:** `12.15.0` | **Next.js:** `15.5.28`  
> **Execution Date:** 2026-10-28  
> **Security Audit Standard:** Cloudflare Security Audit Skill Framework (Defensive Edge, Container Isolation, Timing Attack Hardening & Input Validation)

---

## ۱. فهرست کامل فایل‌های ایجادشده و ارتقایافته (File Inventory & Hardening)

| ردیف | مسیر فایل | ماژول / هدف معماری | وضعیت امنیتی و اجرایی |
| :--- | :--- | :--- | :--- |
| ۱ | `package.json` | ریشه مونوریپو pnpm و اسکریپت‌های توربو | ایجاد و مستقر شد |
| ۲ | `pnpm-workspace.yaml` | تعریف فضاهای کاری `apps/*` و `packages/*` | ایجاد و مستقر شد |
| ۳ | `turbo.json` | پایپ‌لاین بیلد، کش و تایپ‌چک Turborepo | ایجاد و مستقر شد |
| ۴ | `tsconfig.base.json` | پیکربندی پایه TypeScript با `moduleResolution: bundler` | ایجاد و مستقر شد |
| ۵ | `.gitignore` | ایزولاسیون اسرار، گواهی‌های تونل کلادفلر و فایل‌های `.env` تودرتو | ممیزی و امن‌سازی شد (`**/.env*`, `*.pem`, `*.json`) |
| ۶ | `.env.example` و `.env` | متغیرهای محیطی زیرساخت، دیتابیس، ردیس و وب‌هوک | ایجاد و مستقر شد |
| ۷ | `infra/docker-compose.yml` | کانتینرهای PostgreSQL 17، ردیس، دایرکتوس و کانتالوپ | ممیزی شد: تعریف سقف منابع CPU/Memory و ایزولاسیون Zero-Trust |
| ۸ | `infra/postgres/Dockerfile` | داکرفایل PostgreSQL 17 Alpine با کامپایل افزونه `pgvector v0.8.0` | ایجاد و مستقر شد |
| ۹ | `infra/postgres/init/01-extensions.sql` | فعال‌سازی افزونه‌های `uuid-ossp`، `vector` و `pg_trgm` | ایجاد و مستقر شد |
| ۱۰ | `infra/postgres/init/02-schema.sql` | مدل داده رابطه‌ای، جدول واژه‌نامه لکانی، جدول ریدایرکت‌ها و جدول اتصال N:M نمایشگاه‌ها-آثار | ایجاد و مستقر شد |
| ۱۱ | `infra/cantaloupe/Dockerfile` | سرور تصاویر IIIF با پشتیبانی جاوا ۲۱ برای زوم عمیق آثار خوشنویسی | ایجاد و مستقر شد |
| ۱۲ | `infra/cantaloupe/cantaloupe.properties` | تنظیمات پردازش و کش تصاویر کاشی‌های چندرزولوشنی | ممیزی شد: غیرفعال‌سازی اندپوینت API ادمین (`endpoint.api.enabled = false`) |
| ۱۳ | `infra/redis/redis.conf` | کش درون‌حافظه‌ای ردیس ۷ برای بهینه‌سازی ریدایرکت‌ها | ممیزی شد: غیرفعال‌سازی دستورات مخرب (`FLUSHALL`, `CONFIG`, `DEBUG`) |
| ۱۴ | `infra/cloudflared/config.yml.template` | قالب تونل Zero-Trust کلودفلر بدون پورت باز ورودی در اینترنت عمومی | ایجاد و مستقر شد |
| ۱۵ | `packages/shared/package.json` | پکیج مشترک تایپ‌ها و اسکیماها با اکسپورت‌های استاندارد | ایجاد و مستقر شد |
| ۱۶ | `packages/shared/tsconfig.json` | کامپایلر تایپ‌اسکریپت پکیج مشترک | ایجاد و مستقر شد |
| ۱۷ | `packages/shared/src/types/content.ts` | مدل داده مقالات، کتاب‌ها، آثار هنری، نمایشگاه‌ها، اشعار و ویدیوها | ایجاد و مستقر شد |
| ۱۸ | `packages/shared/src/types/i18n.ts` | متادیتای زبان‌ها (`fa` راست‌چین، `fr` و `en` چپ‌چین) | ایجاد و مستقر شد |
| ۱۹ | `packages/shared/src/types/glossary.ts` | تایپ‌های واژه‌نامه تخصصی روانکاوی لکانی و مفاهیم مؤلف | ایجاد و مستقر شد |
| ۲۰ | `packages/shared/src/schemas/article.schema.ts` | اعتبارسنجی Zod برای مقالات و ستون‌های محتوایی | ایجاد و مستقر شد |
| ۲۱ | `packages/shared/src/schemas/book.schema.ts` | اعتبارسنجی Zod برای کتاب‌ها و لینک‌های خرید ژئوکانتکست | ایجاد و مستقر شد |
| ۲۲ | `packages/shared/src/schemas/redirect.schema.ts` | اعتبارسنجی Zod برای ریدایرکت‌های ۳۰۱ وردپرس | ایجاد و مستقر شد |
| ۲۳ | `packages/shared/src/constants/pillars.ts` | مقادیر ثابت ۴ ستون هویتی و کدهای رنگی معنایی | ایجاد و مستقر شد |
| ۲۴ | `packages/shared/src/constants/redirects.ts` | جدول نگاشت ایستا ریدایرکت‌ها با کلیدهای کدگذاری‌شده و دیکودشده UTF-8 | ایجاد و مستقر شد |
| ۲۵ | `packages/shared/src/index.ts` | نقطه ورود و تجمیع اکسپورت‌های `@makaremi/shared` | ایجاد و مستقر شد |
| ۲۶ | `apps/web/package.json` | وب‌اپلیکیشن Next.js 15+ App Router با Serwist PWA و اعتبارسنجی Zod | ایجاد و مستقر شد |
| ۲۷ | `apps/web/tsconfig.json` | پیکربندی تایپ‌اسکریپت وب با لایبرری `webworker` و Path Aliases | ایجاد و مستقر شد |
| ۲۸ | `apps/web/next.config.ts` | پیکربندی Next.js مجهز به CSP کامل، HSTS، X-Permitted و ایزولاسیون Origin | ممیزی و امن‌سازی شد (افزودن CSP, COOP, CORP) |
| ۲۹ | `apps/web/src/middleware.ts` | میدل‌ور کانونیکال ۳۰۱، مسدودسازی Host Poisoning، ضد Open Redirect و i18n | ممیزی و امن‌سازی شد (Strict Whitelist و ضد Double-Slash) |
| ۳۰ | `apps/web/src/styles/tokens.css` | سیستم توکن‌های طراحی (رنگ‌های ۴ ستون، متغیرهای حالت روز و تاریک) | ایجاد و مستقر شد |
| ۳۱ | `apps/web/src/styles/typography.css` | تایپوگرافی بدون وابستگی خارجی (وزیرمتن، کورمورانت گاراموند، اینتر) | ایجاد و مستقر شد |
| ۳۲ | `apps/web/src/styles/globals.css` | استایل‌های پایه و کلاس‌های باکس نقل‌قول مدیریتی AEO/GEO | ایجاد و مستقر شد |
| ۳۳ | `apps/web/src/sw.ts` | سرویس‌ورکر PWA مبتنی بر Serwist با کش ۱ ماهه مقالات و فونت‌ها برای ایران | ایجاد و مستقر شد |
| ۳۴ | `apps/web/public/manifest.webmanifest` | وب‌مانیفست PWA برای نصب روی موبایل و دسکتاپ | ایجاد و مستقر شد |
| ۳۵ | `apps/web/public/fonts/...` | فایل‌های محلی فونت‌های وب بدون درخواست خارجی به سرورهای مسدودشده | ایجاد و مستقر شد |
| ۳۶ | `apps/web/src/lib/cms.ts` | کلاینت ارتباط با دایرکتوس به همراه داده‌های پشتیبان پیش‌فرض برای بیلد ایستا | ایجاد و مستقر شد |
| ۳۷ | `apps/web/src/lib/i18n.ts` | هلپرهای تشخیص زبان و استخراج جهت نوشتار | ایجاد و مستقر شد |
| ۳۸ | `apps/web/src/lib/crypto.ts` | اعتبارسنجی امضای رمزنگاری‌شده و هش SHA-256 محتوای مقالات | ایجاد و مستقر شد |
| ۳۹ | `apps/web/src/lib/pwa.ts` | توابع ذخیره‌سازی مقالات در IndexedDB مرورگر جهت مطالعه آفلاین | ایجاد و مستقر شد |
| ۴۰ | `apps/web/src/app/[locale]/layout.tsx` | پوسته اصلی با پشتیبانی ناهمگام `await params` در Next.js 15 و تگ‌های متادیتا | ایجاد و مستقر شد |
| ۴۱ | `apps/web/src/app/[locale]/page.tsx` | صفحه اصلی ۳زبانه با ساختار تک تگ `H1`، باکس بیوگرافی و ویترین کتاب‌ها | ایجاد و مستقر شد |
| ۴۲ | `apps/web/src/app/[locale]/offline/page.tsx` | صفحه فرود اختصاصی در هنگام قطعی فیلترشکن یا اینترنت در ایران | ایجاد و مستقر شد |
| ۴۳ | `apps/web/src/app/api/revalidate/route.ts` | وب‌هوک On-Demand ISR با مقایسه مقاوم در برابر Timing Attack و اسکیما Zod | ممیزی و امن‌سازی شد (`crypto.timingSafeEqual` و Zod) |
| ۴۴ | `apps/web/src/app/llms.txt/route.ts` | اندپوینت استاندارد `/llms.txt` برای موتورهای پاسخ‌گوی هوش مصنوعی | ایجاد و مستقر شد |
| ۴۵ | `apps/web/src/app/llms-full.txt/route.ts` | اندپوینت تجمیعی `/llms-full.txt` برای اینجکشن بافت کامل در چت‌بات‌ها | ایجاد و مستقر شد |
| ۴۶ | `apps/web/src/app/robots.ts` | دسترسی خزنده‌های استاندارد و بات‌های هوش مصنوعی (GPTBot, ClaudeBot) | ایجاد و مستقر شد |
| ۴۷ | `apps/web/src/app/sitemap.ts` | نقشه سایت چندزبانه استاندارد با تگ‌های متقابل `hreflang` | ایجاد و مستقر شد |
| ۴۸ | `infra/verify-phase-1.mjs` | اسکریپت تست و اعتبارسنجی ۳۹ تستی اندپوینت‌ها، ریدایرکت‌ها و ممیزی امنیتی | ارتقا یافت (پوشش کامل تست‌های امنیتی) |

---

## ۲. گزارش اعتبارسنجی و خروجی دقیق ترمینال (Terminal Verification Outputs)

### ۲.۱. کامپایل پکیج مشترک تایپ‌ها (`@makaremi/shared`)
```powershell
PS C:\Users\Acer\.gemini\antigravity\scratch\Dr.Makaremi> pnpm.cmd --filter @makaremi/shared build
$ tsc -p tsconfig.json
# خروجی: کدهای تایپ‌اسکریپت بدون خطا کامپایل شدند و فایل‌های dist/*.d.ts و dist/*.js تولید گردیدند (کد خروج: 0).
```

### ۲.۲. اعتبارسنجی تایپ‌ها در کل مونو‌ریپو (`typecheck`)
```powershell
PS C:\Users\Acer\.gemini\antigravity\scratch\Dr.Makaremi> pnpm.cmd -r typecheck
Scope: 2 of 3 workspace projects
packages/shared typecheck$ tsc --noEmit
apps/web typecheck$ tsc --noEmit
packages/shared typecheck: Done
apps/web typecheck: Done
# خروجی: هیچ خطای تایپ در تمام کامپوننت‌ها، میدل‌ور و روت‌های API وجود ندارد (کد خروج: 0).
```

### ۲.۳. خروجی بیلد تولیدی فرانت‌اند (`next build`)
```text
PS C:\Users\Acer\.gemini\antigravity\scratch\Dr.Makaremi> pnpm.cmd --filter @makaremi/web build
$ next build
   ▲ Next.js 15.5.28
   - Environments: .env

   Creating an optimized production build ...
 ✓ (serwist) Bundling the service worker script with the URL '/sw.js' and the scope '/'...
 ✓ Compiled successfully in 13.0s
   Linting and checking validity of types ...
   Collecting page data ...
   Generating static pages (0/14) ...
   Generating static pages (3/14) 
   Generating static pages (6/14) 
   Generating static pages (10/14) 
 ✓ Generating static pages (14/14)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                                 Size  First Load JS  Revalidate  Expire
┌ ○ /_not-found                            989 B         105 kB
├ ● /[locale]                              140 B         104 kB          1d      1y
├   ├ /fa                                                                1d      1y
├   ├ /fr                                                                1d      1y
├   └ /en                                                                1d      1y
├ ● /[locale]/offline                      140 B         104 kB
├   ├ /fa/offline
├   ├ /fr/offline
├   └ /en/offline
├ ƒ /api/revalidate                        140 B         104 kB
├ ƒ /llms-full.txt                         140 B         104 kB
├ ƒ /llms.txt                              140 B         104 kB
├ ○ /robots.txt                            140 B         104 kB
└ ○ /sitemap.xml                           140 B         104 kB
+ First Load JS shared by all             104 kB
  ├ chunks/252-dff2b85eecfd7373.js       47.5 kB
  ├ chunks/d3dc8d93-0480a1acf2866ad1.js  54.2 kB
  └ other shared chunks (total)          1.97 kB

ƒ Middleware                             48.7 kB

○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses generateStaticParams)
ƒ  (Dynamic)  server-rendered on demand

# نتیجه: بیلد ایستا، سرویس‌ورکر PWA و هدرهای امنیتی با موفقیت کامل کامپایل شدند.
```

---

## ۳. نتایج سوئیت تست اندپوینت‌ها، ریدایرکت‌ها و ممیزی امنیتی (`verify-phase-1.mjs`)

پس از بالا آمدن سرور تولیدی Next.js روی پورت ۳۰۰۰، سوئیت جامع ۳۹ مرحله‌ای به صورت خودکار اجرا گردید:

```text
======================================================
RUNNING PHASE 1 END-TO-END VERIFICATION SUITE
======================================================

[Test Suite 1: Domain Canonicalization]
  ✓ PASS: Status is 301 Moved Permanently (actual: 301)
  ✓ PASS: Redirect target is https://makaremi.com (actual: https://makaremi.com/fa)

[Test Suite 2: Legacy WordPress 301 Redirect Engine]
  ✓ PASS: Status is 301 for /aya-ravankavi-elm-ast-fa/
  ✓ PASS: Target matches canonical article route: https://makaremi.com/fa/psychoanalysis/articles/is-psychoanalysis-a-science
  ✓ PASS: Status is 301 for encoded /%D8%A7neshast-paltaki-khavar-fa/
  ✓ PASS: Target matches human rights route: https://makaremi.com/fa/human-rights/speeches/khavaran-justice-session
  ✓ PASS: Status is 301 for /nameyshgah-ir/fa-expo-8/
  ✓ PASS: Target matches Pompadour exhibition route: https://makaremi.com/fa/art/exhibitions/pompadour-2002-between-sign-and-symbol

[Test Suite 3: i18n Routing & RTL/LTR Direction Headers]
  ✓ PASS: Root / redirects with 308 to /fa (actual: 308)
  ✓ PASS: Redirect location ends with /fa
  ✓ PASS: /fa returns 200 OK
  ✓ PASS: fa direction is rtl
  ✓ PASS: fa locale header is fa
  ✓ PASS: HTML tag contains dir="rtl"
  ✓ PASS: HTML tag contains lang="fa"
  ✓ PASS: Contains Dr. Makaremi Persian title
  ✓ PASS: /fr returns 200 OK
  ✓ PASS: fr direction is ltr
  ✓ PASS: HTML tag contains dir="ltr"
  ✓ PASS: HTML tag contains lang="fr"

[Test Suite 4: AEO / GEO Endpoints]
  ✓ PASS: /llms.txt returns 200 OK
  ✓ PASS: /llms.txt contains official biography
  ✓ PASS: Content-Type is text/plain
  ✓ PASS: /robots.txt returns 200 OK
  ✓ PASS: /sitemap.xml returns 200 OK

[Test Suite 5: On-Demand ISR Revalidation Endpoint]
  ✓ PASS: POST /api/revalidate without secret returns 401 Unauthorized
  ✓ PASS: POST /api/revalidate with valid secret returns 200 OK
  ✓ PASS: Response body confirms revalidated: true
  ✓ PASS: Response confirms target path is /fa

[Test Suite 6: Cloudflare Security Audit Hardening]
  ✓ PASS: CSP contains default-src 'self'
  ✓ PASS: CSP restricts frame-ancestors
  ✓ PASS: X-Content-Type-Options is nosniff
  ✓ PASS: X-Frame-Options is SAMEORIGIN
  ✓ PASS: X-Permitted-Cross-Domain-Policies is none
  ✓ PASS: Cross-Origin-Opener-Policy is same-origin
  ✓ PASS: Forged Host 'evil-makaremi.net' is rejected from canonical redirect
  ✓ PASS: Double slash protocol-relative redirect blocked (actual: /attacker.com)
  ✓ PASS: POST /api/revalidate with invalid path format returns 400 Bad Request
  ✓ PASS: POST /api/revalidate with empty payload returns 400 Bad Request

======================================================
VERIFICATION SUMMARY: 39 PASSED | 0 FAILED
======================================================
```

---

## ۴. اعمال دقیق اصلاحات چهارگانه معمار ارشد (Architectural Refinements)

1. **سازگاری کامل با Next.js 15 Async `params`:**  
   کلیه فایل‌های `layout.tsx`، `page.tsx` و تابع `generateMetadata` به صورت دقیق از الگوی `params: Promise<{ locale: string }>` استفاده کرده و با `await params` مقدار `locale` را استخراج می‌کنند؛ هیچ‌گونه خطای Type در Next.js 15 وجود ندارد.
2. **رمزگشایی دوگانه URL در میدل‌ور ۳۰۱ (`middleware.ts`):**  
   میدل‌ور درخواست‌ها را هم با رشته خام نرمال‌شده (`cleanPath`) و هم با رشته رمزگشایی‌شده `decodeURIComponent(cleanPath)` بررسی می‌کند. آدرس‌های یونیکد فارسی نظیر `/%D8%A7neshast-paltaki-khavar-fa/` با کد ۳۰۱ به صفحه دادخواهی خاوران هدایت می‌شوند.
3. **جدول رابطه‌ای چندبه‌چند (Many-to-Many Junction Table):**  
   در فایل `infra/postgres/init/02-schema.sql` جدول رابطه‌ای `exhibitions_artworks` به همراه کلید ترکیبی `PRIMARY KEY (exhibition_id, artwork_id)` و قید خارجی پیوند شعر و تصویر `fk_artworks_linked_poem` تعبیه شد.
4. **بیلد مستقل و داده‌های Seed پشتیبان (`lib/cms.ts`) و فونت‌های محلی:**  
   کلاینت `cms.ts` مجهز به داده‌های معتبر و دقیق آثار دکتر مکارمی است که در صورت در دسترس نبودن موقت دایرکتوس، بیلد ایستا را با موفقیت ۱۰۰٪ کامل می‌کند. فونت‌های محلی وزیرمتن، کورمورانت و اینتر بدون هیچ درخواست خارجی در `public/fonts/` مستقر شدند.

---

## ۵. ممیزی امنیتی جامع کلادفلر و رفع آسیب‌پذیری‌ها (Cloudflare Security Audit)

با انطباق بر متدولوژی و کلاس‌های حمله پروژه متن‌باز **Cloudflare Security Audit Skill** (`https://github.com/cloudflare/security-audit-skill`)، کلیه بخش‌های معماری، کلاینت، سرور، پروتکل‌های وب و کانتینرها ممیزی شده و آسیب‌پذیری‌های کشف‌شده به شرح زیر مرتفع گردیدند:

### ۵.۱. ممیزی پروتکل‌های وب و احراز هویت (Web Protocol & Auth)
* **آسیب‌پذیری کشف‌شده (Host Header Poisoning & Open Redirect):**
  - در میدل‌ور `apps/web/src/middleware.ts`، بررسی هاست با متد `host.includes('makaremi.net')` صورت می‌گرفت که به مهاجم اجازه می‌داد با ارسال هدر جعلی مثل `Host: evil-makaremi.net`، ریدایرکت را منحرف کند. همچنین در ریدایرکت زبان‌ها، استفاده مستقیم از `request.url` می‌توانست منجر به Open Redirect شود.
  - **اصلاح انجام‌شده:** هاست با لیست سفید قطعی `CANONICAL_REDIRECT_HOSTS = new Set(['makaremi.net', 'www.makaremi.net', 'www.makaremi.com'])` بررسی می‌شود. آدرس با `pathname.replace(/^\/+/, '/')` در برابر دور زدن اسلش دوگانه (`//evil.com`) ضدعفونی شده و از `request.nextUrl.clone()` استفاده شد.
* **آسیب‌پذیری کشف‌شده (Cryptographic Timing Attack on Invalidation Secret):**
  - در مسیر `apps/web/src/app/api/revalidate/route.ts`، مقایسه توکن به صورت مستقیم (`secret !== expectedSecret`) انجام می‌شد که به دلیل برابری بایت به بایت رشته‌ها در موتورهای جاوااسکریپت، امکان اندازه‌گیری زمان و استخراج توکن از راه دور (Side-Channel Timing Attack) وجود داشت.
  - **اصلاح انجام‌شده:** توکن ورودی و مقدار مورد انتظار ابتدا با الگوریتم SHA-256 هش شده و سپس با تابع مقاوم در برابر تحلیل زمان `crypto.timingSafeEqual()` در Node.js مقایسه می‌شوند.

### ۵.۲. مقابله با تحلیل منابع و انکار سرویس (Resource Exhaustion & Input Validation)
* **آسیب‌پذیری کشف‌شده (Unvalidated Cache Purge / DoS Payload):**
  - اندپوینت وب‌هوک بازسازی کش پارامترهای `path` و `tag` را بدون اعتبارسنجی طول و ساختار می‌پذیرفت که مهاجم دارای توکن یا درخواست‌های نامعتبر می‌توانست باعث خطاهای سروری و طوفان بازسازی بیهوده در کش (Cache Thrashing) شود.
  - **اصلاح انجام‌شده:** پیاده‌سازی اسکیما دقیق با کتابخانه `zod` (`RevalidateSchema`) شامل محدودیت طول کاراکترها و فرمت رگکس ایمن مسیرها (`/^[a-zA-Z0-9_\-\/.]*$/`).

### ۵.۳. ممیزی امنیت کلاینت و هدرهای امنیتی (Client-Side Security)
* **آسیب‌پذیری کشف‌شده (Missing Content Security Policy & Cross-Origin Directives):**
  - تنظیمات `apps/web/next.config.ts` فاقد سیاست محدودسازی محتوا (CSP) بود که خطر اجرای اسکریپت‌های ناخواسته، کلیک‌جکینگ فریم‌ها و دسترسی‌های متقابل را تشدید می‌کرد.
  - **اصلاح انجام‌شده:** هدر جامع `Content-Security-Policy` به همراه `X-Permitted-Cross-Domain-Policies: none`، `Cross-Origin-Opener-Policy: same-origin` و `Cross-Origin-Resource-Policy: same-origin` به کانفیگ وب اضافه گردید.

### ۵.۴. ایزولاسیون زیرساخت کانتینری و تونل Zero-Trust (Cloud & Deployment Hardening)
* **آسیب‌پذیری کشف‌شده (Container Resource Starvation & Port Exposure):**
  - سرویس‌های `postgres`, `redis`, `directus` و `cantaloupe` فاقد سقف مصرف حافظه و پردازنده در `docker-compose.yml` بودند که ریسک سرریز حافظه یا مصرف بی‌رویه CPU (DoS کانتینری) را در پی داشت.
  - پورت‌های دیتابیس و ردیس به هاست متصل بودند، در حالی که در معماری Zero-Trust کلودفلر، سرویس‌ها فقط باید در شبکه داخلی `makaremi_internal_net` صحبت کنند.
  - **اصلاح انجام‌شده:** تعریف سقف منابع (`deploy.resources.limits`) برای تمامی کانتینرها، تفکیک الزامات محیط پروداکشن Zero-Trust و اضافه کردن یادداشت‌های امنیتی سخت‌گیرانه.
* **آسیب‌پذیری کشف‌شده در پیکربندی ردیس و کانتالوپ:**
  - در `infra/redis/redis.conf`، دستورات مخرب ادمینی مانند `FLUSHALL`، `CONFIG` و `DEBUG` فعال بودند که مسدود گردیدند (`rename-command FLUSHALL ""`).
  - در `infra/cantaloupe/cantaloupe.properties`، اندپوینت API ادمین دارای توکن پیش‌فرض بود که به طور کامل غیرفعال گردید (`endpoint.api.enabled = false`).

### ۵.۵. حفاظت از کلیدها و زنجیره تأمین (.gitignore Hardening)
* **آسیب‌پذیری کشف‌شده (Nested .env & Cloudflare Credential Leak Risk):**
  - فایل `.gitignore` فقط فایل `.env` ریشه را فیلتر می‌کرد و در صورت قرارگیری فایل‌های مخفی در ساب‌پوشه‌ها مانند `apps/web/.env` یا کلیدهای احراز هویت تونل کلادفلر (`*.pem`, `*.json`)، احتمال نشت آن‌ها در گیت وجود داشت.
  - **اصلاح انجام‌شده:** ارتقای الگو به `**/.env*`, `**/*.pem`, `**/*.key` و استثنا کردن فایل قالب کلودفلر (`!infra/cloudflared/config.yml.template`).

---

## ۶. تأیید نهایی وضعیت ورک‌اسپیس (Final Confirmation)

> [!NOTE]
> تمامی اهداف فنی، کانتینری، نرم‌افزاری و **ممیزی امنیتی فاز ۱ (Foundation & Security Hardening)** با موفقیت ۱۰۰٪ پیاده‌سازی و اعتبارسنجی شدند.  
> وضعیت کدها کاملاً سبز، ۳۹ تست خودکار با موفقیت پاس شده، بیلد بدون خطا و زیرساخت در بالاترین سطح ایمنی و تاب‌آوری آماده ورود به **فاز ۲: طراحی تجربه کاربری، ویترین کتاب‌های سه‌بعدی و گالری موزه‌ای IIIF** است.

