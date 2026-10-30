import React from 'react';
import type { LacanianGlossaryTerm } from '@makaremi/shared';

export interface RenderMarkdownOptions {
  glossaryTerms?: LacanianGlossaryTerm[];
  onTermClick?: (term: LacanianGlossaryTerm) => void;
}

/**
 * Pure AST-like Markdown-to-React parser without dangerouslySetInnerHTML.
 * Guarantees zero XSS injection while transforming headers, lists, quotes,
 * bold/italics, and automatically highlighting Lacanian glossary terms.
 */
export function renderSafeMarkdown(
  markdownText: string,
  options: RenderMarkdownOptions = {}
): React.ReactNode {
  if (!markdownText) return null;

  const lines = markdownText.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  function flushList() {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-4 list-disc space-y-1 pr-6 pl-6 leading-relaxed">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Code blocks ```
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        flushList();
        elements.push(
          <pre
            key={`code-${i}`}
            className="my-4 overflow-x-auto rounded-lg bg-[var(--surface-sunken)] p-4 text-sm font-mono text-[var(--foreground)] border border-[var(--border-subtle)]"
          >
            <code>{codeBuffer.join('\n')}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    // Empty line
    if (!line) {
      flushList();
      continue;
    }

    // Horizontal Rule
    if (line === '---' || line === '***' || line === '___') {
      flushList();
      elements.push(<hr key={`hr-${i}`} className="my-6 border-t border-[var(--border-subtle)]" />);
      continue;
    }

    // Headings (H2, H3, H4) - H1 is strictly reserved for the page title
    if (line.startsWith('#### ')) {
      flushList();
      elements.push(
        <h4 key={`h4-${i}`} className="mt-6 mb-2 text-base font-bold text-[var(--foreground)]">
          {renderInlineText(line.slice(5), options, `h4-${i}`)}
        </h4>
      );
      continue;
    }
    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${i}`} className="mt-8 mb-3 text-lg font-bold text-[var(--foreground)]">
          {renderInlineText(line.slice(4), options, `h3-${i}`)}
        </h3>
      );
      continue;
    }
    if (line.startsWith('## ') || line.startsWith('# ')) {
      flushList();
      // Downcast # to h2 to preserve single-H1 rule
      const content = line.startsWith('## ') ? line.slice(3) : line.slice(2);
      elements.push(
        <h2 key={`h2-${i}`} className="mt-10 mb-4 text-xl font-bold tracking-tight text-[var(--foreground)] border-b border-[var(--border-subtle)] pb-2">
          {renderInlineText(content, options, `h2-${i}`)}
        </h2>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="my-4 border-s-4 border-[var(--primary)] bg-[var(--surface-sunken)] p-4 rounded-e-lg text-base italic leading-relaxed text-[var(--foreground-muted)]"
        >
          {renderInlineText(line.slice(2), options, `quote-${i}`)}
        </blockquote>
      );
      continue;
    }

    // Unordered List (- or *)
    if (line.startsWith('- ') || line.startsWith('* ')) {
      inList = true;
      listItems.push(
        <li key={`li-${i}`} className="text-base text-[var(--foreground)]">
          {renderInlineText(line.slice(2), options, `li-${i}`)}
        </li>
      );
      continue;
    }

    // Numbered List (1. )
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      flushList();
      elements.push(
        <div key={`num-${i}`} className="my-2 flex items-start gap-2 text-base text-[var(--foreground)]">
          <span className="font-semibold text-[var(--primary)] min-w-[1.5rem]">{numberedMatch[1]}.</span>
          <div>{renderInlineText(numberedMatch[2], options, `num-txt-${i}`)}</div>
        </div>
      );
      continue;
    }

    // Regular Paragraph
    flushList();
    elements.push(
      <p key={`p-${i}`} className="my-4 text-base leading-loose text-[var(--foreground)]">
        {renderInlineText(line, options, `p-${i}`)}
      </p>
    );
  }

  flushList();
  return <div className="prose-content">{elements}</div>;
}

/**
 * Parses inline formatting (bold, italic, code, links) and injects Lacanian glossary triggers.
 */
function renderInlineText(
  text: string,
  options: RenderMarkdownOptions,
  keyPrefix: string
): React.ReactNode[] {
  // 1. Process inline links [title](url) safely
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const beforeText = text.substring(lastIndex, match.index);
      parts.push(...processFormattingAndGlossary(beforeText, options, `${keyPrefix}-pre-${lastIndex}`));
    }
    const linkTitle = match[1];
    const linkUrl = match[2];
    const isExternal = linkUrl.startsWith('http');
    parts.push(
      <a
        key={`${keyPrefix}-link-${match.index}`}
        href={linkUrl}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className="text-[var(--primary)] underline underline-offset-4 hover:opacity-80 transition-opacity"
      >
        {linkTitle}
      </a>
    );
    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    const remaining = text.substring(lastIndex);
    parts.push(...processFormattingAndGlossary(remaining, options, `${keyPrefix}-post-${lastIndex}`));
  }

  return parts;
}

/**
 * Processes bold, italic, code tags, and glossary terms
 */
function processFormattingAndGlossary(
  segment: string,
  options: RenderMarkdownOptions,
  prefix: string
): React.ReactNode[] {
  // Look for `code`, **bold**, *italic*
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const tokens: React.ReactNode[] = [];
  let lastIdx = 0;
  let m: RegExpExecArray | null;

  while ((m = tokenRegex.exec(segment)) !== null) {
    if (m.index > lastIdx) {
      const plainText = segment.substring(lastIdx, m.index);
      tokens.push(...injectGlossaryTerms(plainText, options, `${prefix}-txt-${lastIdx}`));
    }
    const token = m[1];
    if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push(
        <code
          key={`${prefix}-code-${m.index}`}
          className="rounded bg-[var(--surface-sunken)] px-1.5 py-0.5 font-mono text-sm border border-[var(--border-subtle)] text-[var(--primary)]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      tokens.push(
        <strong key={`${prefix}-b-${m.index}`} className="font-bold text-[var(--foreground)]">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      tokens.push(
        <em key={`${prefix}-i-${m.index}`} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIdx = tokenRegex.lastIndex;
  }

  if (lastIdx < segment.length) {
    const remainingText = segment.substring(lastIdx);
    tokens.push(...injectGlossaryTerms(remainingText, options, `${prefix}-rem-${lastIdx}`));
  }

  return tokens;
}

/**
 * Searches for registered Lacanian glossary terms and renders an accessible trigger.
 */
function injectGlossaryTerms(
  text: string,
  options: RenderMarkdownOptions,
  prefix: string
): React.ReactNode[] {
  const terms = options.glossaryTerms || [];
  if (!terms.length) {
    return [<React.Fragment key={`${prefix}-raw`}>{text}</React.Fragment>];
  }

  // Build regex matching all known glossary terms in fa, fr, and en
  const escapedTerms = terms
    .flatMap((t) => [t.term_fa, t.term_fr, t.term_en].filter(Boolean))
    .filter((w) => w.length > 2)
    .sort((a, b) => b.length - a.length)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (!escapedTerms.length) {
    return [<React.Fragment key={`${prefix}-raw`}>{text}</React.Fragment>];
  }

  const glossaryRegex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = glossaryRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push(text.substring(lastIndex, match.index));
    }
    const matchedWord = match[1];
    const termObj = terms.find(
      (t) =>
        t.term_fa.toLowerCase() === matchedWord.toLowerCase() ||
        t.term_fr.toLowerCase() === matchedWord.toLowerCase() ||
        t.term_en.toLowerCase() === matchedWord.toLowerCase()
    );

    if (termObj) {
      result.push(
        <span
          key={`${prefix}-glossary-${match.index}`}
          className="group relative inline-block cursor-help border-b-2 border-dotted border-[var(--color-psychoanalysis)] text-[var(--color-psychoanalysis)] font-medium"
          title={`${termObj.term_fa} | ${termObj.term_fr} (${termObj.term_en}): ${termObj.conceptual_definition_fa}`}
        >
          {matchedWord}
          <span className="pointer-events-none absolute bottom-full start-1/2 z-30 mb-2 hidden -translate-x-1/2 w-64 rounded-lg bg-[var(--surface-overlay)] p-3 text-xs shadow-xl border border-[var(--border-subtle)] text-[var(--foreground)] group-hover:block transition-all duration-200">
            <span className="block font-bold text-[var(--color-psychoanalysis)] border-b border-[var(--border-subtle)] pb-1 mb-1">
              {termObj.term_fa} <span className="text-[10px] text-[var(--foreground-muted)]">({termObj.term_fr})</span>
            </span>
            <span className="block text-[11px] leading-relaxed text-[var(--foreground)]">
              {termObj.conceptual_definition_fa}
            </span>
          </span>
        </span>
      );
    } else {
      result.push(matchedWord);
    }
    lastIndex = glossaryRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    result.push(text.substring(lastIndex));
  }

  return result;
}
