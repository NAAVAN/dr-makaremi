import type { Locale } from '@makaremi/shared';
import type { RagCitation } from './research-assistant';
import {
  buildClinicalBoundaryDisclaimer,
  countWhiteLabelLeaks,
  stripVendorBrandLeaks,
} from './safety-guard';

export interface GroundingVerificationResult {
  verifiedAnswer: string;
  groundingScore: number;
  validAnchorCount: number;
  strippedInvalidAnchors: number;
  whiteLabelLeaksFound: number;
}

/**
 * Post-Generation Verification Guard:
 * 1. Validates inline citation anchors [1]..[n] against actual retrieved citations.
 * 2. Strips any accidental external AI vendor/model brand names (Strict White-Label).
 * 3. Appends mandatory clinical boundary disclaimer when triggered.
 * 4. Computes a grounding confidence score in [0, 1].
 */
export function verifyGeneratedAnswer(input: {
  answer: string;
  citations: RagCitation[];
  locale: Locale;
  needsClinicalDisclaimer?: boolean;
}): GroundingVerificationResult {
  const maxIdx = input.citations.length;
  let validAnchorCount = 0;
  let strippedInvalidAnchors = 0;

  let cleaned = (input.answer || '').replace(/\[(\d{1,2})\]/g, (full, numStr) => {
    const num = Number(numStr);
    if (num >= 1 && num <= maxIdx) {
      validAnchorCount++;
      return full;
    }
    strippedInvalidAnchors++;
    return '';
  });

  const whiteLabelLeaksFound = countWhiteLabelLeaks(cleaned);
  if (whiteLabelLeaksFound > 0) {
    cleaned = stripVendorBrandLeaks(cleaned, input.locale);
  }

  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

  if (input.needsClinicalDisclaimer) {
    const disclaimer = buildClinicalBoundaryDisclaimer(input.locale);
    if (!cleaned.includes(disclaimer.slice(0, 28))) {
      cleaned = `${cleaned}\n\n---\n${disclaimer}`;
    }
  }

  let groundingScore = 0;
  if (maxIdx === 0) {
    groundingScore = 1.0; // Clean refusal with zero citations fabricated
  } else {
    const anchorRatio = Math.min(1, validAnchorCount / Math.min(2, maxIdx));
    const penalty = Math.min(0.4, strippedInvalidAnchors * 0.15);
    groundingScore = Number(Math.max(0.35, Math.min(1.0, 0.55 + anchorRatio * 0.45 - penalty)).toFixed(2));
  }

  return {
    verifiedAnswer: cleaned,
    groundingScore,
    validAnchorCount,
    strippedInvalidAnchors,
    whiteLabelLeaksFound,
  };
}
