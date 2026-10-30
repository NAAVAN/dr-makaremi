'use client';

import React, { useState, useEffect } from 'react';
import type { ArticleComment } from '@/lib/agents/types';

export default function CommentModerationSimulator() {
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [newAuthor, setNewAuthor] = useState('مریم رضایی (دانشجوی دکتری)');
  const [newEmail, setNewEmail] = useState('rezaei@sorbonne.fr');
  const [newContent, setNewContent] = useState('دیدگاه من پیرامون نقش سوژه در آثار فرانسوی دکتر مکارمی و خوانش پدیدارشناسانه.');
  const [honeypot, setHoneypot] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');
  const [analytics, setAnalytics] = useState<{
    dailyVisits: number;
    monthlyVisits: number;
    mirrorHealth: string;
    activeCnrsPapers: number;
  } | null>(null);

  const loadComments = async () => {
    try {
      const res = await fetch('/api/comments?article_slug=is-psychoanalysis-a-science');
      const data = await res.json();
      if (data.ok && data.comments) {
        setComments(data.comments);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAnalytics = async () => {
    try {
      const res = await fetch('/api/webhooks/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Bot-Api-Secret-Token': 'makaremi-tg-secret-2026',
        },
        body: JSON.stringify({
          update_id: Date.now(),
          callback_query: {
            id: `cb_analytics_${Date.now()}`,
            from: { id: 19501329, username: 'hassan_makaremi' },
            data: 'analytics_status',
          },
        }),
      });
      const data = await res.json();
      if (data.ok && data.report) {
        setAnalytics(data.report);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadComments();
    loadAnalytics();
  }, []);

  const handleSubmitComment = async () => {
    setSubmitStatus('در حال ثبت...');
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_slug: 'is-psychoanalysis-a-science',
          locale: 'fa',
          author_name: newAuthor,
          author_email: newEmail,
          content: newContent,
          website_url_hp: honeypot,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitStatus('دیدگاه ثبت شد و در انتظار تایید تلگرام/واتس‌اپ استاد قرار گرفت.');
        loadComments();
      } else {
        setSubmitStatus(`خطا: ${data.error || 'ارسال ناموفق'}`);
      }
    } catch {
      setSubmitStatus('خطا در ارتباط با سرور.');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Analytics Dashboard Strip */}
      <div>
        <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            پایش هوشمند وضعیت آینه‌های ضدسانسور و آمار
          </h3>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
            {analytics?.mirrorHealth || 'Edge Active'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400">بازدید روزانه</div>
            <div className="text-lg font-bold text-white font-mono mt-0.5">
              {analytics?.dailyVisits.toLocaleString() || '1,420'}
            </div>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400">بازدید ماهانه</div>
            <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">
              {analytics?.monthlyVisits.toLocaleString() || '38,450'}
            </div>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400">پروژه‌های CNRS</div>
            <div className="text-lg font-bold text-sky-400 font-mono mt-0.5">
              {analytics?.activeCnrsPapers || '12'}
            </div>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400">وضعیت کش لبه</div>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
              100% Hit
            </div>
          </div>
        </div>
      </div>

      {/* Comment Moderation Simulator */}
      <div className="pt-4 border-t border-slate-800">
        <h3 className="text-sm font-bold text-white mb-3">
          مدیریت تعاملی نظرات کاربران و پاسخ صوتی استاد
        </h3>

        {/* List of Comments */}
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-800/60">
                <span className="font-semibold text-white">{c.authorName}</span>
                <span className="text-slate-500 font-mono">{c.createdAt.split('T')[0]}</span>
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">{c.content}</p>

              {c.professorReply && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs">
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <span>🎙️ پاسخ صوتی ویراستاری‌شده دکتر مکارمی:</span>
                  </div>
                  <p className="text-slate-200 mt-1">{c.professorReply.text}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Comment Submission Form with Honeypot */}
        <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="text-xs font-semibold text-slate-300">
            آزمایش ثبت دیدگاه جدید (مجهز به تله Honeypot و فیلتر ضد تزریق پرامپت):
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input
              type="text"
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              placeholder="نام و عنوان شما"
              className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white"
            />
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="ایمیل دانشگاهی یا رسمی"
              className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white"
            />
          </div>

          {/* Hidden Honeypot Input */}
          <input
            type="text"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            style={{ display: 'none' }}
          />

          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={2}
            className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white"
          />

          <div className="flex items-center justify-between">
            <button
              onClick={handleSubmitComment}
              className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg transition-colors"
            >
              ارسال دیدگاه برای بررسی ایجنت
            </button>
            {submitStatus && (
              <span className="text-xs text-amber-400 font-medium">{submitStatus}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
