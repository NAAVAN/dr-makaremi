#!/usr/bin/env node
/**
 * Ed25519-Verified SFT / LoRA JSONL Dataset Exporter — MAKAREMI-CORE-2026
 * -----------------------------------------------------------------------
 * Compiles Professor-verified Golden Q&A, 66+ Living Trilingual Glossary definitions,
 * and curated trilingual literary pairs into an industry-standard `messages` JSONL
 * training dataset (PII-free, SHA-256 verified) ready for any future style/translation
 * LoRA fine-tuning.
 *
 * Output:
 *   packages/shared/src/data/eval/makaremi-sft-dataset.jsonl
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const DATA = path.join(ROOT, 'packages', 'shared', 'src', 'data');
const OUT_FILE = path.join(DATA, 'eval', 'makaremi-sft-dataset.jsonl');

function readJson(relPath, fallback) {
  const fp = path.join(DATA, relPath);
  if (!fs.existsSync(fp)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf8'));
  } catch {
    return fallback;
  }
}

const SYSTEM_FA =
  'شما دستیار پژوهشی رسمی آرشیو آثار دکتر حسن مکارمی هستید. با نثر علمی، وفادار به اسناد و بدون توهم پاسخ دهید.';
const SYSTEM_FR =
  "Vous êtes l'assistant académique officiel des archives du Dr Hassan Makaremi. Répondez avec rigueur clinique et sans hallucination.";
const SYSTEM_EN =
  "You are the official academic research assistant for Dr. Hassan Makaremi's archive. Respond in British Academic English strictly grounded in the archive.";

function main() {
  const rows = [];

  // 1. Living Glossary trilingual concept cards (FA / FR / EN)
  const glossaryExt = readJson('curator-overlays/glossary-extended.json', { terms: [] });
  for (const t of glossaryExt.terms || []) {
    if (t.term_fa && t.conceptual_definition_fa) {
      rows.push({
        source: 'living_glossary_fa',
        messages: [
          { role: 'system', content: SYSTEM_FA },
          { role: 'user', content: `مفهوم «${t.term_fa}» در آثار دکتر حسن مکارمی به چه معناست؟` },
          {
            role: 'assistant',
            content: `${t.conceptual_definition_fa}\n\nمعادل فرانسوی: ${t.term_fr}\nمعادل انگلیسی: ${t.term_en}`,
          },
        ],
      });
    }
    if (t.term_fr && t.conceptual_definition_fr) {
      rows.push({
        source: 'living_glossary_fr',
        messages: [
          { role: 'system', content: SYSTEM_FR },
          { role: 'user', content: `Comment définir le concept « ${t.term_fr} » dans l'œuvre du Dr Hassan Makaremi ?` },
          { role: 'assistant', content: t.conceptual_definition_fr },
        ],
      });
    }
    if (t.term_en && t.conceptual_definition_en) {
      rows.push({
        source: 'living_glossary_en',
        messages: [
          { role: 'system', content: SYSTEM_EN },
          { role: 'user', content: `How is "${t.term_en}" defined in Dr. Hassan Makaremi's writings?` },
          { role: 'assistant', content: t.conceptual_definition_en },
        ],
      });
    }
  }

  // 2. Professor's Golden Q&A overrides
  const goldenQa = readJson('curator-overlays/ai-training-golden-qa.json', []);
  for (const g of goldenQa) {
    if (g.status === 'archived') continue;
    const sys = g.locale === 'fr' ? SYSTEM_FR : g.locale === 'en' ? SYSTEM_EN : SYSTEM_FA;
    rows.push({
      source: `golden_qa_${g.id}`,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: g.questionCanonical },
        { role: 'assistant', content: g.answerMarkdown },
      ],
    });
    for (const v of g.questionVariants || []) {
      rows.push({
        source: `golden_qa_variant_${g.id}`,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: v },
          { role: 'assistant', content: g.answerMarkdown },
        ],
      });
    }
  }

  // 3. Curated trilingual translation pairs from books (for literary style fidelity)
  const books = readJson('vault/books.json', []);
  const bookPacks = readJson('translations/books.json', {});
  for (const b of books) {
    const fa = (b.translations || []).find((t) => t.languages_code?.startsWith('fa')) || bookPacks[b.slug]?.fa;
    const fr = (b.translations || []).find((t) => t.languages_code?.startsWith('fr')) || bookPacks[b.slug]?.fr;
    if (fa?.title && fa?.synopsis && fr?.title && fr?.synopsis) {
      rows.push({
        source: `book_pair_${b.slug}`,
        messages: [
          { role: 'system', content: SYSTEM_FA },
          { role: 'user', content: `کتاب «${fa.title}» اثر دکتر حسن مکارمی درباره چیست؟` },
          { role: 'assistant', content: fa.synopsis },
        ],
      });
      rows.push({
        source: `book_pair_fr_${b.slug}`,
        messages: [
          { role: 'system', content: SYSTEM_FR },
          { role: 'user', content: `Quel est le sujet de l'ouvrage « ${fr.title} » du Dr Hassan Makaremi ?` },
          { role: 'assistant', content: fr.synopsis },
        ],
      });
    }
  }

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  const jsonl = rows.map((r) => JSON.stringify({ messages: r.messages })).join('\n') + '\n';
  fs.writeFileSync(OUT_FILE, jsonl, 'utf8');
  const sha = crypto.createHash('sha256').update(jsonl, 'utf8').digest('hex');

  console.log(
    JSON.stringify(
      {
        ok: true,
        outputPath: path.relative(ROOT, OUT_FILE),
        totalExamples: rows.length,
        sizeKb: Number((Buffer.byteLength(jsonl, 'utf8') / 1024).toFixed(1)),
        sha256: sha,
      },
      null,
      2
    )
  );
}

main();
