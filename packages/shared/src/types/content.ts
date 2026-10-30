export type ContentPillar =
  | 'psychoanalysis'
  | 'art_calligraphy'
  | 'cultural_strategy'
  | 'human_rights_dadkhahi';

export type ContentStatus = 'draft' | 'review_pending' | 'published' | 'archived';

export interface ArticleTranslation {
  id: string;
  articles_id: string;
  languages_code: string;
  title: string;
  executive_summary: string;
  body_markdown: string;
  meta_title?: string | null;
  meta_description?: string | null;
  canonical_url?: string | null;
}

export interface Article {
  id: string;
  slug: string;
  pillar: ContentPillar;
  status: ContentStatus;
  cover_image_id?: string | null;
  audio_summary_file_id?: string | null;
  content_sha256: string;
  signature_ed25519?: string | null;
  canonical_digest?: string | null;
  embedding?: number[] | null;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  translations?: ArticleTranslation[];
}

export interface BookGeoLinks {
  iran: Array<{ platform: string; url: string; label: string }>;
  international: Array<{ platform: string; url: string; label: string }>;
}

export interface BookTranslation {
  id: string;
  books_id: string;
  languages_code: string;
  title: string;
  subtitle?: string | null;
  publisher_name: string;
  publication_city?: string | null;
  synopsis: string;
  table_of_contents_markdown?: string | null;
  sample_chapter_markdown?: string | null;
  sample_flipbook_pdf_id?: string | null;
  geo_acquisition_links: BookGeoLinks;
}

export interface Book {
  id: string;
  slug: string;
  isbn_13?: string | null;
  publication_year: number;
  page_count?: number | null;
  pillar: ContentPillar;
  cover_3d_front_id?: string | null;
  cover_3d_spine_id?: string | null;
  cover_3d_back_id?: string | null;
  author_audio_commentary_id?: string | null;
  order_index: number;
  status: ContentStatus;
  created_at: string;
  translations?: BookTranslation[];
}

export interface ArtworkTranslation {
  id: string;
  artworks_id: string;
  languages_code: string;
  title: string;
  description_markdown?: string | null;
  curator_critique_markdown?: string | null;
}

export interface Artwork {
  id: string;
  slug: string;
  iiif_image_id: string;
  year: number;
  dimensions?: string | null;
  medium: string;
  artform: 'calligraphy' | 'painting' | 'drawing';
  linked_poem_id?: string | null;
  audio_recitation_file_id?: string | null;
  status: ContentStatus;
  created_at: string;
  translations?: ArtworkTranslation[];
}

export interface ExhibitionTranslation {
  id: string;
  exhibitions_id: string;
  languages_code: string;
  title: string;
  curatorial_statement_markdown?: string | null;
}

export interface Exhibition {
  id: string;
  slug: string;
  start_date: string;
  end_date?: string | null;
  venue_city: string;
  venue_name: string;
  status: ContentStatus;
  created_at: string;
  translations?: ExhibitionTranslation[];
  artworks?: Artwork[];
}

export interface PoemVerse {
  line_index: number;
  hemistich_a: string;
  hemistich_b?: string;
  translation_text?: string;
}

export interface PoemTranslation {
  id: string;
  poems_id: string;
  languages_code: string;
  title: string;
  verses: PoemVerse[];
  commentary_markdown?: string | null;
}

export interface Poem {
  id: string;
  slug: string;
  creation_year?: number | null;
  audio_recitation_file_id?: string | null;
  linked_artwork_id?: string | null;
  status: ContentStatus;
  created_at: string;
  translations?: PoemTranslation[];
}

export interface VideoSpeechTranslation {
  id: string;
  videos_speeches_id: string;
  languages_code: string;
  title: string;
  description?: string | null;
  transcript_markdown?: string | null;
}

export interface VideoSpeech {
  id: string;
  slug: string;
  event_date: string;
  event_location?: string | null;
  pillar: ContentPillar;
  youtube_video_id?: string | null;
  self_hosted_hls_url?: string | null;
  self_hosted_audio_url?: string | null;
  duration_seconds?: number | null;
  status: ContentStatus;
  created_at: string;
  translations?: VideoSpeechTranslation[];
}
