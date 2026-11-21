# راهنمای مرجع و پلی‌بوک استاندارد اسکیل‌های عمومی وب (Universal Web Skills Playbook)

> **نسخه:** `1.0.0` • **تاریخ تثبیت:** `2026-11-21`  
> **مبنای تجربی:** استخراج‌شده و آزموده‌شده در اجرای کامل ۵ فاز مهندسی پلتفرم سه‌زبانه `MAKAREMI-CORE-2026` (`546 / 546` تست جامع، `437 / 437` ممیزی زنده سئو/GEO، `748 / 748` ممیزی ناوبری و محتوا، `0` توکن LLM در مهاجرت `3,172` رکورد و کاهش `47.3x` مصرف توکن با `graphify`).

این سند یک **دستورالعمل تکرارپذیر و استاندارد** برای راه‌اندازی، توسعه، امن‌سازی، سئو/GEO و انتشار **تمام پروژه‌های وب مدرن** (Next.js / React / TypeScript / Full-Stack) با اکوسیستم اسکیل‌های Antigravity است؛ به نحوی که در هر پروژه جدید بدون نیاز به ممیزی مجدد ۲۹۷ اسکیل سیستم، بهترین ترکیب اسکیل‌ها در کمتر از ۶۰ ثانیه فعال شود.

---

## ۱. پروتکل راه‌اندازی ۶۰ ثانیه‌ای برای هر پروژه وب جدید (Project Bootstrap)

پیش از نوشتن اولین خط کد در هر پروژه جدید، این ۴ گام را اجرا کنید:

### گام ۱: فعال‌سازی `graphify` در سطح پروژه (کاهش ~۴۰ تا ۵۰ برابری مصرف توکن)
نصب گلوبال `graphifyy` به تنهایی کافی نیست؛ هر مخزن وب باید قوانین، هوک‌های گیت و `.graphifyignore` اختصاصی خود را داشته باشد:

```powershell
# ۱. نصب قوانین Always-On و ورک‌فلو در پروژه (.agents/rules/graphify.md)
graphify antigravity install

# ۲. نصب هوک‌های خودکار Git برای بازسازی بدون نیاز به LLM پس از هر commit/merge
graphify hook install

# ۳. ساخت اولیه گراف صرفاً با تحلیل AST محلی (۰ توکن LLM!)
graphify extract . --code-only
```

### گام ۲: ایجاد فایل `.graphifyignore` استاندارد وب
حتماً پوشه‌های سنگین، فایل‌های خروجی/کش و دامپ‌های خام را پیش از ساخت گراف مستثنی کنید تا `graphify` سریع، دقیق و بدون خطای حافظه بماند:

```gitignore
# Dependency, build & cache artifacts
node_modules/
.next/
.turbo/
dist/
build/
coverage/
out/

# Agent scratch, local skills & bulk raw data dumps
scratch/
.agents/
*.xml
*.sql
*.csv
*.zip
*.tar.gz
public/fonts/
public/icons/
```

> **نکته گیت (Git Hygiene):** پوشه `graphify-out/` را به `.gitignore` اضافه کنید تا فایل‌های بزرگ `graph.json` و `graph.html` تاریخچه گیت را سنگین نکنند (هوک‌های گیت آن را به صورت خودکار و محلی بازسازی می‌کنند). همچنین دو اسکریپت زیر را به `package.json` ریشه پروژه بیفزایید:
> ```json
> {
>   "scripts": {
>     "graph:update": "graphify update .",
>     "graph:report": "graphify query --help"
>   }
> }
> ```

### گام ۳: قانون طلایی بهداشت اسکیل‌ها (Zero Context Bloat)
- **هرگز اسکیل‌های عمومی موجود در پوشه گلوبال (`C:\Users\Acer\.gemini\config\skills\`) را درون `.agents/skills/` پروژه کپی نکنید.**
- پوشه محلی `.agents/skills/` هر پروژه باید **فقط و فقط شامل اسکیل‌های اختصاصی دامنه همان پروژه** باشد (در این پروژه صرفاً ۳ اسکیل بومی `makaremi-*` باقی ماندند و ۳۱ اسکیل تکراری/نامرتبط حذف شدند).
- اطمینان حاصل کنید سرورهای MCP برای `graphify` و `context7` در `mcp_config.json` فعال باشند تا `query_graph` و `query-docs` مستقیم در دسترس ایجنت قرار گیرند.

### گام ۴: راه‌اندازی دفترچه حافظه مهندسی (`task-observer`)
در هر پروژه چندمرحله‌ای، ساختار `skill-observations/observation-log/` را ایجاد کرده و درس‌آموخته‌های تکرارشونده را با فرمت YAML استاندارد `task-observer v3.10.0` ثبت کنید تا خطاهای کشف‌شده هیچ‌گاه در جلسات بعدی تکرار نشوند.

---

## ۲. ماتریس اسکیل‌های عمومی وب در ۷ مرحله چرخه عمر پروژه (Universal Web Core)

از میان ۲۹۷ اسکیل نصب‌شده روی سیستم، **~۷۲ اسکیل** هسته طلایی هر پروژه وب عمومی را تشکیل می‌دهند:

| مرحله چرخه عمر | اسکیل‌های کلیدی فعال | وظیفه اصلی | معیار پذیرش (Definition of Done) |
| :--- | :--- | :--- | :--- |
| **۱. کشف و معماری** | `graphify`, `context7`, `grill-me`, `llm-council`, `agent-native` | نقشه معماری بدون مصرف توکن، دریافت مستندات نسخه‌دقیق کتابخانه‌ها، بستن ابهامات نیازمندی، داوری چنددیدگاهی برای تصمیمات حساس | طرح معماری بدون ابهام + دسترسی به مستندات نسخه دقیق Next.js/React/Tailwind |
| **۲. سیستم دیزاین و UI/UX** | `design-doctrine`, `design-tokens`, `token-build`, `ui-ux-pro-max`, `unslop`, `apply-aesthetic`, `ux-writing` | ساخت توکن‌های سه‌لایه W3C DTCG (`primitive → semantic → component`)، حذف کلیشه‌های هوش مصنوعی (Anti-Slop)، هویت بصری اصیل و متن رابط کاربری دقیق | صفر کد رنگ هاردکدشده خارج از توکن + هویت بصری غیرکلیشه‌ای + پوشش کامل ۸ وضعیت کامپوننت |
| **۳. پیاده‌سازی فول‌استک و موشن** | `fullstack-dev-skills` (`nextjs-developer`, `react-expert`, `typescript-pro`, `tailwind-v4-shadcn`, `api-designer`, `postgres-pro`), `vercel-react-best-practices`, `vercel-composition-patterns`, `emil-design-eng`, `animate`, `gsap-react` / `motion-dev-animations` | کدنویسی تمیز React 19 / Next.js App Router بدون Waterfall، کامپوننت‌های مقیاس‌پذیر و موشن فقط-GPU با حس فیزیکی دقیق | `typecheck` با `0` خطا + `next build` سبز + صفر انیمیشن مسدودکننده Main Thread |
| **۴. امنیت و تست نفوذ** | `vibe-check` (`detect-stack`, `scan-secrets`, `check-deps`, `probe-url`), `find-security-vulnerabilities-in-code`, `owasp-top-10-testing`, `api-security-testing`, `fix-security-vulnerabilities-with-strix` | کشف کلیدهای افشاشده، رفع آسیب‌پذیری‌های وابستگی‌ها (CVE)، اعتبارسنجی Zod، Rate Limit، جلوگیری از Prototype Pollution و Open Redirect | صفر Secret افشاشده + صفر CVE بحرانی (Critical) + پوشش Zod و Rate Limit روی تمام مسیرهای API |
| **۵. دسترس‌پذیری و استرس UI** | `a11y-audit`, `break-ui`, `design-qa`, `web-design-guidelines`, `design-review` | ممیزی برنامه‌محور کنتراست WCAG 2.2 AA/AAA، تست متن‌های طولانی/خالی/RTL/LTR، لندمارک‌های `<section aria-label>` و تک‌تگ `<h1>` | ۱۰۰٪ عبور کنتراست AA/AAA در هر دو تم روشن و تاریک + صفر شکست چیدمان در موبایل ۳۲۰px و RTL |
| **۶. سئو فنی، GEO و کارایی** | `seo`, `meta-tags-optimizer`, `schema-markup-generator`, `hreflang-international`, `sitemap-audit`, `broken-link-checker`, `geo-optimizer`, `is-agentic`, `image-seo`, `performance` | متادیتای یکپارچه (`canonical`, `hreflang`, OG/Twitter)، JSON-LD معتبر، `sitemap.xml`، صفر لینک ۴۰۴، آمادگی AI (`llms.txt`, `Accept: text/markdown`, `agent-card.json`) و Core Web Vitals | `0` لینک شکسته + `100%` تطابق `canonical`/`hreflang` + صفر CDN فونت رندربلاکینگ + `decoding="async"` روی تصاویر |
| **۷. انتشار و یادگیری مستمر** | `ship`, `gate`, `verification`, `task-observer`, `graphify` (`update`) | تست سرتاسری روی سرور واقعی تولید، به‌روزرسانی گراف دانش، ثبت مشاهدات در `skill-observations/` و انتشار تمیز در گیت | عبور ۱۰۰٪ تست‌های E2E روی بیلد تولید + به‌روزرسانی گراف + ثبت observation جدید |

### اسکیل‌های خارج از دامنه پروژه‌های وب عمومی (عدم فعال‌سازی پیش‌فرض)
برای حفظ سرعت و جلوگیری از آلودگی کانتکست، این دسته‌ها را در پروژه‌های وب عمومی فعال نکنید مگر نیاز صریح دامنه وجود داشته باشد:
- **پلاگین علوم و بیوانفورماتیک (`48` اسکیل):** `alphafold`, `chembl`, `rdkit`, `pymol`, `pubmed`, `clinvar`, `gtex` و...
- **تبلیغات پولی و کمپین (`~28` اسکیل):** خانواده `paid-ads*`, `google-ads*`, `meta-ads*`, `gohighlevel` (فقط برای پروژه‌های تبلیغاتی/فروشگاهی فعال شوند).
- **موبایل بومی، CAD و سه‌بعدی صنعتی:** `android-cli-plugin`, `write-swift`, `animate-expo`, `blender-cad-3d-suite`, سوئیت‌های سنگین تولید ویدیو (مگر پروژه ویدیویی/۳بعدی باشد).

---

## ۳. هفت اصل مهندسی آزموده‌شده در میدان عمل (Anti-Regression Guardrails)

این ۷ اصل از خطاها و کشف‌های واقعی در اجرای پروژه `MAKAREMI-CORE-2026` (`obs-001` تا `obs-005`) استخراج شده‌اند و باید به عنوان **چک‌لیست اجباری در تمام پروژه‌های وب بعدی** رعایت شوند:

1. **مهاجرت و پردازش داده‌های حجیم با «۰ توکن LLM» (Deterministic Offline ETL):**
   - هرگز فایل‌های XML/JSON/CSV بزرگ را برای استخراج یا پاکسازی از طریق پنجره کانتکست مدل زبانی عبور ندهید. اسکریپت Node.js/Python محلی با آشتی عددی ۱۰۰٪ (`inputCount === exported + excluded`) بنویسید.
   - در پروژه‌های فارسی/عربی، نرمال‌سازی حروف عربی (`ك` → `ک`، `ي` → `ی`) را پیش از هر الگوریتم دسته‌بندی کلیدواژه‌ای اجرا کنید (رفع همین یک باگ در این پروژه ۲۰ مقاله اصیل روانکاوی را بازیابی کرد).
   - برای سازگاری با ویندوز (`MAX_PATH`) و APIهای سخت‌گیر، اسلاگ‌های یکتای ASCII (≤ ۶۴ کاراکتر) بسازید و تمام URLهای قدیمی درصد-کدشده را به جدول ریدایرکت `301` منتقل کنید.

2. **تراز کردن وابستگی‌های ریشه در Monorepo:**
   - در مخازن `pnpm` / `turbo`، نسخه‌های پین‌شده در `package.json` ریشه را هم‌زمان با `apps/*/package.json` ممیزی کنید؛ یک نسخه قدیمی فراموش‌شده در ریشه (مانند `next@15.1.0`) حتی زمانی که اپ روی نسخه جدید است، گزارش‌های `pnpm audit` را پر از CVE بحرانی می‌کند.

3. **اندازه‌گیری برنامه‌محور کنتراست WCAG (هرگز چشمی قضاوت نکنید):**
   - در `tokens.css` هر پروژه، اسکریپت محاسبه نسبت روشنایی نسبی (Relative Luminance) را روی تمام جفت‌های متن/پس‌زمینه در هر دو حالت روشن (`light`) و تاریک (`dark`) و سطوح فرورفته (`surface-sunken`) اجرا کنید. خطای کنتراست سفید روی فیروزه‌ای روشن در حالت تاریک (`2.49:1`) صرفاً با محاسبه عددی کشف و رفع شد.

4. **ممیزی دوطرفه تمام لینک‌های پارامتری (`?tab=`, `?filter=`, `?category=`) و کارت‌های پرتال:**
   - هر لینک ناوبری که Query Parameter ارسال می‌کند، باید در صفحه مقصد توسط کامپوننتی با `useSearchParams()` (محصور در `<Suspense>`) خوانده و اعمال شود؛ در غیر این صورت کاربر به وضعیت پیش‌فرض هدایت می‌شود و تجربه «جعبه مرده» شکل می‌گیرد.
   - در سایت‌های چندزبانه، تعویض‌گر زبان (`LanguageSwitcher`) و `hreflang` باید مسیرهای بومی‌شده (مانند `/fr/psychanalyse` ↔ `/fa/psychoanalysis`) را به صورت دوطرفه نگاشت کنند.

5. **تفکیک Rate Limit خزنده‌های AI/GEO از APIهای نوشتنی (`is-agentic`):**
   - مسیرهای خواندنی ویژه‌ی عامل‌های هوش مصنوعی (مانند دوقلوهای `.md`، `/llms.txt`، `/.well-known/agent-card.json`) نباید زیر سقف محدود APIهای سنگین (مثل `100 req/min`) قرار بگیرند؛ وگرنه هنگام خزش کامل آرشیو توسط `GPTBot` یا `ClaudeBot` خطای `429` صادر شده و نمایه‌سازی GEO شکست می‌خورد.
   - پشتیبانی از مذاکره محتوایی `Accept: text/markdown` + هدر `Vary: Accept` + هدرهای RFC 8288 `Link` (`rel="describedby"` و `rel="service-desc"`) در `middleware.ts` سایت را برای نسل جدید ایجنت‌های وب استانداردسازی می‌کند.
   - هرگز `/_next/` را در `robots.txt` مسدود نکنید تا گوگل‌بات بتواند CSS و JS را برای رندر کامل صفحه بارگذاری کند.

6. **فونت خودمیزبان و حذف کامل CDNهای رندربلاکینگ خارجی (LCP + پایداری دسترسی):**
   - فایل متغیر `.woff2` فونت اصلی (مانند `Vazirmatn-Variable.woff2`) را در `public/fonts/` میزبانی کنید، با `<link rel="preload" as="font" crossOrigin="anonymous" />` پیش‌بارگذاری کنید و در `next.config.ts` هدر `Cache-Control: public, max-age=31536000, immutable` بگذارید. حذف ۳ لینک خارجی CDN نه تنها LCP و CLS را بهینه کرد، بلکه ریسک اختلال دسترسی در شبکه‌های محدود را به صفر رساند.

7. **اصل «ادعا بدون اجرای گیت ممنوع» (Live Production Verification Gate):**
   - هیچ فازی را صرفاً بر اساس `typecheck` یا تحلیل استاتیک تکمیل‌شده اعلام نکنید. همیشه بیلد تولید (`next build`) را ساخته، سرور `next start` را بالا آورده و اسکریپت ممیزی زنده را روی HTTP واقعی (وضعیت صفحات، تک‌تگ `<h1>`، `canonical`/`hreflang`، JSON-LD، لینک‌های شکسته، امنیت API و تست‌های End-to-End) اجرا کنید.

---

## ۴. کارنامه کامل ۵ فاز اجرایی در پروژه `MAKAREMI-CORE-2026`

| فاز | شرح اقدامات کلیدی | شناسه کامیت | نتایج تأییدشده |
| :---: | :--- | :---: | :--- |
| **فاز ۱** | نصب پروژه‌ای `graphify`، هوک گیت، `.graphifyignore`، حذف ۳۱ اسکیل تکراری محلی، فعال‌سازی MCP برای `graphify` و `context7` | `4d65884` | صرفه‌جویی **`47.3x`** توکن • کاهش اسکیل محلی از `34` به `3` |
| **فاز ۲** | مهاجرت ۱۰۰٪ خودکار کل فایل XML وردپرس با `0` توکن LLM به Vault جدید، جایگزینی کامل `FALLBACK_*` و همگام‌سازی امضاهای `Ed25519` | `4d65884` | **`3,172 / 3,172`** رکورد آشتی‌داده (`1.12s`، `0` توکن) • `546 / 546` تست |
| **فاز ۳** | ممیزی `vibe-check` (اسرار، CVE، امنیت ۱۷ API)، رفع کنتراست WCAG 2.2 AA/AAA و تست استرس `break-ui` | `08a2ec6` | **`0`** CVE بحرانی • **`30 / 30`** کنتراست AA/AAA • `546 / 546` تست |
| **پیش‌گیت فاز ۴** | ممیزی عمیق مگا منو، ۴ ماتریس صفحه اصلی، فعال‌سازی ۱۹ لینک پارامتری با `useSearchParams`، احیای جعبه‌های مرده، جستجوی زنده `/api/search` و تصحیح ۱۰۰٪ جایگاه رکوردهای XML | `8702fec` | **`748 / 748`** تست زنده ناوبری و محتوا • `2,072` ریدایرکت ۳۰۱ • `546 / 546` تست |
| **فاز ۴** | متادیتای یکپارچه سه‌زبانه در تمام ۲۴ صفحه، `hreflang` متقابل، `ExhibitionEvent`/`VideoObject`/`CreativeWork` JSON-LD، `/opengraph-image`، `Accept: text/markdown`، `agent-card.json`، رفع ۲۹۰+ لینک خراب `/llms.txt`، ممیزی `sitemap.xml`، خزنده لینک شکسته و حذف فونت‌های CDN | `f1c2e22` | **`437 / 437`** ممیزی زنده فاز ۴ • **`730 / 730`** `/llms.txt` سالم • **`279 / 279`** لینک داخلی سالم • TTFB `9.8ms` • `546 / 546` تست |
| **فاز ۵** | تدوین این پلی‌بوک مرجع عمومی، استانداردسازی کامل دفترچه `task-observer v3.10.0` (`skill-observations/`) و بستن چرخه کل پروژه | *(کامیت نهایی فاز ۵)* | پوشش ۱۰۰٪ چرخه عمر وب + ثبت ۶ مشاهده ساختاریافته (`obs-001` تا `0006`) |
