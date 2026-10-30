import { z } from 'zod';
import { ContentPillarSchema } from './article.schema';

export const BookGeoLinkSchema = z.object({
  platform: z.string(),
  url: z.string().url(),
  label: z.string(),
});

export const BookTranslationSchema = z.object({
  id: z.string().uuid().optional(),
  books_id: z.string().uuid().optional(),
  languages_code: z.enum(['fa-IR', 'fr-FR', 'en-US']),
  title: z.string().min(2).max(255),
  subtitle: z.string().max(255).nullable().optional(),
  publisher_name: z.string().min(2).max(150),
  publication_city: z.string().max(100).nullable().optional(),
  synopsis: z.string().min(10),
  table_of_contents_markdown: z.string().nullable().optional(),
  sample_chapter_markdown: z.string().nullable().optional(),
  sample_flipbook_pdf_id: z.string().uuid().nullable().optional(),
  geo_acquisition_links: z.object({
    iran: z.array(BookGeoLinkSchema).default([]),
    international: z.array(BookGeoLinkSchema).default([]),
  }).default({ iran: [], international: [] }),
});

export const BookSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(2).max(255).regex(/^[a-z0-9-]+$/),
  isbn_13: z.string().max(17).nullable().optional(),
  publication_year: z.number().int().min(1950).max(2100),
  page_count: z.number().int().positive().nullable().optional(),
  pillar: ContentPillarSchema,
  cover_3d_front_id: z.string().uuid().nullable().optional(),
  cover_3d_spine_id: z.string().uuid().nullable().optional(),
  cover_3d_back_id: z.string().uuid().nullable().optional(),
  author_audio_commentary_id: z.string().uuid().nullable().optional(),
  order_index: z.number().int().default(0),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
  translations: z.array(BookTranslationSchema).optional(),
});

export type BookInput = z.infer<typeof BookSchema>;
