import { ContentPillar } from './content';

export interface LacanianGlossaryTerm {
  id: string;
  term_fa: string;
  term_fr: string;
  term_en: string;
  aliases?: string[];
  conceptual_definition_fa: string;
  conceptual_definition_fr?: string | null;
  conceptual_definition_en?: string | null;
  linked_sources?: string[];
  is_locked_translation?: boolean;
  pillar: ContentPillar;
  created_at: string;
  updated_at: string;
}
