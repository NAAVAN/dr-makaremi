# راهنمای فعال‌سازی عملیاتی تلگرام، واتساپ و قفل امنیتی Production

این راهنما مخصوص زمانی است که دسترسی به **ربات تلگرام** و **واتساپ استاد** آماده شود و بخواهید امنیت ورود به پیشخوان را در سطح حداکثری (Production Fail-Closed) قفل کنید.

---

## گام ۱ — تولید کلیدهای امن Production با یک دستور

در ترمینال پروژه (PowerShell) اجرا کنید:

```powershell
pnpm webhooks:setup --generate-secrets
```

این دستور به‌صورت محلی (بدون ذخیره در کد) مقادیر کاملاً تصادفی و رمزنگاری‌شده زیر را چاپ می‌کند تا مستقیم در بخش **Vercel → Project Settings → Environment Variables (Production)** کپی کنید:

- `SUPER_ADMIN_SECRET` — کلید ارشد مدیریت (هرگز قفل نمی‌شود)
- `MAKAREMI_PROFESSOR_PIN` — گذرواژهٔ قوی اختصاصی استاد (حداقل ۱۲ کاراکتر پیشنهادی، به‌جای پین ۶رقمی)
- `TELEGRAM_WEBHOOK_SECRET` — راز تأیید اصالت وب‌هوک تلگرام
- `WHATSAPP_VERIFY_TOKEN` — توکن تأیید وب‌هوک متا/واتساپ
- *(اختیاری)* `MAKAREMI_SIGNING_KEY` — کلید خصوصی اختصاصی Ed25519 برای امضای دیجیتال آثار و پاسخ‌های طلایی

---

## گام ۲ — اتصال ربات تلگرام استاد (۲ دقیقه)

1. در تلگرام به `@BotFather` پیام دهید، دستور `/newbot` را اجرا کنید و توکن ربات را کپی کنید (`TELEGRAM_BOT_TOKEN`).
2. شناسهٔ عددی تلگرام استاد (مثلاً از `@userinfobot`) را دریافت کنید (`TELEGRAM_PROFESSOR_USER_ID` و `TELEGRAM_PROFESSOR_CHAT_ID`).
3. متغیرهای زیر را در **Vercel Production Env Vars** ثبت و یک بار Redeploy کنید:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_WEBHOOK_SECRET`
   - `TELEGRAM_PROFESSOR_USER_ID`
   - `TELEGRAM_PROFESSOR_CHAT_ID`
4. در پایان، دستور ثبت رسمی وب‌هوک را اجرا کنید:
   ```powershell
   $env:TELEGRAM_BOT_TOKEN="توکن_ربات"
   $env:TELEGRAM_WEBHOOK_SECRET="راز_وبهوک"
   pnpm webhooks:setup --register-telegram --url https://makaremi.com
   ```
5. در پیشخوان ← **موتور و آموزش دستیار هوشمند** ← تب **«ارجاع استاد، همگام‌سازی و امنیت»** روی دکمهٔ **«آزمایش اتصال تلگرام/واتساپ»** کلیک کنید.

---

## گام ۳ — اتصال واتساپ بیزینس استاد (Meta Cloud API)

1. در [Meta for Developers](https://developers.facebook.com) یک App با محصول **WhatsApp** بسازید.
2. مقادیر زیر را در **Vercel Production Env Vars** ثبت کنید:
   - `WHATSAPP_ACCESS_TOKEN` (Permanent System User Token)
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_APP_SECRET` (از Settings → Basic → App Secret)
   - `WHATSAPP_VERIFY_TOKEN` (همان مقدار ساخته‌شده در گام ۱)
   - `WHATSAPP_PROFESSOR_PHONE` (شمارهٔ واتساپ استاد با پیش‌شمارهٔ بین‌المللی، مثل `+336...`)
3. در تنظیمات Webhook واتساپ در کنسول متا:
   - **Callback URL:** `https://makaremi.com/api/webhooks/whatsapp`
   - **Verify Token:** مقدار `WHATSAPP_VERIFY_TOKEN`
   - فیلد `messages` را Subscribe کنید.

---

## گام ۴ — مخفی‌کردن دکمهٔ عمومی پیشخوان پس از اتمام بارگذاری آثار

هر زمان استاد بارگذاری آثار را به پایان رساندند و خواستید دکمهٔ «پیشخوان» از نوار بالای سایت عمومی برداشته شود، کافی است متغیر زیر را در Vercel اضافه کنید:

```env
NEXT_PUBLIC_HIDE_STUDIO_NAV=true
```

از آن پس دکمهٔ «پیشخوان استاد» در منوی بالای سایت عمومی دیده نمی‌شود و صرفاً از طریق نشانی مستقیم `/fa/dashboard` با قفل ۵-تلاشی ضدحملهٔ Brute-Force و گذرواژهٔ قوی قابل ورود است.
