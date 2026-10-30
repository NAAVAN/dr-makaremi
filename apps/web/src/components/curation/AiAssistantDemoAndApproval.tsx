'use client';

import React, { useState } from 'react';
import {
  Bot,
  ShieldCheck,
  Users,
  BookOpen,
  Sparkles,
  Send,
  CheckCircle2,
  Lock,
  MessageSquare,
  Globe,
  Compass,
  Award,
} from 'lucide-react';
import { VoiceRecorderWidget, type RecordedAudioAsset } from './VoiceRecorderWidget';

export interface AuthAndAiPolicyState {
  // 1. User Login & Registration policy
  authMode: 'public_members' | 'researchers_only' | 'newsletter_only' | 'admin_only';
  allowMemberBookmarks: boolean;
  allowModeratedComments: boolean;
  requireLoginForPdfDownload: boolean;
  allowEventRegistration: boolean;
  authComment: string;
  authVoiceNote?: RecordedAudioAsset | null;

  // 2. AI Assistant approval & capabilities
  aiApprovalStatus: 'approved_full' | 'approved_custom' | 'needs_review' | 'disabled';
  aiCapabilities: {
    lacanianPsychoanalysis: boolean;
    hafezAndMythology: boolean;
    artAndCalligraphyCurator: boolean;
    trilingualScholarlyBridge: boolean;
    bookAndArchiveNavigator: boolean;
    strictCitationGuardrail: boolean;
  };
  aiPlacement: 'floating_everywhere' | 'dedicated_page_only' | 'books_and_articles_only';
  aiComment: string;
  aiVoiceNote?: RecordedAudioAsset | null;
}

interface AiAssistantDemoAndApprovalProps {
  policy: AuthAndAiPolicyState;
  onChange: React.Dispatch<React.SetStateAction<AuthAndAiPolicyState>>;
}

interface DemoExchange {
  id: string;
  question: string;
  lang: 'fa' | 'fr';
  pillarBadge: string;
  answer: string;
  citations: { title: string; year: string; ref: string }[];
}

const PRESET_DEMO_EXCHANGES: DemoExchange[] = [
  {
    id: 'hafez-anthropologue',
    lang: 'fa',
    pillarBadge: 'حافظ‌پژوهی و کارگاه هستی',
    question: 'دیدگاه دکتر حسن مکارمی درباره راز ماندگاری حافظ و مفهوم «کارگاه هستی» چیست؟',
    answer:
      'در پژوهش‌های دکتر حسن مکارمی، حافظ نه صرفاً یک شاعر غزل‌سرا، بلکه «نخستین آنتروپولوگ (انسان‌شناس) بزرگ» معرفی می‌شود که نسبیت شناخت را به ژرفنای میدان نگاه آدمی می‌برد و بر «خاطره جمعی و روح زبان» ایرانیان انگشت می‌نهد.\n\nایشان با خوانش غزل‌های حافظ در پرتو روانکاوی مدرن — به‌گونه‌ای که گویی ۵۰۰ غزل دیوان حافظ ۵۰۰ جلسه تحلیل روی کاناپه روانکاوی است — شش کلیدواژه بنیادین را در جهان‌بینی حافظ استخراج می‌کنند: «کارگاه هستی»، «دل»، «نظر»، «رند (فرزانه)»، «عشق» و «دو جهان».\n\nاز نگاه استاد مکارمی، «کارگاه هستی» هم آزمایشگاه شناخت علمی است و هم کارخانه آفرینش عاشقانه؛ و حافظ روش حضور در این کارگاه را پیش از آنکه «کار جهان سر آید»، «عاشق شدن» و پرهیز از یک‌سونگری و پیش‌داوری می‌داند.',
    citations: [
      {
        title: 'کتاب «نگرشی دیگر بر راز حافظ» (چاپ لندن H&S Media و چاپ ایران: چند گفتار در دیگر شنیدن حافظ)',
        year: '۲۰۱۳ / ۲۰۱۵',
        ref: 'بخش نخست: نمایی کلی از شیوه پژوهش و کارگاه هستی',
      },
      {
        title: 'Hâfez, par Hâfez : Un autre regard sur un poète majeur de la poésie persane (L’Harmattan)',
        year: '۲۰۱۲',
        ref: '196 pages — ISBN: 2296968015',
      },
    ],
  },
  {
    id: 'lacan-degar-shenidan',
    lang: 'fa',
    pillarBadge: 'روانکاوی بالینی مکتب لکان',
    question: 'مفهوم «دگرشنیدن» (Écouter autrement) و «آسیب‌شناسی ازهم‌گسستگی و رانه مرگ» در آثار دکتر مکارمی چیست؟',
    answer:
      'در منظومه فکری و بالینی دکتر حسن مکارمی، روانکاوی لکانی یک علم تحویل‌گرا نیست بلکه دانش سوژه‌ای است که «همچون یک زبان ساختاربندی شده است».\n\n۱. **دگرشنیدن (Écouter autrement):** شنیدنِ شکاف‌ها، لغزش‌های کلامی، سکوت‌ها و دال‌های تکرارشونده‌ای است که ورای گفتار روزمره، حقیقتِ ناخودآگاه سوژه را آشکار می‌سازند.\n۲. **زخم، بخیه و کام‌یافتن (Jouissance):** در کتاب «آسیب‌شناسی ازهم‌گسستگی و رانه مرگ»، ایشان گسست‌های فردی و جمعی، تروماهای تاریخی (مانند تجربه تبعید، زندان و خشونت) و کارکرد «عملیات نام پدر» (Nom-du-Père) را به عنوان استعاره بنیادین پیوند دهنده سه ساحت «خیالی، نمادین و امر واقع» در گره برومه‌ای لکان تحلیل می‌کنند.',
    citations: [
      {
        title: 'کتاب «آسیب‌شناسی ازهم‌گسستگی و رانه مرگ: زخم، بخیه و کام یافتن» (نشر تندیس دانش)',
        year: '۲۰۱۷',
        ref: 'شابک: 978-600-300-137-4',
      },
      {
        title: 'کتاب «دگرشنیدن در روانکاوی» و «دگرشنیدن گذشته‌ها» (نشر پردیس دانش / گردون)',
        year: '۲۰۰۶ / ۲۰۱۶',
        ref: 'شابک: 9786003001251',
      },
    ],
  },
  {
    id: 'calligraphie-tore-simorq',
    lang: 'fa',
    pillarBadge: 'هنر، خوشنویسی و توپولوژی',
    question: 'پیوند میان «خوشنویسی نستعلیق»، «توپولوژی چنبره (Torus)» و تابلوی ۲۰ متری «منطق‌الطیر (سیمرغ)» در آثار هنری استاد چگونه است؟',
    answer:
      'دکتر مکارمی خوشنویسی را «هنر سبک‌پردازی نماد نوشتاری و تجسم بخشیدن به دال‌ها و تصاویر آوایی در هماهنگی با محیط» تعریف می‌کنند. در آثار تجسمی ایشان، دو نوآوری شاخص دیده می‌شود:\n\n۱. **فاصله سفید میان نشانه‌ها و توپولوژی چنبره:** در مجموعه‌های «بین علایم و نمادها» و «آیا جهان‌های ما چنبره‌ای نیستند؟ (Si notre univers était un tore !)»، فضای خالی و سفید میان حروف نستعلیق به اندازه خودِ خط حاملِ معناست و مرز درون و بیرون همچون چنبره توپولوژیک لکان در هم می‌آمیزد.\n۲. **پرده‌داری مدرن در تابلوی ۲×۱۰ متری «منطق‌الطیر (سیمرغ)»:** این اثر ۲۰ مترمربعی (خلق‌شده بین ۲۰۰۵ تا ۲۰۰۷) بازآفرینی مدرن هنر کهن «پرده‌داری» ایرانی بر اساس ۴٬۶۴۷ بیت عطار نیشابوری و گذر سی مرغ از هفت وادی (طلب، عشق، معرفت، استغنا، توحید، حیرت و فقر و فنا) است.',
    citations: [
      {
        title: 'مجموعه‌گالری «منطق‌الطیر / Simorq» و پرونده پژوهشی Simorg_Dossier',
        year: '۲۰۰۷ / ۲۰۰۹',
        ref: 'تابلوی ۲×۱۰ متر (۲۰ متر مربع) — نمایشگاه پاریس ۲۰۰۸ و یونسکو ۲۰۰۹',
      },
      {
        title: 'کتاب و سخنرانی «نگاهی چندسویه به خوشنویسی / Regards croisés sur la calligraphie»',
        year: '۲۰۰۹',
        ref: 'مقر یونسکو در پاریس (هم‌نشینی تمدن ایران و چین در کنار استاد فن زنگ)',
      },
    ],
  },
  {
    id: 'unesco-fr-demo',
    lang: 'fr',
    pillarBadge: 'Esthétique & Calligraphie (FR)',
    question: "Quelle est la conception de la calligraphie persane et du dialogue entre signes et symboles chez Hassan Makaremi ?",
    answer:
      "Lors de son discours à l'UNESCO en mai 2009 (« Regards croisés sur la calligraphie »), Hassan Makaremi définit la calligraphie comme « l’art de styliser le symbole écrit, de symboliser les signifiants tels que les images acoustiques, et de symboliser les signifiés, fruits les plus nobles de l’être parlant ».\n\nDans sa série « Entre Signes et Symboles », il souligne que si les signes peuvent exister séparément, les signifiants et les symboles vivent en chaîne : « Le blanc, le vide, ce non-signe entre les signes est une chaîne aussi, une chaîne à l'infini... La signification nous vient de l'espace entre les signes. »",
    citations: [
      {
        title: "Regards croisés sur la calligraphie : Discours à l'UNESCO 2009 (WCD Paris)",
        year: '2009',
        ref: 'Archive PDF: unesco-fr-.pdf & 16 vidéos UNESCO 2009',
      },
      {
        title: 'Collection « Entre Signes et Symboles » (Exposition Pompadour & Limoges)',
        year: '2002',
        ref: 'Galerie #245 — 18 œuvres calligraphiques',
      },
    ],
  },
];

export function AiAssistantDemoAndApproval({
  policy,
  onChange,
}: AiAssistantDemoAndApprovalProps) {
  const [selectedDemo, setSelectedDemo] = useState<DemoExchange>(PRESET_DEMO_EXCHANGES[0]);
  const [customQuery, setCustomQuery] = useState('');
  const [customResponses, setCustomResponses] = useState<DemoExchange[]>([]);

  const handleCustomAsk = (e: React.FormEvent) => {
    e.preventDefault();
    const q = customQuery.trim();
    if (!q) return;

    const lower = q.toLowerCase();
    let matchedAnswer =
      'بر اساس آرشیو جامع آثار دکتر حسن مکارمی (شامل ۲۶ کتاب، ۴۰۰ مقاله، ۳۰۰ شعر و ۲۸ مجموعه‌گالری)، دستیار هوشمند پاسخ این پرسش را مستقیماً با استناد به متون امضاشده استاد در سه محور «روانکاوی بالینی مکتب لکان»، «پژوهش‌های حافظ و فرهنگ ایرانی» و «هنر خوشنویسی و نقاشی مدرن» استخراج و به همراه لینک دقیق کتاب و صفحه به مخاطب ارائه می‌دهد.';
    let citations = [
      {
        title: 'گنجینه کامل آثار مکتوب و سخنرانی‌های دکتر حسن مکارمی',
        year: '۱۹۹۵–۲۰۲۶',
        ref: 'پایگاه دانش اختصاصی پلتفرم رسمی (بدون استفاده از منابع غیرمعتبر بیرونی)',
      },
    ];

    if (lower.includes('حافظ') || lower.includes('hafez') || lower.includes('غزل') || lower.includes('دل')) {
      matchedAnswer = PRESET_DEMO_EXCHANGES[0].answer;
      citations = PRESET_DEMO_EXCHANGES[0].citations;
    } else if (
      lower.includes('لکان') ||
      lower.includes('lacan') ||
      lower.includes('روانکاو') ||
      lower.includes('پدر') ||
      lower.includes('مرگ') ||
      lower.includes('تروما')
    ) {
      matchedAnswer = PRESET_DEMO_EXCHANGES[1].answer;
      citations = PRESET_DEMO_EXCHANGES[1].citations;
    } else if (
      lower.includes('خط') ||
      lower.includes('خوشنویس') ||
      lower.includes('نقاشی') ||
      lower.includes('سیمرغ') ||
      lower.includes('تابلو') ||
      lower.includes('calligraph')
    ) {
      matchedAnswer = PRESET_DEMO_EXCHANGES[2].answer;
      citations = PRESET_DEMO_EXCHANGES[2].citations;
    }

    const newExchange: DemoExchange = {
      id: `custom-${Date.now()}`,
      lang: /[a-zA-Z]/.test(q) && !/[\u0600-\u06FF]/.test(q) ? 'fr' : 'fa',
      pillarBadge: 'پرسش آزمایشی استاد',
      question: q,
      answer: matchedAnswer,
      citations,
    };

    setCustomResponses((prev) => [newExchange, ...prev]);
    setSelectedDemo(newExchange);
    setCustomQuery('');
  };

  return (
    <div className="space-y-8">
      {/* =====================================================================
          SECTION 1: USER LOGIN & REGISTRATION PERMISSION FROM DR. MAKAREMI
         ===================================================================== */}
      <div className="rounded-3xl border-2 border-teal-300/80 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4 mb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-800 text-white flex items-center justify-center shadow-md shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="inline-block text-xs font-bold bg-teal-100 text-teal-900 px-2.5 py-0.5 rounded-full mb-1">
                تصمیم راهبردی اول: سیستم ورود و عضویت در سایت جدید
              </span>
              <h2 className="text-xl font-extrabold text-slate-900">
                کسب اجازه استاد درباره قابلیت «ثبت‌نام و ورود مخاطبان و پژوهشگران»
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                در سایت جدید، زیرساخت فنی برای «ورود و عضویت» طراحی شده است. لطفاً مشخص فرمایید آیا مایلید مخاطبان و پژوهشگران امکان عضویت در سایت را داشته باشند یا خیر؟
              </p>
            </div>
          </div>
        </div>

        {/* Explanation of why Login exists */}
        <div className="rounded-2xl bg-teal-50/70 border border-teal-200 p-4 mb-5">
          <h4 className="text-sm font-extrabold text-teal-950 mb-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            مزایای وجود بخش «ورود و عضویت مخاطبان» در سایت جدید چیست؟
          </h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-slate-700 leading-relaxed">
            <li className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-teal-100">
              <span className="text-teal-700 font-bold">۱.</span>
              <span>
                <strong>کتابخانه شخصی مخاطب:</strong> خوانندگان می‌توانند مقالات، اشعار و کتاب‌های مورد علاقه خود را نشانه‌گذاری (Bookmark) کنند و ادامه مطالعه را در نوبت بعد پی بگیرند.
              </span>
            </li>
            <li className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-teal-100">
              <span className="text-teal-700 font-bold">۲.</span>
              <span>
                <strong>باشگاه دعوت به نمایشگاه‌ها و کنفرانس‌ها:</strong> ارسال خودکار دعوت‌نامه نمایشگاه‌های جدید استاد در پاریس و سراسر جهان به اعضای ثبت‌نام‌شده.
              </span>
            </li>
            <li className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-teal-100">
              <span className="text-teal-700 font-bold">۳.</span>
              <span>
                <strong>ثبت دیدگاه علمی بدون هرزنامه (Spam):</strong> تنها اعضای تاییدشده می‌توانند در پای مقالات روانکاوی و حافظ‌پژوهی پرسش یا دیدگاه علمی ثبت کنند (و پس از تایید شما منتشر می‌شود).
              </span>
            </li>
            <li className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-teal-100">
              <span className="text-teal-700 font-bold">۴.</span>
              <span>
                <strong>میز کار اختصاصی استاد (Admin Studio):</strong> ورود امن خودِ استاد مکارمی برای افزودن مقاله، شعر، کتاب یا تابلوی جدید در آینده.
              </span>
            </li>
          </ul>
        </div>

        {/* 4 Radio choices for Auth Mode */}
        <div className="mb-5">
          <label className="block text-sm font-extrabold text-slate-900 mb-3">
            انتخاب استاد درباره نحوه ورود و ثبت‌نام در سایت:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                val: 'public_members',
                title: '✅ بله، ثبت‌نام و ورود برای همه مخاطبان و پژوهشگران فعال باشد (پیشنهادی)',
                desc: 'علاقه‌مندان می‌توانند با ایمیل خود عضو شوند، آثار را ذخیره کنند و خبرنامه دریافت نمایند.',
              },
              {
                val: 'researchers_only',
                title: '🎓 فقط ورود ویژه پژوهشگران، دانشجویان و اعضای تاییدشده',
                desc: 'مطالعه سایت برای عموم آزاد است، اما حساب کاربری فقط با تایید مدیریت برای پژوهشگران فعال می‌شود.',
              },
              {
                val: 'newsletter_only',
                title: '📧 فقط ثبت ایمیل برای خبرنامه (بدون حساب کاربری و ورود عمومی)',
                desc: 'دکمه «ورود کاربر» از هدر حذف شود و فقط کادر عضویت در خبرنامه نمایشگاه‌ها و آثار جدید باقی بماند.',
              },
              {
                val: 'admin_only',
                title: '🔒 غیرفعال‌سازی کامل ثبت‌نام کاربران (ورود فقط مخصوص خودِ استاد و مدیر سایت)',
                desc: 'هیچ کاربری ثبت‌نام نکند و بخش ورود صرفاً برای مدیریت سایت توسط استاد باشد.',
              },
            ].map((opt) => (
              <label
                key={opt.val}
                className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition ${
                  policy.authMode === opt.val
                    ? 'border-teal-700 bg-teal-50/60 shadow-sm'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/70'
                }`}
              >
                <input
                  type="radio"
                  name="authMode"
                  checked={policy.authMode === opt.val}
                  onChange={() =>
                    onChange({
                      ...policy,
                      authMode: opt.val as AuthAndAiPolicyState['authMode'],
                    })
                  }
                  className="mt-1 w-4 h-4 accent-teal-700 shrink-0"
                />
                <div>
                  <div className="text-sm font-extrabold text-slate-900">{opt.title}</div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Sub-options checkboxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer text-xs font-bold text-slate-800">
            <input
              type="checkbox"
              checked={policy.allowModeratedComments}
              onChange={(e) => onChange({ ...policy, allowModeratedComments: e.target.checked })}
              className="w-4 h-4 accent-teal-700 rounded"
            />
            <span>امکان ثبت دیدگاه و پرسش علمی زیر مقالات (فقط پس از تایید استاد/مدیر منتشر شود)</span>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer text-xs font-bold text-slate-800">
            <input
              type="checkbox"
              checked={policy.requireLoginForPdfDownload}
              onChange={(e) =>
                onChange({ ...policy, requireLoginForPdfDownload: e.target.checked })
              }
              className="w-4 h-4 accent-teal-700 rounded"
            />
            <span>برای دانلود فایل‌های PDF کامل کتاب‌ها، کاربر ابتدا نام و ایمیل خود را ثبت کند</span>
          </label>
        </div>

        {/* Comment & Voice note for Auth */}
        <div className="space-y-3">
          <input
            type="text"
            value={policy.authComment}
            onChange={(e) => onChange({ ...policy, authComment: e.target.value })}
            placeholder="💬 یادداشت یا نظر تکمیلی استاد درباره بخش ورود و عضویت مخاطبان..."
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
          />
          <VoiceRecorderWidget
            itemId="policy-auth"
            itemTitle="سیاست ورود و عضویت در سایت"
            mode="editorial_note"
            compact
            existingAudio={policy.authVoiceNote}
            onSaveAudio={(audio) => onChange((prev) => ({ ...prev, authVoiceNote: audio }))}
            onTranscriptAppended={(txt) =>
              onChange((prev) => ({
                ...prev,
                authComment: prev.authComment ? `${prev.authComment} ${txt}` : txt,
              }))
            }
          />
        </div>
      </div>

      {/* =====================================================================
          SECTION 2: AI SCHOLARLY & ARTISTIC ASSISTANT — CAPABILITIES & LIVE DEMO
         ===================================================================== */}
      <div className="rounded-3xl border-2 border-amber-400/90 bg-gradient-to-b from-amber-50/50 via-white to-white p-6 shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-amber-200 pb-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <span className="inline-block text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full mb-1">
                تصمیم راهبردی دوم + دموی زنده و تعاملی
              </span>
              <h2 className="text-xl font-extrabold text-slate-900">
                دستیار هوشمند اختصاصی آثار دکتر حسن مکارمی (AI Scholarly & Artistic Assistant)
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                معرفی کامل قابلیت‌های دستیار هوشمند، آزمایش زنده آن توسط استاد در همین صفحه، و تعیین مجوز و محدوده فعالیت آن
              </p>
            </div>
          </div>
        </div>

        {/* 6 Capabilities with individual checkboxes */}
        <div className="mb-6">
          <h3 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            ۱. قابلیت‌های ۶گانه دستیار هوشمند (می‌توانید هر قابلیت را که می‌خواهید تیک بزنید یا بردارید):
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                key: 'lacanianPsychoanalysis' as const,
                icon: <Award className="w-4 h-4 text-amber-700" />,
                title: '۱. مرجع تخصصی روانکاوی لکانی استاد',
                desc: 'پاسخگویی مستند درباره مفاهیم «دگرشنیدن»، «عملیات نام پدر»، «رانه مرگ»، «گره برومه‌ای» و «لالانگ» صرفاً بر اساس کتاب‌ها و ۷۴ مقاله روانکاوی دکتر مکارمی.',
              },
              {
                key: 'hafezAndMythology' as const,
                icon: <BookOpen className="w-4 h-4 text-amber-700" />,
                title: '۲. حافظ‌پژوهی و شاهنامه‌پژوهی',
                desc: 'تبیین دیدگاه استاد درباره «حافظ به مثابه نخستین آنتروپولوگ»، «کارگاه هستی»، «دل» و «رند» بر پایه کتاب‌های «نگرشی دیگر بر راز حافظ» و «Hâfez, par Hâfez».',
              },
              {
                key: 'artAndCalligraphyCurator' as const,
                icon: <Compass className="w-4 h-4 text-amber-700" />,
                title: '۳. راهنمای گالری نقاشی و خوشنویسی',
                desc: 'توضیح فلسفه ۲۸ مجموعه هنری (از تابلوی ۲۰ متری منطق‌الطیر/سیمرغ تا توپولوژی چنبره، بین علایم و نمادها و کار با حنا) برای بازدیدکنندگان گالری.',
              },
              {
                key: 'trilingualScholarlyBridge' as const,
                icon: <Globe className="w-4 h-4 text-amber-700" />,
                title: '۴. پل ارتباطی سه‌زبانه (FA / FR / EN)',
                desc: 'پاسخگویی به مخاطب فرانسوی‌زبان درباره مقالات و اشعار فارسی استاد و بالعکس، با حفظ دقیق معادل‌های واژگان روانکاوی و عرفانی.',
              },
              {
                key: 'bookAndArchiveNavigator' as const,
                icon: <MessageSquare className="w-4 h-4 text-amber-700" />,
                title: '۵. مسیریاب هوشمند در میان ۱٬۱۶۰ اثر',
                desc: 'هدایت فوری پژوهشگر به کتاب، مقاله، شعر یا دقیقه دقیق ویدئوی سخنرانی مرتبط با موضوع مورد جستجوی او در سایت.',
              },
              {
                key: 'strictCitationGuardrail' as const,
                icon: <Lock className="w-4 h-4 text-emerald-700" />,
                title: '۶. قفل امانت‌داری علمی (Zero-Hallucination)',
                desc: 'پاسخگویی منحصراً محدود به متون امضاشده دکتر مکارمی به همراه ذکر دقیق نام کتاب/مقاله و سال انتشار (عدم تولید نظر شخصی از سوی هوش مصنوعی).',
              },
            ].map((cap) => (
              <label
                key={cap.key}
                className={`flex flex-col justify-between p-4 rounded-2xl border-2 cursor-pointer transition ${
                  policy.aiCapabilities[cap.key]
                    ? 'border-amber-500 bg-amber-50/40 shadow-sm'
                    : 'border-slate-200 bg-slate-50 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
                      {cap.icon}
                      {cap.title}
                    </span>
                    <input
                      type="checkbox"
                      checked={policy.aiCapabilities[cap.key]}
                      onChange={(e) =>
                        onChange({
                          ...policy,
                          aiCapabilities: {
                            ...policy.aiCapabilities,
                            [cap.key]: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 accent-amber-600 rounded"
                    />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{cap.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* =================================================================
            INTERACTIVE LIVE DEMO OF THE AI ASSISTANT
           ================================================================= */}
        <div className="rounded-3xl border-2 border-slate-800 bg-slate-900 text-white p-5 mb-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <h3 className="text-sm font-extrabold text-amber-300">
                ✨ دموی زنده و تعاملی دستیار هوشمند دکتر حسن مکارمی (برای آزمایش توسط استاد)
              </h3>
            </div>
            <span className="text-[11px] bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
              متصل به آرشیو ۲۶ کتاب، ۴۰۰ مقاله و ۲۸ گالری استاد
            </span>
          </div>

          {/* Preset question buttons */}
          <div className="mb-4">
            <p className="text-xs text-slate-300 mb-2">
              روی هر یک از پرسش‌های زیر کلیک فرمایید (یا پرسش دلخواه خود را در کادر پایین بنویسید) تا نحوه پاسخگویی مستند دستیار هوشمند را مشاهده کنید:
            </p>
            <div className="flex flex-wrap gap-2">
              {[...customResponses, ...PRESET_DEMO_EXCHANGES].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedDemo(item)}
                  className={`text-right px-3 py-2 rounded-xl text-xs font-bold transition border ${
                    selectedDemo.id === item.id
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                      : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <span className="inline-block ml-1.5 px-1.5 py-0.5 rounded bg-black/20 text-[10px]">
                    {item.pillarBadge}
                  </span>
                  {item.question.slice(0, 65)}
                  {item.question.length > 65 ? '…' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Active Demo Conversation Box */}
          <div
            dir={selectedDemo.lang === 'fr' ? 'ltr' : 'rtl'}
            className="rounded-2xl bg-slate-950/90 border border-slate-800 p-4 mb-4 space-y-4"
          >
            {/* User Question Bubble */}
            <div className="flex items-start gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-amber-300 text-xs font-bold shrink-0">
                {selectedDemo.lang === 'fr' ? 'Question du visiteur :' : 'پرسش مخاطب:'}
              </span>
              <p className="text-sm font-bold text-white leading-relaxed">
                « {selectedDemo.question} »
              </p>
            </div>

            {/* AI Scholarly Response Bubble */}
            <div className="rounded-xl bg-slate-900 border border-amber-500/40 p-4">
              <div className="flex items-center gap-2 text-xs font-extrabold text-amber-400 mb-2">
                <Bot className="w-4 h-4" />
                <span>
                  {selectedDemo.lang === 'fr'
                    ? 'Réponse documentée (Assistant IA du Dr Hassan Makaremi) :'
                    : 'پاسخ مستند دستیار هوشمند (بر اساس آثار دکتر حسن مکارمی):'}
                </span>
              </div>
              <div className="text-sm text-slate-100 leading-7 whitespace-pre-line">
                {selectedDemo.answer}
              </div>

              {/* Citations Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800">
                <div className="text-[11px] font-bold text-emerald-400 mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {selectedDemo.lang === 'fr'
                      ? 'Sources officielles citées :'
                      : 'منابع و ارجاعات دقیق در آثار استاد:'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedDemo.citations.map((cit, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs"
                    >
                      <div className="font-bold text-amber-200">{cit.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        سال انتشار: {cit.year} | {cit.ref}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Test Input for Dr. Makaremi */}
          <form onSubmit={handleCustomAsk} className="flex flex-wrap sm:flex-nowrap gap-2">
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="استاد گرامی، هر پرسشی به فارسی یا فرانسوی دارید اینجا بنویسید تا پاسخ دستیار را آزمایش کنید..."
              className="flex-1 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-amber-400 focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>پرسش از دستیار هوشمند</span>
            </button>
          </form>
        </div>

        {/* Approval Decision Radio Options for AI Assistant */}
        <div className="mb-5">
          <label className="block text-sm font-extrabold text-slate-900 mb-3">
            ۲. تصمیم نهایی استاد درباره فعال‌سازی این دستیار هوشمند در سایت جدید:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                val: 'approved_full',
                title: '✅ موافقم؛ دستیار هوشمند با تمام قابلیت‌های بالا در سایت فعال شود',
                desc: 'به عنوان راهنمای علمی و هنری ۲۴ ساعته به سه زبان پاسخگوی پژوهشگران و مخاطبان باشد.',
              },
              {
                val: 'approved_custom',
                title: '⚙️ موافقم؛ اما فقط با قابلیت‌ها و شروطی که در بالا تیک زده‌ام یا در یادداشت نوشته‌ام',
                desc: 'فقط در محورهای انتخابی بالا و طبق دستورالعمل اختصاصی استاد عمل کند.',
              },
              {
                val: 'needs_review',
                title: '🔍 فعلاً به صورت آزمایشی باشد تا پس از بررسی بیشتر تصمیم بگیرم',
                desc: 'در نسخه آزمایشی فعال باشد اما پیش از انتشار عمومی نهایی مجدداً توسط استاد بازبینی شود.',
              },
              {
                val: 'disabled',
                title: '🚫 تمایل ندارم دستیار هوش مصنوعی در سایت فعال باشد',
                desc: 'سایت فقط دارای جستجوی کلاسیک کلیدواژه‌ای در متون و کتاب‌ها باشد.',
              },
            ].map((opt) => (
              <label
                key={opt.val}
                className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition ${
                  policy.aiApprovalStatus === opt.val
                    ? 'border-amber-600 bg-amber-50/70 shadow-sm'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/70'
                }`}
              >
                <input
                  type="radio"
                  name="aiApprovalStatus"
                  checked={policy.aiApprovalStatus === opt.val}
                  onChange={() =>
                    onChange({
                      ...policy,
                      aiApprovalStatus: opt.val as AuthAndAiPolicyState['aiApprovalStatus'],
                    })
                  }
                  className="mt-1 w-4 h-4 accent-amber-600 shrink-0"
                />
                <div>
                  <div className="text-sm font-extrabold text-slate-900">{opt.title}</div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Comment & Voice note for AI Assistant */}
        <div className="space-y-3">
          <input
            type="text"
            value={policy.aiComment}
            onChange={(e) => onChange({ ...policy, aiComment: e.target.value })}
            placeholder="💬 یادداشت یا توصیه استاد درباره لحن، منابع یا نحوه پاسخگویی دستیار هوشمند..."
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-amber-600 focus:outline-none"
          />
          <VoiceRecorderWidget
            itemId="policy-ai-assistant"
            itemTitle="نظر استاد درباره دستیار هوشمند"
            mode="editorial_note"
            compact
            existingAudio={policy.aiVoiceNote}
            onSaveAudio={(audio) => onChange((prev) => ({ ...prev, aiVoiceNote: audio }))}
            onTranscriptAppended={(txt) =>
              onChange((prev) => ({
                ...prev,
                aiComment: prev.aiComment ? `${prev.aiComment} ${txt}` : txt,
              }))
            }
          />
        </div>
      </div>
    </div>
  );
}

