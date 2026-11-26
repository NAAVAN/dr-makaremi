import type { ContentPillar } from './content';
import type { Locale } from './i18n';

export type RagDocumentType =
  | 'article'
  | 'book'
  | 'speech'
  | 'poem'
  | 'exhibition'
  | 'page'
  | 'artwork'
  | 'commerce'
  | 'glossary'
  | 'golden_qa'
  | 'training_note';

export interface RagChatHistoryTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiGoldenQaItem {
  id: string;
  locale: Locale;
  pillar: ContentPillar;
  questionCanonical: string;
  questionVariants: string[];
  answerMarkdown: string;
  linkedUrls: string[];
  priorityBoost: number;
  status: 'draft' | 'published' | 'archived';
  contentSha256: string;
  signatureEd25519: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiClinicalBoundaryPolicy {
  enableCrisisDetection: boolean;
  blockMedicalDiagnosis: boolean;
  appendDisclaimerOnClinicalQueries: boolean;
  helplineFrance: string;
  helplineIran: string;
  helplineInternationalUrl: string;
}

export interface AiCitationPolicy {
  requireInlineAnchors: boolean;
  minGroundingConfidence: number;
  maxCitationsPerAnswer: number;
  allowCrossLingualSources: boolean;
  enforceStrictWhiteLabel: boolean;
}

export interface AiProviderRoutingPolicy {
  primaryProfile: 'literary_balanced' | 'literary_deep' | 'concise_fast';
  enableFastFallback: boolean;
  enableDeterministicFallback: boolean;
  requestTimeoutMs: number;
  maxOutputTokens: number;
  temperature: number;
}

export interface AiPersonaVersion {
  versionId: number;
  label: string;
  isActive: boolean;
  systemConstitutionFa: string;
  systemConstitutionFr: string;
  systemConstitutionEn: string;
  clinicalBoundaryPolicy: AiClinicalBoundaryPolicy;
  citationPolicy: AiCitationPolicy;
  providerRouting: AiProviderRoutingPolicy;
  monthlyTokenBudget: number;
  signatureEd25519: string;
  createdAt: string;
}

export interface AiGlossaryTermExtended {
  id: string;
  term_fa: string;
  term_fr: string;
  term_en: string;
  aliases: string[];
  conceptual_definition_fa: string;
  conceptual_definition_fr: string;
  conceptual_definition_en: string;
  pillar: ContentPillar;
  linked_sources: string[];
  is_locked_translation: boolean;
  created_at: string;
  updated_at: string;
}

export type ConceptEdgeRelation =
  | 'broader'
  | 'narrower'
  | 'contrasts_with'
  | 'clinical_application'
  | 'literary_echo'
  | 'related';

export interface AiConceptEdge {
  id?: number;
  sourceTermId: string;
  targetTermId: string;
  relationType: ConceptEdgeRelation;
  noteFa?: string;
}

export interface AiTrainingDocument {
  id: string;
  slug: string;
  title: string;
  sourceFormat: 'markdown' | 'pdf_text' | 'docx_text' | 'srt_vtt' | 'voice_note' | 'facebook_thread';
  locale: Locale;
  pillar: ContentPillar;
  bodyMarkdown: string;
  wordCount: number;
  chunkCount: number;
  status: 'draft' | 'indexed' | 'archived';
  contentSha256: string;
  signatureEd25519: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiQueryTelemetryRecord {
  id: string;
  sessionHash: string;
  locale: Locale;
  pillarFilter: string;
  querySanitized: string;
  topScore: number;
  citationCount: number;
  isKnowledgeGap: boolean;
  engineTier: 'primary' | 'fallback_fast' | 'deterministic' | 'crisis_guard';
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  resolvedGoldenQaId?: string | null;
  createdAt: string;
}

export interface AiFeedbackEvent {
  id: string;
  telemetryId?: string | null;
  queryPreview?: string;
  locale?: Locale;
  rating: -1 | 1;
  issueCategory?: 'inaccurate' | 'missing_source' | 'wrong_language' | 'tone' | 'citation_link' | 'other';
  userNote?: string;
  triagedStatus: 'open' | 'converted_to_qa' | 'dismissed';
  createdAt: string;
}

export interface AiEvalCaseResult {
  id: string;
  category: string;
  locale: Locale;
  query: string;
  passed: boolean;
  recallHit: boolean;
  citationGrounded: boolean;
  whiteLabelClean: boolean;
  safetyCompliant: boolean;
  latencyMs: number;
  notes?: string;
}

export interface AiEvalRunSummary {
  id: string;
  personaVersionId: number;
  engineProfile: string;
  totalCases: number;
  passedCases: number;
  recallAt5: number;
  mrr: number;
  citationFaithfulness: number;
  refusalAccuracy: number;
  crisisSafetyRate: number;
  whiteLabelLeaks: number;
  cases: AiEvalCaseResult[];
  createdAt: string;
}

export interface AiTrainingTelemetryOverview {
  storageMode: 'neon_postgres' | 'local_file_fallback';
  pgvectorAvailable: boolean;
  embeddedChunkCount: number;
  totalQueries: number;
  knowledgeGapCount: number;
  positiveFeedbackCount: number;
  negativeFeedbackCount: number;
  monthlyTokensUsed: number;
  monthlyTokenBudget: number;
  recentKnowledgeGaps: AiQueryTelemetryRecord[];
  recentFeedback: AiFeedbackEvent[];
  latestEvalRun: AiEvalRunSummary | null;
}
