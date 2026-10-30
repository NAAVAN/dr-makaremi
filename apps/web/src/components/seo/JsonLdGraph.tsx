import React from 'react';
import { serializeSafeJsonLd } from '@/lib/schema-org';

interface JsonLdGraphProps {
  data: unknown;
}

/**
 * Renders a strict, XSS-immune <script type="application/ld+json"> tag.
 * All dynamic values are serialized via serializeSafeJsonLd() ensuring
 * raw `<` or `>` characters can NEVER break out of the script tag.
 */
export function JsonLdGraph({ data }: JsonLdGraphProps) {
  if (!data) return null;

  const safeJson = serializeSafeJsonLd(data);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson }}
    />
  );
}
