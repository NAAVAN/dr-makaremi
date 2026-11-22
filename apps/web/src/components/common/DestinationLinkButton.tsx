import React from 'react';
import {
  BookOpen,
  ExternalLink,
  FileText,
  Globe,
  Image as ImageIcon,
  Play,
  Share2,
} from 'lucide-react';
import type { Locale } from '@makaremi/shared';
import { classifyDestinationUrl, type LinkDestinationKind } from '@/lib/link-labeler';

interface DestinationLinkButtonProps {
  href: string;
  label?: string;
  locale?: Locale;
  compact?: boolean;
  className?: string;
}

function getIconForKind(kind: LinkDestinationKind) {
  switch (kind) {
    case 'video':
      return Play;
    case 'image':
      return ImageIcon;
    case 'pdf':
      return FileText;
    case 'book':
      return BookOpen;
    case 'social':
      return Share2;
    default:
      return Globe;
  }
}

export function DestinationLinkButton({
  href,
  label,
  locale = 'fa',
  compact = false,
  className = '',
}: DestinationLinkButtonProps) {
  const info = classifyDestinationUrl(href, locale, label);
  const Icon = getIconForKind(info.kind);
  const isExternal = /^https?:\/\//i.test(info.href);

  return (
    <a
      href={info.href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className={`inline-flex items-center gap-1.5 rounded-xl bg-[var(--surface-sunken)] hover:bg-[var(--primary-light)] border border-[var(--border-medium)] hover:border-[var(--primary)] text-[var(--primary)] font-bold no-underline transition-colors align-middle ${
        compact ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-xs sm:text-sm my-0.5'
      } ${className}`}
    >
      <Icon size={compact ? 13 : 14} strokeWidth={1.75} className="shrink-0" />
      <span>{info.label}</span>
      {isExternal && <ExternalLink size={compact ? 11 : 12} className="shrink-0 opacity-75" />}
    </a>
  );
}
